import { UAParser } from "ua-parser-js";

export function parseUserAgent(userAgent: string | null) {
	if (!userAgent) {
		return { browserName: null, deviceType: null };
	}

	try {
		const parser = new UAParser(userAgent);
		const result = parser.getResult();

		return {
			browserName: result.browser.name || null,
			deviceType: result.device.type || "desktop",
		};
	} catch {
		return { browserName: null, deviceType: null };
	}
}
