import type {
	LanguageModelV2,
	LanguageModelV2Prompt,
	LanguageModelV2StreamPart,
	LanguageModelV3,
	LanguageModelV3Prompt,
	LanguageModelV3StreamPart,
} from "@ai-sdk/provider";

/** Vercel AI SDK language model (v2 or v3) */
export type Model = LanguageModelV2 | LanguageModelV3;

/** Prompt format for language models */
export type Prompt = LanguageModelV2Prompt | LanguageModelV3Prompt;

/** Stream chunk types */
export type StreamChunk = LanguageModelV2StreamPart | LanguageModelV3StreamPart;

/** Extracts the provider name from a model (e.g., "openai" from "openai.chat") */
export function getProvider(model: Model): string {
	return model.provider.toLowerCase().split(".")[0];
}

/** Checks if model uses v3 specification */
export function isV3(model: Model): model is LanguageModelV3 {
	return model.specificationVersion === "v3";
}
