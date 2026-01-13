import type {
	NotificationPayload,
	NotificationResult,
	SlackBlock,
	SlackPayload,
} from "../types";
import { BaseProvider } from "./base";

export interface SlackProviderConfig {
	webhookUrl: string;
	channel?: string;
	username?: string;
	iconEmoji?: string;
	iconUrl?: string;
	timeout?: number;
	retries?: number;
	retryDelay?: number;
}

export class SlackProvider extends BaseProvider {
	private readonly webhookUrl: string;
	private readonly channel?: string;
	private readonly username?: string;
	private readonly iconEmoji?: string;
	private readonly iconUrl?: string;

	constructor(config: SlackProviderConfig) {
		super({
			timeout: config.timeout,
			retries: config.retries,
			retryDelay: config.retryDelay,
		});
		this.webhookUrl = config.webhookUrl;
		this.channel = config.channel;
		this.username = config.username;
		this.iconEmoji = config.iconEmoji;
		this.iconUrl = config.iconUrl;
	}

	async send(payload: NotificationPayload): Promise<NotificationResult> {
		if (!this.webhookUrl) {
			return {
				success: false,
				channel: "slack",
				error: "Slack webhook URL not configured",
			};
		}

		try {
			const slackPayload = this.buildSlackPayload(payload);
			const response = await this.withRetry(async () => {
				const res = await fetch(this.webhookUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(slackPayload),
				});

				if (!res.ok) {
					const responseText = await res
						.text()
						.catch(() => "Unable to read response");
					throw new Error(
						`Slack API error: ${res.status} ${res.statusText} - ${responseText.slice(0, 200)}`
					);
				}

				return res;
			});

			return {
				success: true,
				channel: "slack",
				response: {
					status: response.status,
					statusText: response.statusText,
				},
			};
		} catch (error) {
			return {
				success: false,
				channel: "slack",
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	private buildSlackPayload(payload: NotificationPayload): SlackPayload {
		const blocks: SlackBlock[] = [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: payload.title,
				},
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: payload.message,
				},
			},
		];

		if (payload.metadata && Object.keys(payload.metadata).length > 0) {
			const fields = Object.entries(payload.metadata).map(([key, value]) => ({
				title: key,
				value: String(value),
				short: true,
			}));

			blocks.push({
				type: "section",
				fields,
			});
		}

		const slackPayload: SlackPayload = {
			blocks,
			text: payload.title,
		};

		if (this.channel) {
			slackPayload.channel = this.channel;
		}
		if (this.username) {
			slackPayload.username = this.username;
		}
		if (this.iconEmoji) {
			slackPayload.icon_emoji = this.iconEmoji;
		}
		if (this.iconUrl) {
			slackPayload.icon_url = this.iconUrl;
		}

		return slackPayload;
	}
}
