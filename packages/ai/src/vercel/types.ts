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
	| SourceContent;

/** A message in the conversation (input or output) */
export interface Message {
	role: string;
	content: string | MessageContent[];
}

/** Token usage statistics */
export interface Usage {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	/** Tokens read from cache (Anthropic) */
	cachedInputTokens?: number;
	/** Tokens written to cache (Anthropic) */
	cacheCreationInputTokens?: number;
	/** Reasoning/thinking tokens (o1 models) */
	reasoningTokens?: number;
	/** Number of web searches performed */
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

/** Complete LLM call record sent to Databuddy */
export interface LLMCall {
	timestamp: Date;
	traceId: string;
	type: "generate" | "stream";
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

/** Function that sends LLM call data to a destination */
export type Transport = (call: LLMCall) => Promise<void> | void;

/** Options for creating a Databuddy LLM tracker */
export interface TrackerOptions {
	/**
	 * Databuddy API endpoint
	 * @default process.env.DATABUDDY_API_URL or "https://basket.databuddy.cc/llm"
	 */
	apiUrl?: string;

	/**
	 * Databuddy API key
	 * @default process.env.DATABUDDY_API_KEY
	 */
	apiKey?: string;

	/** Custom transport function (overrides apiUrl/apiKey) */
	transport?: Transport;

	/**
	 * Calculate costs using TokenLens
	 * @default true
	 */
	computeCosts?: boolean;

	/**
	 * Don't capture input/output content
	 * @default false
	 */
	privacyMode?: boolean;

	/**
	 * Max content size in bytes before truncation
	 * @default 1048576 (1MB)
	 */
	maxContentSize?: number;

	/** Called after successful LLM calls */
	onSuccess?: (call: LLMCall) => void;

	/** Called after failed LLM calls */
	onError?: (call: LLMCall) => void;
}

/** Options for tracking a specific model */
export interface TrackOptions {
	/** Custom transport for this model */
	transport?: Transport;

	/** Trace ID to link related calls */
	traceId?: string;

	/**
	 * Calculate costs for this call
	 * @default true
	 */
	computeCosts?: boolean;

	/**
	 * Don't capture input/output for this call
	 * @default false
	 */
	privacyMode?: boolean;

	/** Called on success */
	onSuccess?: (call: LLMCall) => void;

	/** Called on error */
	onError?: (call: LLMCall) => void;
}
