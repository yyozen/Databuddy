import type { Message, MessageContent } from "../shared/types";
import { truncate } from "../shared/utils";

/** Formats OpenAI chat messages to our Message format */
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
): Message[] {
	return messages.map((msg) => {
		const content: MessageContent[] = [];

		if (typeof msg.content === "string") {
			content.push({ type: "text", text: truncate(msg.content) });
		} else if (Array.isArray(msg.content)) {
			for (const part of msg.content) {
				if (part.type === "text" && part.text) {
					content.push({ type: "text", text: truncate(part.text) });
				} else {
					content.push(part as MessageContent);
				}
			}
		}

		if (msg.tool_calls) {
			for (const tc of msg.tool_calls) {
				content.push({
					type: "tool-call",
					id: tc.id,
					function: {
						name: tc.function.name,
						arguments: truncate(tc.function.arguments),
					},
				});
			}
		}

		return {
			role: msg.role,
			content:
				content.length === 1 && content[0].type === "text"
					? (content[0] as { text: string }).text
					: content,
		};
	});
}

/** Formats OpenAI chat completion response to our Message format */
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
}): Message[] {
	const messages: Message[] = [];

	for (const choice of response.choices ?? []) {
		if (!choice.message) {
			continue;
		}

		const content: MessageContent[] = [];

		if (choice.message.content) {
			content.push({ type: "text", text: truncate(choice.message.content) });
		}

		if (choice.message.tool_calls) {
			for (const tc of choice.message.tool_calls) {
				content.push({
					type: "tool-call",
					id: tc.id,
					function: {
						name: tc.function.name,
						arguments: truncate(tc.function.arguments),
					},
				});
			}
		}

		if (content.length > 0) {
			messages.push({
				role: choice.message.role ?? "assistant",
				content:
					content.length === 1 && content[0].type === "text"
						? (content[0] as { text: string }).text
						: content,
			});
		}
	}

	return messages;
}

/** Builds output messages from streaming data */
export function formatStreamOutput(
	text: string,
	toolCalls: Map<number, { id: string; name: string; arguments: string }>
): Message[] {
	const content: MessageContent[] = [];

	if (text) {
		content.push({ type: "text", text: truncate(text) });
	}

	for (const tc of toolCalls.values()) {
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
