import type { NotificationProvider } from "./providers/base";
import type { DiscordProviderConfig } from "./providers/discord";
import { DiscordProvider } from "./providers/discord";
import type { EmailProviderConfig } from "./providers/email";
import { EmailProvider } from "./providers/email";
import type { SlackProviderConfig } from "./providers/slack";
import { SlackProvider } from "./providers/slack";
import type { WebhookProviderConfig } from "./providers/webhook";
import { WebhookProvider } from "./providers/webhook";
import type {
	NotificationChannel,
	NotificationOptions,
	NotificationPayload,
	NotificationResult,
} from "./types";

export interface NotificationClientConfig {
	slack?: SlackProviderConfig;
	discord?: DiscordProviderConfig;
	email?: EmailProviderConfig;
	webhook?: WebhookProviderConfig;
	defaultChannels?: NotificationChannel[];
	defaultTimeout?: number;
	defaultRetries?: number;
	defaultRetryDelay?: number;
}

export class NotificationClient {
	private readonly providers: Map<NotificationChannel, NotificationProvider>;
	private readonly defaultChannels: NotificationChannel[];
	private readonly defaultTimeout: number;
	private readonly defaultRetries: number;
	private readonly defaultRetryDelay: number;

	constructor(config: NotificationClientConfig = {}) {
		this.providers = new Map();
		this.defaultChannels = config.defaultChannels ?? [];
		this.defaultTimeout = config.defaultTimeout ?? 10_000;
		this.defaultRetries = config.defaultRetries ?? 0;
		this.defaultRetryDelay = config.defaultRetryDelay ?? 1000;

		if (config.slack) {
			this.providers.set(
				"slack",
				new SlackProvider({
					...config.slack,
					timeout: config.slack.timeout ?? this.defaultTimeout,
					retries: config.slack.retries ?? this.defaultRetries,
					retryDelay: config.slack.retryDelay ?? this.defaultRetryDelay,
				})
			);
		}

		if (config.discord) {
			this.providers.set(
				"discord",
				new DiscordProvider({
					...config.discord,
					timeout: config.discord.timeout ?? this.defaultTimeout,
					retries: config.discord.retries ?? this.defaultRetries,
					retryDelay: config.discord.retryDelay ?? this.defaultRetryDelay,
				})
			);
		}

		if (config.email) {
			this.providers.set(
				"email",
				new EmailProvider({
					...config.email,
					timeout: config.email.timeout ?? this.defaultTimeout,
					retries: config.email.retries ?? this.defaultRetries,
					retryDelay: config.email.retryDelay ?? this.defaultRetryDelay,
				})
			);
		}

		if (config.webhook) {
			this.providers.set(
				"webhook",
				new WebhookProvider({
					...config.webhook,
					timeout: config.webhook.timeout ?? this.defaultTimeout,
					retries: config.webhook.retries ?? this.defaultRetries,
					retryDelay: config.webhook.retryDelay ?? this.defaultRetryDelay,
				})
			);
		}
	}

	async send(
		payload: NotificationPayload,
		options?: NotificationOptions
	): Promise<NotificationResult[]> {
		const channels =
			options?.channels && options.channels.length > 0
				? options.channels
				: this.defaultChannels;

		if (channels.length === 0) {
			return [
				{
					success: false,
					channel: "slack",
					error: "No notification channels configured",
				},
			];
		}

		const results = await Promise.allSettled(
			channels.map(async (channel) => {
				const provider = this.providers.get(channel);
				if (!provider) {
					return {
						success: false,
						channel,
						error: `Provider for channel '${channel}' not configured`,
					} satisfies NotificationResult;
				}

				return await provider.send(payload);
			})
		);

		return results.map((result, index) => {
			if (result.status === "fulfilled") {
				return result.value;
			}
			return {
				success: false,
				channel: channels[index] ?? "slack",
				error:
					result.reason instanceof Error
						? result.reason.message
						: String(result.reason),
			} satisfies NotificationResult;
		});
	}

	async sendToChannel(
		channel: NotificationChannel,
		payload: NotificationPayload
	): Promise<NotificationResult> {
		const provider = this.providers.get(channel);
		if (!provider) {
			return {
				success: false,
				channel,
				error: `Provider for channel '${channel}' not configured`,
			};
		}

		return await provider.send(payload);
	}

	hasChannel(channel: NotificationChannel): boolean {
		return this.providers.has(channel);
	}

	getConfiguredChannels(): NotificationChannel[] {
		return Array.from(this.providers.keys());
	}
}
