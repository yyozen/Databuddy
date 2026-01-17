import { and, db, eq, isNull, links } from "@databuddy/db";
import {
	type CachedLink,
	getCachedLink,
	getRateLimitHeaders,
	rateLimit,
	setCachedLink,
	setCachedLinkNotFound,
	shouldRecordClick,
} from "@databuddy/redis";
import { Elysia, redirect, t } from "elysia";
import { sendLinkVisit } from "../lib/producer";
import { isBot, isSocialBot } from "../utils/bot-detection";
import { getTargetUrl } from "../utils/device-targeting";
import { extractIp, getGeo } from "../utils/geo";
import { hashIp } from "../utils/hash";
import { generateOgHtml } from "../utils/og-html";
import { parseUserAgent } from "../utils/user-agent";

const EXPIRED_URL = "https://dby.sh/expired";
const NOT_FOUND_URL = "https://dby.sh/not-found";
const RATE_LIMIT = { requests: 100, windowSeconds: 60 };

async function getLinkBySlug(slug: string): Promise<CachedLink | null> {
	const cached = await getCachedLink(slug).catch(() => null);
	if (cached) {
		return cached;
	}

	const dbLink = await db.query.links.findFirst({
		where: and(eq(links.slug, slug), isNull(links.deletedAt)),
		columns: {
			id: true,
			targetUrl: true,
			expiresAt: true,
			expiredRedirectUrl: true,
			ogTitle: true,
			ogDescription: true,
			ogImageUrl: true,
			iosUrl: true,
			androidUrl: true,
		},
	});

	if (!dbLink) {
		await setCachedLinkNotFound(slug).catch(() => { });
		return null;
	}

	const link: CachedLink = {
		id: dbLink.id,
		targetUrl: dbLink.targetUrl,
		expiresAt: dbLink.expiresAt?.toISOString() ?? null,
		expiredRedirectUrl: dbLink.expiredRedirectUrl,
		ogTitle: dbLink.ogTitle,
		ogDescription: dbLink.ogDescription,
		ogImageUrl: dbLink.ogImageUrl,
		iosUrl: dbLink.iosUrl,
		androidUrl: dbLink.androidUrl,
	};

	await setCachedLink(slug, link).catch(() => { });
	return link;
}

function isExpired(link: CachedLink): boolean {
	return link.expiresAt ? new Date(link.expiresAt) < new Date() : false;
}

export const redirectRoute = new Elysia().get(
	"/:slug",
	async ({ params, request, set }) => {
		const ip = extractIp(request);
		const ipHash = hashIp(ip);

		const rl = await rateLimit(
			`redirect:${ipHash}`,
			RATE_LIMIT.requests,
			RATE_LIMIT.windowSeconds
		);
		const headers = getRateLimitHeaders(rl);

		if (!rl.success) {
			set.status = 429;
			set.headers = { ...headers, "Content-Type": "application/json" };
			return { error: "Too many requests" };
		}

		const link = await getLinkBySlug(params.slug);
		if (!link) {
			set.headers = headers;
			return redirect(NOT_FOUND_URL, 302);
		}

		if (isExpired(link)) {
			set.headers = headers;
			return redirect(link.expiredRedirectUrl ?? EXPIRED_URL, 302);
		}

		const userAgent = request.headers.get("user-agent");
		const targetUrl = getTargetUrl(link, userAgent);

		const hasOg = link.ogTitle ?? link.ogDescription ?? link.ogImageUrl;
		if (hasOg && isSocialBot(userAgent)) {
			set.headers = { ...headers, "Content-Type": "text/html; charset=utf-8" };
			return new Response(generateOgHtml(link, request.url, targetUrl), { status: 200 });
		}

		if (isBot(userAgent)) {
			set.headers = headers;
			return redirect(targetUrl, 302);
		}

		const shouldRecord = await shouldRecordClick(link.id, ipHash);
		if (shouldRecord) {
			const [geo, ua] = await Promise.all([
				getGeo(ip),
				Promise.resolve(parseUserAgent(userAgent)),
			]);

			sendLinkVisit(
				{
					link_id: link.id,
					timestamp: new Date().toISOString().replace("T", " ").replace("Z", ""),
					referrer: request.headers.get("referer"),
					user_agent: userAgent,
					ip_hash: ipHash,
					country: geo.country,
					region: geo.region,
					city: geo.city,
					browser_name: ua.browserName,
					device_type: ua.deviceType,
				},
				link.id
			).catch((err) => console.error("Failed to track visit:", err));
		}

		set.headers = headers;
		return redirect(targetUrl, 302);
	},
	{ params: t.Object({ slug: t.String() }) }
);
