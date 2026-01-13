import type { NotificationPayload, NotificationResult } from "../types";
import { BaseProvider } from "./base";

export interface WebhookProviderConfig {
	url: string;
	method?: "GET" | "POST" | "PUT" | "PATCH";
	headers?: Record<string, string>;
	timeout?: number;
	retries?: number;
	retryDelay?: number;
	transformPayload?: (payload: NotificationPayload) => unknown;
}

export class WebhookProvider extends BaseProvider {
	private readonly url: string;
	private readonly method: "GET" | "POST" | "PUT" | "PATCH";
	private readonly headers?: Record<string, string>;
	private readonly transformPayload?: (payload: NotificationPayload) => unknown;

	constructor(config: WebhookProviderConfig) {
		super({
			timeout: config.timeout,
			retries: config.retries,
			retryDelay: config.retryDelay,
		});
		this.url = config.url;
		this.method = config.method ?? "POST";
		this.headers = config.headers;
		this.transformPayload = config.transformPayload;
	}

	async send(payload: NotificationPayload): Promise<NotificationResult> {
		if (!this.url) {
			return {
				success: false,
				channel: "webhook",
				error: "Webhook URL not configured",
			};
		}

		try {
			const body = this.transformPayload
				? this.transformPayload(payload)
				: payload;

			const requestInit: RequestInit = {
				method: this.method,
				headers: {
					"Content-Type": "application/json",
					...this.headers,
				},
			};

			if (this.method !== "GET" && body) {
				requestInit.body = JSON.stringify(body);
			}

			const response = await this.withRetry(async () => {
				const res = await fetch(this.url, requestInit);

				if (!res.ok) {
					const responseText = await res
						.text()
						.catch(() => "Unable to read response");
					throw new Error(
						`Webhook error: ${res.status} ${res.statusText} - ${responseText.slice(0, 200)}`
					);
				}

				return res;
			});

			const responseData = await response.json().catch(() => null);

			return {
				success: true,
				channel: "webhook",
				response: {
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
			};
		} catch (error) {
			return {
				success: false,
				channel: "webhook",
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}
}
