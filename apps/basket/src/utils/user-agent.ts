/**
 * User Agent Utilities
 *
 * Provides functions for user agent analysis including bot detection
 * and platform identification.
 */

import { captureError, record } from "@lib/tracing";
import { UAParser } from "ua-parser-js";
import { isAIAssistant, isAICrawler, isBot } from "ua-parser-js/bot-detection";

export interface UserAgentInfo {
	bot: {
		isBot: boolean;
		name?: string;
		type?: string;
	};
	browser?: string;
	os?: string;
	device?: "desktop" | "mobile" | "tablet" | "unknown";
}

/**
 * Parse user agent to extract useful information
 */
export function parseUserAgent(userAgent: string): Promise<{
	browserName?: string;
	browserVersion?: string;
	osName?: string;
	osVersion?: string;
	deviceType?: string;
	deviceBrand?: string;
	deviceModel?: string;
}> {
	return record("parseUserAgent", () => {
		if (!userAgent) {
			return {
				browserName: undefined,
				browserVersion: undefined,
				osName: undefined,
				osVersion: undefined,
				deviceType: undefined,
				deviceBrand: undefined,
				deviceModel: undefined,
			};
		}

		try {
			const parser = new UAParser(userAgent);
			const result = parser.getResult();

			return {
				browserName: result.browser.name || undefined,
				browserVersion: result.browser.version || undefined,
				osName: result.os.name || undefined,
				osVersion: result.os.version || undefined,
				deviceType: result.device.type || undefined,
				deviceBrand: result.device.vendor || undefined,
				deviceModel: result.device.model || undefined,
			};
		} catch (error) {
			captureError(error, { userAgent, message: "Failed to parse user agent" });
			return {
				browserName: undefined,
				browserVersion: undefined,
				osName: undefined,
				osVersion: undefined,
				deviceType: undefined,
				deviceBrand: undefined,
				deviceModel: undefined,
			};
		}
	});
}

function extractBotName(userAgent: string): string | undefined {
	const parser = new UAParser(userAgent);
	const result = parser.getResult();
	return result.browser.name || undefined;
}

export function detectBot(
	userAgent: string,
	_request: Request
): {
	isBot: boolean;
	reason?: string;
	category?: string;
	botName?: string;
} {
	if (!userAgent) {
		return {
			isBot: true,
			reason: "missing_user_agent",
			category: "Missing Headers",
		};
	}

	if (isAICrawler(userAgent)) {
		return {
			isBot: true,
			reason: "ai_crawler_user_agent",
			category: "AI Crawler",
			botName: extractBotName(userAgent),
		};
	}

	if (isAIAssistant(userAgent)) {
		return {
			isBot: true,
			reason: "ai_assistant_user_agent",
			category: "AI Assistant",
			botName: extractBotName(userAgent),
		};
	}

	if (isBot(userAgent)) {
		return {
			isBot: true,
			reason: "known_bot_user_agent",
			category: "Known Bot",
			botName: extractBotName(userAgent),
		};
	}

	return { isBot: false };
}
