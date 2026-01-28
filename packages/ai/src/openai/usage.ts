import type { Usage } from "../shared/types";

/** Extracts usage from OpenAI response */
export function extractUsage(usage?: {
	prompt_tokens?: number;
	completion_tokens?: number;
	prompt_tokens_details?: { cached_tokens?: number };
	completion_tokens_details?: { reasoning_tokens?: number };
}): Usage {
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

/** Detects web search usage from OpenAI response */
export function getWebSearchCount(response: unknown): number {
	if (!response || typeof response !== "object") {
		return 0;
	}

	// Check usage.search_context_size (Perplexity via OpenRouter)
	if (
		"usage" in response &&
		typeof response.usage === "object" &&
		response.usage &&
		"search_context_size" in response.usage &&
		response.usage.search_context_size
	) {
		return 1;
	}

	// Check for annotations with url_citation in choices
	if ("choices" in response && Array.isArray(response.choices)) {
		for (const choice of response.choices) {
			if (typeof choice !== "object" || !choice) {
				continue;
			}

			const msg =
				"message" in choice
					? choice.message
					: "delta" in choice
						? choice.delta
						: null;
			if (!msg || typeof msg !== "object") {
				continue;
			}

			if ("annotations" in msg && Array.isArray(msg.annotations)) {
				const hasUrlCitation = msg.annotations.some(
					(ann: unknown) =>
						typeof ann === "object" &&
						ann &&
						"type" in ann &&
						ann.type === "url_citation"
				);
				if (hasUrlCitation) {
					return 1;
				}
			}
		}
	}

	return 0;
}
