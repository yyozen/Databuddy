/** Token usage statistics */
export interface Usage {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	cachedInputTokens?: number;
	cacheCreationInputTokens?: number;
	reasoningTokens?: number;
	webSearchCount?: number;
}

/** Cost breakdown in USD */
export interface Cost {
	inputCostUSD?: number;
	outputCostUSD?: number;
	totalCostUSD?: number;
}

/** Tool usage information */
export interface ToolInfo {
	callCount: number;
	resultCount: number;
	calledTools: string[];
	availableTools?: string[];
}

/** Error details for failed calls */
export interface ErrorInfo {
	name: string;
	message: string;
	stack?: string;
}

/** Text content in a message */
export interface TextContent {
	type: "text";
	text: string;
}

/** Reasoning/thinking content from models like o1 */
export interface ReasoningContent {
	type: "reasoning";
	text: string;
}

/** Tool/function call content */
export interface ToolCallContent {
	type: "tool-call";
	id: string;
	function: { name: string; arguments: string };
}

/** Tool result content */
export interface ToolResultContent {
	type: "tool-result";
	toolCallId: string;
	toolName: string;
	output: unknown;
	isError?: boolean;
}

/** File attachment content */
export interface FileContent {
	type: "file";
	file: string;
	mediaType: string;
}

/** Image attachment content */
export interface ImageContent {
	type: "image";
	image: string;
	mediaType: string;
}

/** Web search source reference */
export interface SourceContent {
	type: "source";
	sourceType: string;
	id: string;
	url: string;
	title: string;
}

/** Union of all possible message content types */
export type MessageContent =
	| TextContent
	| ReasoningContent
	| ToolCallContent
	| ToolResultContent
	| FileContent
	| ImageContent
	| SourceContent
	| { type: string; [key: string]: unknown };

/** A message in the conversation */
export interface Message {
	role: string;
	content: string | MessageContent[];
}

/** Complete LLM call record */
export interface LLMCall {
	timestamp: Date;
	traceId: string;
	type: "generate" | "stream" | "embedding";
	model: string;
	provider: string;
	finishReason?: string;
	input: Message[];
	output: Message[];
	usage: Usage;
	cost: Cost;
	tools: ToolInfo;
	error?: ErrorInfo;
	durationMs: number;
	httpStatus?: number;
}

/** Function that sends LLM call data */
export type Transport = (call: LLMCall) => Promise<void> | void;

/** Base tracker options */
export interface TrackerOptions {
	apiUrl?: string;
	apiKey?: string;
	transport?: Transport;
	computeCosts?: boolean;
	privacyMode?: boolean;
	maxContentSize?: number;
	onSuccess?: (call: LLMCall) => void;
	onError?: (call: LLMCall) => void;
}

/** Per-call tracking options */
export interface CallOptions {
	transport?: Transport;
	traceId?: string;
	computeCosts?: boolean;
	privacyMode?: boolean;
	onSuccess?: (call: LLMCall) => void;
	onError?: (call: LLMCall) => void;
}
