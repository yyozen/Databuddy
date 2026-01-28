import type { Message, MessageContent } from "../shared/types";
import { extractText, redactBase64, truncate } from "../shared/utils";
import type { Prompt } from "./providers";

/** Converts a Vercel AI SDK prompt to our Message format */
export function promptToMessages(prompt: Prompt, maxSize: number): Message[] {
	const messages: Message[] = prompt.map((msg) => {
		if (msg.role === "system") {
			return { role: "system", content: truncate(extractText(msg.content)) };
		}

		if (Array.isArray(msg.content)) {
			return { role: msg.role, content: msg.content.map(mapContentPart) };
		}

		return { role: msg.role, content: truncate(extractText(msg.content)) };
	});

	return trimToSize(messages, maxSize);
}

/** Converts model output content to our Message format */
export function outputToMessages(
	content: Array<{
		type: string;
		text?: string;
		toolCallId?: string;
		toolName?: string;
		input?: unknown;
		data?: unknown;
		mediaType?: string;
		sourceType?: string;
		id?: string;
		url?: string;
		title?: string;
	}>
): Message[] {
	const mapped: MessageContent[] = content.map((item) => {
		switch (item.type) {
			case "text":
				return { type: "text", text: truncate(item.text ?? "") };
			case "reasoning":
				return { type: "reasoning", text: truncate(item.text ?? "") };
			case "tool-call":
				return mapToolCall(item);
			case "file":
				return mapFile(item);
			case "source":
				return {
					type: "source",
					sourceType: item.sourceType ?? "unknown",
					id: item.id ?? "",
					url: item.url ?? "",
					title: item.title ?? "",
				};
			default:
				return { type: "text", text: truncate(JSON.stringify(item)) };
		}
	});

	if (mapped.length === 0) {
		return [];
	}

	const content_ =
		mapped.length === 1 && mapped[0].type === "text"
			? (mapped[0] as { text: string }).text
			: mapped;

	return [{ role: "assistant", content: content_ }];
}

/** Builds output messages from streaming data */
export function streamToMessages(
	text: string,
	reasoning: string,
	toolCalls: Map<
		string,
		{ toolCallId: string; toolName: string; input: string }
	>,
	sources: Array<{
		sourceType: string;
		id: string;
		url: string;
		title: string;
	}> = []
): Message[] {
	const content: MessageContent[] = [];

	if (reasoning) {
		content.push({ type: "reasoning", text: truncate(reasoning) });
	}
	if (text) {
		content.push({ type: "text", text: truncate(text) });
	}

	for (const call of toolCalls.values()) {
		content.push({
			type: "tool-call",
			id: call.toolCallId,
			function: { name: call.toolName, arguments: truncate(call.input) },
		});
	}

	for (const src of sources) {
		content.push({ type: "source", ...src });
	}

	if (content.length === 0) {
		return [];
	}

	const content_ =
		content.length === 1 && content[0].type === "text"
			? (content[0] as { text: string }).text
			: content;

	return [{ role: "assistant", content: content_ }];
}

// --- Helpers ---

function mapContentPart(c: {
	type: string;
	[key: string]: unknown;
}): MessageContent {
	switch (c.type) {
		case "text":
			return { type: "text", text: truncate(c.text as string) };
		case "file": {
			const data = c.data;
			const file =
				data instanceof URL
					? data.toString()
					: typeof data === "string"
						? redactBase64(data)
						: "[binary file]";
			return { type: "file", file, mediaType: c.mediaType as string };
		}
		case "image": {
			const data = c.image;
			const image =
				data instanceof URL
					? data.toString()
					: typeof data === "string"
						? redactBase64(data)
						: "[binary image]";
			return {
				type: "image",
				image,
				mediaType: (c.mimeType as string) ?? "image/unknown",
			};
		}
		case "tool-call": {
			const input = c.input;
			return {
				type: "tool-call",
				id: c.toolCallId as string,
				function: {
					name: c.toolName as string,
					arguments: truncate(
						typeof input === "string" ? input : JSON.stringify(input ?? {})
					),
				},
			};
		}
		case "tool-result":
			return {
				type: "tool-result",
				toolCallId: c.toolCallId as string,
				toolName: c.toolName as string,
				output: c.output,
				isError: false,
			};
		default:
			return { type: "text", text: "" };
	}
}

function mapToolCall(item: {
	toolCallId?: string;
	toolName?: string;
	input?: unknown;
	args?: unknown;
	arguments?: unknown;
}): MessageContent {
	const rawArgs = item.args ?? item.arguments ?? item.input;
	const args =
		typeof rawArgs === "string" ? rawArgs : JSON.stringify(rawArgs ?? {});

	return {
		type: "tool-call",
		id: item.toolCallId ?? "",
		function: { name: item.toolName ?? "", arguments: truncate(args) },
	};
}

function mapFile(item: { data?: unknown; mediaType?: string }): MessageContent {
	let file: string;

	if (item.data instanceof URL) {
		file = item.data.toString();
	} else if (typeof item.data === "string") {
		file = redactBase64(item.data);
		if (file === item.data && item.data.length > 1000) {
			file = `[${item.mediaType ?? "unknown"} file - ${item.data.length} bytes]`;
		}
	} else {
		file = "[binary file]";
	}

	return {
		type: "file",
		file,
		mediaType: item.mediaType ?? "application/octet-stream",
	};
}

function trimToSize(messages: Message[], maxSize: number): Message[] {
	try {
		let json = JSON.stringify(messages);
		let removed = 0;
		const total = messages.length;

		for (
			let i = 0;
			i < total && Buffer.byteLength(json, "utf8") > maxSize;
			i++
		) {
			messages.shift();
			removed++;
			json = JSON.stringify(messages);
		}

		if (removed > 0) {
			messages.unshift({
				role: "system",
				content: `[${removed} message${removed === 1 ? "" : "s"} removed due to size limit]`,
			});
		}
	} catch (err) {
		console.error("[databuddy] Error processing messages:", err);
		return [{ role: "system", content: "Error processing request" }];
	}

	return messages;
}
