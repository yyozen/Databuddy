import type {
	DiscordEmbed,
	DiscordPayload,
	NotificationPayload,
	NotificationPriority,
	NotificationResult,
} from "../types";
import { BaseProvider } from "./base";

export interface DiscordProviderConfig {
	webhookUrl: string;
	username?: string;
	avatarUrl?: string;
	timeout?: number;
	retries?: number;
	retryDelay?: number;
}

export class DiscordProvider extends BaseProvider {
	private readonly webhookUrl: string;
	private readonly username?: string;
	private readonly avatarUrl?: string;

	constructor(config: DiscordProviderConfig) {
		super({
			timeout: config.timeout,
			retries: config.retries,
			retryDelay: config.retryDelay,
		});
		this.webhookUrl = config.webhookUrl;
		this.username = config.username;
		this.avatarUrl = config.avatarUrl;
	}

	async send(payload: NotificationPayload): Promise<NotificationResult> {
		if (!this.webhookUrl) {
			return {
				success: false,
				channel: "discord",
				error: "Discord webhook URL not configured",
			};
		}

		try {
			const discordPayload = this.buildDiscordPayload(payload);
			const response = await this.withRetry(async () => {
				const res = await fetch(this.webhookUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(discordPayload),
				});

				if (!res.ok) {
					const responseText = await res
						.text()
						.catch(() => "Unable to read response");
					throw new Error(
						`Discord API error: ${res.status} ${res.statusText} - ${responseText.slice(0, 200)}`
					);
				}

				return res;
			});

			return {
				success: true,
				channel: "discord",
				response: {
					status: response.status,
					statusText: response.statusText,
				},
			};
		} catch (error) {
			return {
				success: false,
				channel: "discord",
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	private buildDiscordPayload(payload: NotificationPayload): DiscordPayload {
		const color = this.getPriorityColor(payload.priority);

		const embed: DiscordEmbed = {
			title: payload.title,
			description: payload.message,
			color,
			timestamp: new Date().toISOString(),
		};

		if (payload.metadata && Object.keys(payload.metadata).length > 0) {
			embed.fields = Object.entries(payload.metadata).map(([name, value]) => ({
				name,
				value: String(value),
				inline: true,
			}));
		}

		const discordPayload: DiscordPayload = {
			embeds: [embed],
		};

		if (this.username) {
			discordPayload.username = this.username;
		}
		if (this.avatarUrl) {
			discordPayload.avatar_url = this.avatarUrl;
		}

		return discordPayload;
	}

	private getPriorityColor(priority?: NotificationPriority): number {
		switch (priority) {
			case "urgent":
				return 15_158_720; // Red
			case "high":
				return 16_771_200; // Orange
			case "low":
				return 8_442_624; // Blue
			case "normal":
				return 5_763_719; // Green
			default:
				return 5_763_719; // Green
		}
	}
}
