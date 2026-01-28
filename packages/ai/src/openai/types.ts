/** Token usage statistics */
export interface OpenAIUsage {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	cachedInputTokens?: number;
	reasoningTokens?: number;
	webSearchCount?: number;
}

/** Cost breakdown in USD */
export interface OpenAICost {
	inputCostUSD?: number;
	outputCostUSD?: number;
	totalCostUSD?: number;
}

/** Tool usage information */
export interface OpenAIToolInfo {
	callCount: number;
	resultCount: number;
	calledTools: string[];
	availableTools?: string[];
}

/** Error details */
export interface OpenAIErrorInfo {
	name: string;
	message: string;
	stack?: string;
}

/** Message content types */
export interface OpenAITextContent {
	type: "text";
	text: string;
}

export interface OpenAIToolCallContent {
	type: "tool-call";
	id: string;
	function: { name: string; arguments: string };
}

export type OpenAIMessageContent =
	| OpenAITextContent
	| OpenAIToolCallContent
	| { type: string; [key: string]: unknown };

/** A message in the conversation */
export interface OpenAIMessage {
	role: string;
	content: string | OpenAIMessageContent[];
}

/** Complete LLM call record */
export interface OpenAILLMCall {
	timestamp: Date;
	traceId: string;
	type: "generate" | "stream";
	model: string;
	provider: string;
	finishReason?: string;
	input: OpenAIMessage[];
	output: OpenAIMessage[];
	usage: OpenAIUsage;
	cost: OpenAICost;
	tools: OpenAIToolInfo;
	error?: OpenAIErrorInfo;
	durationMs: number;
	httpStatus?: number;
}

/** Function that sends LLM call data */
export type OpenAITransport = (call: OpenAILLMCall) => Promise<void> | void;

/** Tracker options */
export interface OpenAITrackerOptions {
	apiUrl?: string;
	apiKey?: string;
	transport?: OpenAITransport;
	computeCosts?: boolean;
	privacyMode?: boolean;
	onSuccess?: (call: OpenAILLMCall) => void;
	onError?: (call: OpenAILLMCall) => void;
}

/** Per-call options */
export interface OpenAICallOptions {
	traceId?: string;
	computeCosts?: boolean;
	privacyMode?: boolean;
	onSuccess?: (call: OpenAILLMCall) => void;
	onError?: (call: OpenAILLMCall) => void;
}
