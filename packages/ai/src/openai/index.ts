import { type ClientOptions, OpenAI as OpenAIOriginal } from "openai";
import type { APIPromise } from "openai/core";
import type {
	ChatCompletion,
	ChatCompletionChunk,
	ChatCompletionCreateParamsNonStreaming,
	ChatCompletionCreateParamsStreaming,
} from "openai/resources/chat/completions";
import type { Stream } from "openai/streaming";

import { computeCost } from "../shared/costs";
import { createTransport } from "../shared/transport";
import type { Cost, ToolInfo, Usage } from "../shared/types";
import { createErrorInfo, createTraceId, getHttpStatus } from "../shared/utils";
import { formatMessages, formatResponse, formatStreamOutput } from "./messages";
import { extractUsage, getWebSearchCount } from "./usage";

export { httpTransport } from "../shared/transport";
export type {
	CallOptions,
	LLMCall,
	TrackerOptions,
	Transport,
} from "../shared/types";
export { createTraceId } from "../shared/utils";

interface DatabuddyOpenAIConfig extends ClientOptions {
	databuddy?: TrackerOptions;
}

type CreateParams = (
	| ChatCompletionCreateParamsNonStreaming
	| ChatCompletionCreateParamsStreaming
) & { databuddy?: CallOptions };

interface TransportConfig {
	transport: (call: import("../shared/types").LLMCall) => Promise<void> | void;
	computeCosts: boolean;
	privacyMode: boolean;
	onSuccess?: (call: import("../shared/types").LLMCall) => void;
	onError?: (call: import("../shared/types").LLMCall) => void;
}

/** OpenAI client with Databuddy observability */
export class OpenAI extends OpenAIOriginal {
	private readonly db: TransportConfig;
	chat: DatabuddyChat;

	constructor(config: DatabuddyOpenAIConfig = {}) {
		const { databuddy, ...openAIConfig } = config;
		super(openAIConfig);

		this.db = {
			transport:
				databuddy?.transport ??
				createTransport(databuddy?.apiUrl, databuddy?.apiKey),
			computeCosts: databuddy?.computeCosts ?? true,
			privacyMode: databuddy?.privacyMode ?? false,
			onSuccess: databuddy?.onSuccess,
			onError: databuddy?.onError,
		};

		this.chat = new DatabuddyChat(this, this.db);
	}
}

class DatabuddyChat extends OpenAIOriginal.Chat {
	completions: DatabuddyCompletions;

	constructor(client: OpenAI, db: TransportConfig) {
		super(client);
		this.completions = new DatabuddyCompletions(client, db);
	}
}

class DatabuddyCompletions extends OpenAIOriginal.Chat.Completions {
	private readonly db: TransportConfig;
	private readonly baseURL: string;

	constructor(client: OpenAIOriginal, db: TransportConfig) {
		super(client);
		this.db = db;
		this.baseURL = client.baseURL;
	}

