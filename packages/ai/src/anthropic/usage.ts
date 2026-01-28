import type { AnthropicRawUsage, AnthropicUsage } from "./types";

export function extractUsage(usage?: AnthropicRawUsage): AnthropicUsage {
	const inputTokens = usage?.input_tokens ?? 0;
	const outputTokens = usage?.output_tokens ?? 0;

	return {
		inputTokens,
		outputTokens,
		totalTokens: inputTokens + outputTokens,
		cacheCreationInputTokens: usage?.cache_creation_input_tokens,
		cachedInputTokens: usage?.cache_read_input_tokens,
		webSearchCount: usage?.server_tool_use?.web_search_requests,
	};
}
