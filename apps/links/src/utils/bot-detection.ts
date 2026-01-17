const BOT_PATTERNS = [
	"bot",
	"crawler",
	"spider",
	"http",
	"scraper",
	"fetch",
	"curl",
	"wget",
	"python",
	"node",
	"ruby",
	"axios",
	"guzzle",
	"facebookexternalhit",
	"facebot",
	"twitterbot",
	"linkedinbot",
	"slackbot",
	"discordbot",
	"whatsapp",
	"telegrambot",
	"pinterestbot",
	"googlebot",
	"bingbot",
	"baiduspider",
	"yandexbot",
	"duckduckbot",
	"chatgpt",
	"anthropic-ai",
	"claude-web",
	"perplexity",
	"applebot-extended",
	"pingdom",
	"statuscake",
	"upptime",
	"hyperping",
	"uptimerobot",
	"headlesschrome",
	"phantomjs",
	"selenium",
	"puppeteer",
	"playwright",
	"postman",
	"insomnia",
	"preview",
	"thumbnail",
	"archiver",
	"wayback",
];

const SOCIAL_BOT_PATTERNS = [
	"facebookexternalhit",
	"facebot",
	"twitterbot",
	"linkedinbot",
	"slackbot",
	"discordbot",
	"whatsapp",
	"telegrambot",
	"pinterestbot",
	"googlebot",
	"bingbot",
];

export function isBot(userAgent: string | null): boolean {
	if (!userAgent) {
		return false;
	}
	const lower = userAgent.toLowerCase();
	return BOT_PATTERNS.some((p) => lower.includes(p));
}

export function isSocialBot(userAgent: string | null): boolean {
	if (!userAgent) {
		return false;
	}
	const lower = userAgent.toLowerCase();
	return SOCIAL_BOT_PATTERNS.some((p) => lower.includes(p));
}
