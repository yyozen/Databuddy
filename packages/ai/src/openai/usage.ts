import type { OpenAIUsage } from "./types";

/** Extracts usage from OpenAI response */
export function extractUsage(usage?: {
	prompt_tokens?: number;
	completion_tokens?: number;
	prompt_tokens_details?: { cached_tokens?: number };
	completion_tokens_details?: { reasoning_tokens?: number };
}): OpenAIUsage {
	const inputTokens = usage?.prompt_tokens ?? 0;
	const outputTokens = usage?.completion_tokens ?? 0;

	return {
		inputTokens,
		outputTokens,
		totalTokens: inputTokens + outputTokens,
		cachedInputTokens: usage?.prompt_tokens_details?.cached_tokens,
		reasoningTokens: usage?.completion_tokens_details?.reasoning_tokens,
	};
}

/** Extracts web search count from OpenAI response */
export function getWebSearchCount(response: unknown): number {
	if (response && typeof response === "object" && "usage" in response) {
		const usage = (response as { usage: unknown }).usage;
		if (usage && typeof usage === "object" && "search_context_size" in usage) {
			const size = (usage as { search_context_size: unknown })
				.search_context_size;
			if (size) {
				return 1;
			}
		}
	}
	return 0;
}
