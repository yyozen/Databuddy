import type { Cost } from "./types";

/** Computes token costs using TokenLens */
export async function computeCost(
	modelId: string,
	provider: string,
	usage: { inputTokens: number; outputTokens: number }
): Promise<Cost> {
	try {
		const { computeCostUSD } = await import("tokenlens");
		const result = await computeCostUSD({
			modelId,
			provider,
			usage: {
				input_tokens: usage.inputTokens,
				output_tokens: usage.outputTokens,
			},
		});
		return {
			inputCostUSD: result.inputTokenCostUSD,
			outputCostUSD: result.outputTokenCostUSD,
			totalCostUSD: result.totalTokenCostUSD,
		};
	} catch {
		return {};
	}
}
