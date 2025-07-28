import { handleChartResponse } from './handlers/chart-handler';
import { handleMetricResponse } from './handlers/metric-handler';
import { comprehensiveUnifiedPrompt } from './prompts/agent';
import { getAICompletion } from './utils/ai-client';
import { parseAIResponse } from './utils/response-parser';
import type { StreamingUpdate } from './utils/stream-utils';
import { generateThinkingSteps } from './utils/stream-utils';

export interface AssistantRequest {
	message: string;
	website_id: string;
	website_hostname: string;
	model?: 'chat' | 'agent' | 'agent-max';
	context?: {
		previousMessages?: Array<{
			role?: string;
			content: string;
		}>;
	};
}

export interface AssistantContext {
	user: any;
	website: any;
	debugInfo: Record<string, unknown>;
}

export async function* processAssistantRequest(
	request: AssistantRequest,
	context: AssistantContext
): AsyncGenerator<StreamingUpdate> {
	const startTime = Date.now();

	try {
		if (context.user.role === 'ADMIN') {
			context.debugInfo.validatedInput = {
				message: request.message,
				website_id: request.website_id,
				website_hostname: request.website_hostname,
			};
		}

		const aiStart = Date.now();
		const fullPrompt = comprehensiveUnifiedPrompt(
			request.message,
			request.website_id,
			request.website_hostname,
			'execute_chat',
			request.context?.previousMessages,
			undefined,
			request.model
		);

		const aiResponse = await getAICompletion({ prompt: fullPrompt });
		const aiTime = Date.now() - aiStart;

		const parsedResponse = parseAIResponse(aiResponse.content);

		if (!parsedResponse.success) {
			yield {
				type: 'error',
				content: 'AI response parsing failed. Please try rephrasing.',
				debugInfo:
					context.user.role === 'ADMIN'
						? {
								...context.debugInfo,
								parseError: parsedResponse.error,
								rawResponse: parsedResponse.rawResponse,
							}
						: undefined,
			};
			return;
		}

		const aiJson = parsedResponse.data;
		if (!aiJson) {
			yield {
				type: 'error',
				content: 'AI response data is missing.',
				debugInfo:
					context.user.role === 'ADMIN' ? context.debugInfo : undefined,
			};
			return;
		}

		// Process thinking steps
		if (aiJson.thinking_steps?.length) {
			yield* generateThinkingSteps(aiJson.thinking_steps);
		}

		// Handle different response types
		switch (aiJson.response_type) {
			case 'text':
				yield {
					type: 'complete',
					content:
						aiJson.text_response || "Here's the answer to your question.",
					data: { hasVisualization: false, responseType: 'text' },
					debugInfo:
						context.user.role === 'ADMIN' ? context.debugInfo : undefined,
				};
				break;

			case 'metric':
				yield* handleMetricResponse(aiJson, context);
				break;

			case 'chart':
				if (aiJson.sql) {
					yield* handleChartResponse(aiJson, {
						...context,
						startTime,
						aiTime,
					});
				} else {
					yield {
						type: 'error',
						content: 'Invalid chart configuration.',
						debugInfo:
							context.user.role === 'ADMIN' ? context.debugInfo : undefined,
					};
				}
				break;

			default:
				yield {
					type: 'error',
					content: 'Invalid response format from AI.',
					debugInfo:
						context.user.role === 'ADMIN' ? context.debugInfo : undefined,
				};
		}
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';

		yield {
			type: 'error',
			content: 'An unexpected error occurred.',
			debugInfo:
				context.user.role === 'ADMIN' ? { error: errorMessage } : undefined,
		};
	}
}
