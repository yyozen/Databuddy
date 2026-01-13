export type NotificationChannel = "slack" | "discord" | "email" | "webhook";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface NotificationPayload {
	title: string;
	message: string;
	priority?: NotificationPriority;
	metadata?: Record<string, unknown>;
}

export interface SlackBlock {
	type: string;
	text?: {
		type: string;
		text: string;
	};
	fields?: Array<{ title: string; value: string; short?: boolean }>;
	[key: string]: unknown;
}

export interface SlackPayload {
	text?: string;
	blocks?: SlackBlock[];
	channel?: string;
	username?: string;
	icon_emoji?: string;
	icon_url?: string;
}

export interface DiscordEmbed {
	title?: string;
	description?: string;
	color?: number;
	fields?: Array<{
		name: string;
		value: string;
		inline?: boolean;
	}>;
	timestamp?: string;
	footer?: {
		text: string;
		icon_url?: string;
	};
	thumbnail?: {
		url: string;
	};
	image?: {
		url: string;
	};
}

export interface DiscordPayload {
	content?: string;
	embeds?: DiscordEmbed[];
	username?: string;
	avatar_url?: string;
}

export interface EmailPayload {
	to: string | string[];
	subject: string;
	html?: string;
	text?: string;
	from?: string;
}

export interface WebhookPayload {
	url: string;
	method?: "GET" | "POST" | "PUT" | "PATCH";
	headers?: Record<string, string>;
	body?: unknown;
	timeout?: number;
}

export interface NotificationResult {
	success: boolean;
	channel: NotificationChannel;
	error?: string;
	response?: unknown;
}

export interface NotificationOptions {
	channels?: NotificationChannel[];
	timeout?: number;
	retries?: number;
	retryDelay?: number;
}
