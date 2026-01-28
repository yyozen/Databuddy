import type { LLMCall, Transport } from "./types";

/** Creates the default HTTP transport for sending LLM calls to Databuddy */
export function createTransport(apiUrl: string, apiKey?: string): Transport {
	return async (call) => {
		const headers: HeadersInit = { "Content-Type": "application/json" };
		if (apiKey) {
			headers.Authorization = `Bearer ${apiKey}`;
		}

		const res = await fetch(apiUrl, {
			method: "POST",
			headers,
			body: JSON.stringify(call),
		});

		if (!res.ok) {
			throw new Error(
				`Failed to send LLM log: ${res.status} ${res.statusText}`
			);
		}
	};
}

/**
 * Creates an HTTP transport for sending LLM call data to a custom endpoint
 *
 * @example
 * ```ts
 * import { createTracker, httpTransport } from "@databuddy/ai/vercel";
 *
 * const { track } = createTracker({
 *   transport: httpTransport("https://your-api.com/llm-logs", "your-api-key"),
 * });
 * ```
 */
export function httpTransport(url: string, apiKey?: string): Transport {
	return async (call: LLMCall) => {
		const headers: HeadersInit = { "Content-Type": "application/json" };
		if (apiKey) {
			headers.Authorization = `Bearer ${apiKey}`;
		}

		const res = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify(call),
		});

		if (!res.ok) {
			throw new Error(
				`Failed to send LLM log: ${res.status} ${res.statusText}`
			);
		}
	};
}
