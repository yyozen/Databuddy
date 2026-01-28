/** Token usage statistics */
export interface AnthropicUsage {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	cachedInputTokens?: number;
	cacheCreationInputTokens?: number;
	webSearchCount?: number;
}

/** Raw Anthropic API usage format */
export interface AnthropicRawUsage {
	input_tokens?: number;
	output_tokens?: number;
	cache_creation_input_tokens?: number;
	cache_read_input_tokens?: number;
	server_tool_use?: { web_search_requests?: number };
}

/** Cost breakdown in USD */
export interface AnthropicCost {
	inputCostUSD?: number;
	outputCostUSD?: number;
	totalCostUSD?: number;
}

/** Tool usage information */
export interface AnthropicToolInfo {
	callCount: number;
	resultCount: number;
	calledTools: string[];
	availableTools?: string[];
}

/** Error details */
export interface AnthropicErrorInfo {
	name: string;
	message: string;
	stack?: string;
}

/** Message content types */
export interface AnthropicTextContent {
	type: "text";
	text: string;
}

export interface AnthropicToolCallContent {
	type: "tool-call";
	id: string;
	function: { name: string; arguments: string };
}

export interface AnthropicToolResultContent {
	type: "tool-result";
	toolCallId: string;
	toolName: string;
	output: unknown;
}

export type AnthropicMessageContent =
	| AnthropicTextContent
	| AnthropicToolCallContent
	| AnthropicToolResultContent
	| { type: string; [key: string]: unknown };

/** A message in the conversation */
export interface AnthropicMessage {
	role: string;
	content: string | AnthropicMessageContent[];
}

/** Complete LLM call record */
export interface AnthropicLLMCall {
	timestamp: Date;
	traceId: string;
	type: "generate" | "stream";
	model: string;
	provider: string;
	finishReason?: string;
	input: AnthropicMessage[];
	output: AnthropicMessage[];
	usage: AnthropicUsage;
	cost: AnthropicCost;
	tools: AnthropicToolInfo;
	error?: AnthropicErrorInfo;
	durationMs: number;
	httpStatus?: number;
}

/** Function that sends LLM call data */
export type AnthropicTransport = (
	call: AnthropicLLMCall
) => Promise<void> | void;

/** Tracker options */
export interface AnthropicTrackerOptions {
	apiUrl?: string;
	apiKey?: string;
	transport?: AnthropicTransport;
	computeCosts?: boolean;
	privacyMode?: boolean;
	onSuccess?: (call: AnthropicLLMCall) => void;
	onError?: (call: AnthropicLLMCall) => void;
}

/** Per-call options */
export interface AnthropicCallOptions {
	traceId?: string;
	computeCosts?: boolean;
	privacyMode?: boolean;
	onSuccess?: (call: AnthropicLLMCall) => void;
	onError?: (call: AnthropicLLMCall) => void;
}