	create(
		body: ChatCompletionCreateParamsNonStreaming & { databuddy?: CallOptions }
	): APIPromise<ChatCompletion>;
	create(
		body: ChatCompletionCreateParamsStreaming & { databuddy?: CallOptions }
	): APIPromise<Stream<ChatCompletionChunk>>;
	create(
		body: CreateParams
	): APIPromise<ChatCompletion | Stream<ChatCompletionChunk>> {
		const { databuddy: opts, ...params } = body;
		const startTime = Date.now();
		const traceId = opts?.traceId ?? createTraceId();
		const isPrivate = opts?.privacyMode ?? this.db.privacyMode;
		const shouldCost = opts?.computeCosts ?? this.db.computeCosts;
		const onSuccess = opts?.onSuccess ?? this.db.onSuccess;
		const onError = opts?.onError ?? this.db.onError;

		const sendCall = (call: import("../shared/types").LLMCall) => {
			Promise.resolve(this.db.transport(call)).catch((err) => {
				console.error("[databuddy] Failed to send LLM log:", err);
			});
			if (call.error) {
				onError?.(call);
			} else {
				onSuccess?.(call);
			}
		};

		const input = isPrivate
			? []
			: formatMessages(params.messages as Parameters<typeof formatMessages>[0]);
		const tools: ToolInfo = {
			callCount: 0,
			resultCount: 0,
			calledTools: [],
			availableTools: params.tools?.map((t) => t.function.name),
		};

		const promise = super.create(params);

		if (params.stream) {
			return promise.then((value) => {
				if (!("tee" in value)) {
					return value;
				}

				const [stream1, stream2] = value.tee();

				(async () => {
					try {
						let text = "";
						let modelFromResponse: string | undefined;
						let usage: Usage = {
							inputTokens: 0,
							outputTokens: 0,
							totalTokens: 0,
						};
						const toolCalls = new Map<
							number,
							{ id: string; name: string; arguments: string }
						>();

						for await (const chunk of stream1) {
							if (!modelFromResponse && chunk.model) {
								modelFromResponse = chunk.model;
							}

							const choice = chunk.choices?.[0];
							if (choice?.delta?.content) {
								text += choice.delta.content;
							}

							if (choice?.delta?.tool_calls) {
								for (const tc of choice.delta.tool_calls) {
									const idx = tc.index;
									if (idx === undefined) {
										continue;
									}

									if (!toolCalls.has(idx)) {
										toolCalls.set(idx, {
											id: tc.id ?? "",
											name: tc.function?.name ?? "",
											arguments: "",
										});
									}

									const inProgress = toolCalls.get(idx);
									if (inProgress) {
										if (tc.id) {
											inProgress.id = tc.id;
										}
										if (tc.function?.name) {
											inProgress.name = tc.function.name;
										}
										if (tc.function?.arguments) {
											inProgress.arguments += tc.function.arguments;
										}
									}
								}
							}

							if (chunk.usage) {
								usage = extractUsage(chunk.usage);
								usage.webSearchCount = getWebSearchCount(chunk);
							}
						}

						const durationMs = Date.now() - startTime;
						const cost: Cost =
							shouldCost && (usage.inputTokens > 0 || usage.outputTokens > 0)
								? await computeCost(
										modelFromResponse ?? params.model,
										"openai",
										usage
									)
								: {};

						tools.callCount = toolCalls.size;
						tools.calledTools = [
							...new Set(
								[...toolCalls.values()].map((t) => t.name).filter(Boolean)
							),
						];

						const call: import("../shared/types").LLMCall = {
							timestamp: new Date(),
							traceId,
							type: "stream",
							model: modelFromResponse ?? params.model,
							provider: "openai",
							input,
							output: isPrivate ? [] : formatStreamOutput(text, toolCalls),
							usage,
							cost,
							tools,
							durationMs,
							httpStatus: 200,
						};

						sendCall(call);
					} catch (error) {
						const call: import("../shared/types").LLMCall = {
							timestamp: new Date(),
							traceId,
							type: "stream",
							model: params.model,
							provider: "openai",
							input,
							output: [],
							usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
							cost: {},
							tools,
							error: createErrorInfo(error),
							durationMs: Date.now() - startTime,
							httpStatus: getHttpStatus(error),
						};
						sendCall(call);
					}
				})();

				return stream2;
			}) as APIPromise<Stream<ChatCompletionChunk>>;
		}

		return promise.then(
			async (result) => {
				const durationMs = Date.now() - startTime;
				const usage = extractUsage(result.usage);
				usage.webSearchCount = getWebSearchCount(result);

				const cost: Cost =
					shouldCost && (usage.inputTokens > 0 || usage.outputTokens > 0)
						? await computeCost(result.model ?? params.model, "openai", usage)
						: {};

				const output = isPrivate ? [] : formatResponse(result);
				const calledTools =
					result.choices?.[0]?.message?.tool_calls?.map(
						(tc) => tc.function.name
					) ?? [];

				tools.callCount = calledTools.length;
				tools.calledTools = [...new Set(calledTools)];

				const call: import("../shared/types").LLMCall = {
					timestamp: new Date(),
					traceId,
					type: "generate",
					model: result.model ?? params.model,
					provider: "openai",
					finishReason: result.choices?.[0]?.finish_reason ?? undefined,
					input,
					output,
					usage,
					cost,
					tools,
					durationMs,
					httpStatus: 200,
				};

				sendCall(call);
				return result;
			},
			(error) => {
				const call: import("../shared/types").LLMCall = {
					timestamp: new Date(),
					traceId,
					type: "generate",
					model: params.model,
					provider: "openai",
					input,
					output: [],
					usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
					cost: {},
					tools,
					error: createErrorInfo(error),
					durationMs: Date.now() - startTime,
					httpStatus: getHttpStatus(error),
				};

				sendCall(call);
				throw error;
			}
		) as APIPromise<ChatCompletion>;
	}
}
