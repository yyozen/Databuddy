import type { OpenAIMessage, OpenAIMessageContent } from "./types";

const MAX_LENGTH = 100_000;

function truncate(text: string, maxLength = MAX_LENGTH): string {
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength)}... [truncated]`;
}

/** Formats OpenAI messages to our Message format */
export function formatMessages(
	messages: Array<{
		role: string;
		content?:
			| string
			| Array<{ type: string; text?: string; [key: string]: unknown }>
			| null;
		tool_calls?: Array<{
			id: string;
			function: { name: string; arguments: string };
		}>;
	}>
): OpenAIMessage[] {
	return messages.map((msg) => {
		// Simple text content
		if (typeof msg.content === "string") {
			return { role: msg.role, content: truncate(msg.content) };
		}

		// Array content (vision, etc.)
		if (Array.isArray(msg.content)) {
			const content: OpenAIMessageContent[] = msg.content.map((part) => {
				if (part.type === "text" && part.text) {
					return { type: "text", text: truncate(part.text) };
				}
				return { type: part.type };
			});
			return { role: msg.role, content };
		}

		// Tool calls
		if (msg.tool_calls?.length) {
			const content: OpenAIMessageContent[] = msg.tool_calls.map((tc) => ({
				type: "tool-call",
				id: tc.id,
				function: {
					name: tc.function.name,
					arguments: truncate(tc.function.arguments),
				},
			}));
			return { role: msg.role, content };
		}

		return { role: msg.role, content: "" };
	});
}

/** Formats OpenAI response to our Message format */
export function formatResponse(response: {
	choices?: Array<{
		message?: {
			role?: string;
			content?: string | null;
			tool_calls?: Array<{
				id: string;
				function: { name: string; arguments: string };
			}>;
		};
	}>;
}): OpenAIMessage[] {
	const message = response.choices?.[0]?.message;
	if (!message) {
		return [];
	}

	// Tool calls response
	if (message.tool_calls?.length) {
		const content: OpenAIMessageContent[] = message.tool_calls.map((tc) => ({
			type: "tool-call",
			id: tc.id,
			function: {
				name: tc.function.name,
				arguments: truncate(tc.function.arguments),
			},
		}));
		return [{ role: message.role ?? "assistant", content }];
	}

	// Text response
	if (message.content) {
		return [
			{ role: message.role ?? "assistant", content: truncate(message.content) },
		];
	}

	return [];
}

/** Builds output messages from streaming data */
export function formatStreamOutput(
	text: string,
	toolCalls: Map<number, { id: string; name: string; arguments: string }>
): OpenAIMessage[] {
	const content: OpenAIMessageContent[] = [];

	if (text) {
		content.push({ type: "text", text: truncate(text) });
	}

	for (const tc of Array.from(toolCalls.values())) {
		if (tc.name) {
			content.push({
				type: "tool-call",
				id: tc.id,
				function: { name: tc.name, arguments: truncate(tc.arguments) },
			});
		}
	}

	if (content.length === 0) {
		return [];
	}

	// Simplify if just text
	if (content.length === 1 && content[0].type === "text") {
		return [
			{ role: "assistant", content: (content[0] as { text: string }).text },
		];
	}

	return [{ role: "assistant", content }];
}
