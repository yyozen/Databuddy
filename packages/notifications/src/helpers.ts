import { DiscordProvider } from "./providers/discord";
import { EmailProvider } from "./providers/email";
import { SlackProvider } from "./providers/slack";
import { WebhookProvider } from "./providers/webhook";
import type { NotificationPayload } from "./types";

/**
 * Send a notification to Slack via webhook
 */
export async function sendSlackWebhook(
	webhookUrl: string,
	payload: NotificationPayload,
	options?: {
		channel?: string;
		username?: string;
		iconEmoji?: string;
		iconUrl?: string;
		timeout?: number;
		retries?: number;
		retryDelay?: number;
	}
) {
	const provider = new SlackProvider({
		webhookUrl,
		channel: options?.channel,
		username: options?.username,
		iconEmoji: options?.iconEmoji,
		iconUrl: options?.iconUrl,
		timeout: options?.timeout,
		retries: options?.retries,
		retryDelay: options?.retryDelay,
	});

	return await provider.send(payload);
}

/**
 * Send a notification to Discord via webhook
 */
export async function sendDiscordWebhook(
	webhookUrl: string,
	payload: NotificationPayload,
	options?: {
		username?: string;
		avatarUrl?: string;
		timeout?: number;
		retries?: number;
		retryDelay?: number;
	}
) {
	const provider = new DiscordProvider({
		webhookUrl,
		username: options?.username,
		avatarUrl: options?.avatarUrl,
		timeout: options?.timeout,
		retries: options?.retries,
		retryDelay: options?.retryDelay,
	});

	return await provider.send(payload);
}

/**
 * Send a notification via email
 */
export async function sendEmail(
	sendEmailFn: (payload: {
		to: string | string[];
		subject: string;
		html?: string;
		text?: string;
		from?: string;
	}) => Promise<unknown>,
	payload: NotificationPayload & { to: string | string[] },
	options?: {
		from?: string;
		timeout?: number;
		retries?: number;
		retryDelay?: number;
	}
) {
	const provider = new EmailProvider({
		sendEmail: sendEmailFn,
		from: options?.from,
		timeout: options?.timeout,
		retries: options?.retries,
		retryDelay: options?.retryDelay,
	});

	return await provider.send({
		...payload,
		metadata: {
			...payload.metadata,
			to: payload.to,
		},
	});
}

/**
 * Send a notification to a custom webhook
 */
export function sendWebhook(
	url: string,
	payload: NotificationPayload,
	options?: {
		method?: "GET" | "POST" | "PUT" | "PATCH";
		headers?: Record<string, string>;
		transformPayload?: (payload: NotificationPayload) => unknown;
		timeout?: number;
		retries?: number;
		retryDelay?: number;
	}
) {
	const provider = new WebhookProvider({
		url,
		method: options?.method,
		headers: options?.headers,
		transformPayload: options?.transformPayload,
		timeout: options?.timeout,
		retries: options?.retries,
		retryDelay: options?.retryDelay,
	});

	return provider.send(payload);
}
