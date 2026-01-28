import type { AnthropicMessage, AnthropicMessageContent } from "./types";

const MAX_LENGTH = 100_000;

function truncate(text: string, maxLength = MAX_LENGTH): string {
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength)}... [truncated]`;
}

/** Formats Anthropic messages to our Message format */
export function formatMessages(
	messages: Array<{
		role: string;
		content:
			| string
			| Array<{ type: string; text?: string; [key: string]: unknown }>;
	}>,
	system?: string | Array<{ type: string; text?: string }>
): AnthropicMessage[] {
	const result: AnthropicMessage[] = [];

	if (system) {
		const systemText =
			typeof system === "string"
				? system
				: system.map((s) => s.text ?? "").join("\n");
		if (systemText) {
			result.push({ role: "system", content: truncate(systemText) });
		}
	}

	for (const msg of messages) {
		if (typeof msg.content === "string") {
			result.push({ role: msg.role, content: truncate(msg.content) });
		} else {
			const content: AnthropicMessageContent[] = msg.content.map((part) => {
				if (part.type === "text" && part.text) {
					return { type: "text", text: truncate(part.text) };
				}
				if (part.type === "tool_use") {
					return {
						type: "tool-call",
						id: (part.id as string) ?? "",
						function: {
							name: (part.name as string) ?? "",
							arguments: truncate(JSON.stringify(part.input ?? {})),
						},
					};
				}
				if (part.type === "tool_result") {
					return {
						type: "tool-result",
						toolCallId: (part.tool_use_id as string) ?? "",
						toolName: "",
						output: part.content,
					};
				}
				return { type: "text", text: "" };
			});

			result.push({
				role: msg.role,
				content:
					content.length === 1 && content[0].type === "text"
						? (content[0] as { text: string }).text
						: content,
			});
		}
	}

	return result;
}

/** Formats Anthropic response to our Message format */
export function formatResponse(response: {
	content?: Array<{
		type: string;
		text?: string;
		id?: string;
		name?: string;
		input?: unknown;
	}>;
}): AnthropicMessage[] {
	if (!response.content?.length) {
		return [];
	}

	const content: AnthropicMessageContent[] = response.content.map((item) => {
		if (item.type === "text") {
			return { type: "text", text: truncate(item.text ?? "") };
		}
		if (item.type === "tool_use") {
			return {
				type: "tool-call",
				id: item.id ?? "",
				function: {
					name: item.name ?? "",
					arguments: truncate(JSON.stringify(item.input ?? {})),
				},
			};
		}
		return { type: "text", text: "" };
	});

	return [
		{
			role: "assistant",
			content:
				content.length === 1 && content[0].type === "text"
					? (content[0] as { text: string }).text
					: content,
		},
	];
}

/** Builds output messages from streaming data */
export function formatStreamOutput(
	contentBlocks: Array<{
		type: string;
		text?: string;
		id?: string;
		name?: string;
		arguments?: string;
	}>
): AnthropicMessage[] {
	if (contentBlocks.length === 0) {
		return [];
	}

	const content: AnthropicMessageContent[] = contentBlocks.map((block) => {
		if (block.type === "text") {
			return { type: "text", text: truncate(block.text ?? "") };
		}
		if (block.type === "tool-call") {
			return {
				type: "tool-call",
				id: block.id ?? "",
				function: {
					name: block.name ?? "",
					arguments: truncate(block.arguments ?? "{}"),
				},
			};
		}
		return { type: "text", text: "" };
	});

	return [
		{
			role: "assistant",
			content:
				content.length === 1 && content[0].type === "text"
					? (content[0] as { text: string }).text
					: content,
		},
	];
}
