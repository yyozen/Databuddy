import type { LLMCall, Transport } from "./types";

const DEFAULT_API_URL = "https://basket.databuddy.cc/llm";

/** Creates the default HTTP transport for sending LLM calls to Databuddy */
export function createTransport(apiUrl?: string, apiKey?: string): Transport {
	const url = apiUrl ?? process.env.DATABUDDY_API_URL ?? DEFAULT_API_URL;
	const key = apiKey ?? process.env.DATABUDDY_API_KEY;

	return async (call) => {
		const headers: HeadersInit = { "Content-Type": "application/json" };
		if (key) {
			headers.Authorization = `Bearer ${key}`;
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

/** Creates a custom HTTP transport */
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
