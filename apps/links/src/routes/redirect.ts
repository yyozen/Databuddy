import { and, clickHouse, db, eq, isNull, links } from "@databuddy/db";
import { Elysia, redirect, t } from "elysia";
import { extractIp, getGeo } from "../utils/geo";
import { hashIp } from "../utils/hash";
import { parseUserAgent } from "../utils/user-agent";

export const redirectRoute = new Elysia().get(
	"/:slug",
	async ({ params, request }) => {
		const link = await db.query.links.findFirst({
			where: and(eq(links.slug, params.slug), isNull(links.deletedAt)),
			columns: {
				id: true,
				targetUrl: true,
			},
		});

		if (!link) {
			return Response.json({ error: "Link not found" }, { status: 404 });
		}

		const referrer = request.headers.get("referer");
		const userAgent = request.headers.get("user-agent");
		const ip = extractIp(request);

		const [geo, ua] = await Promise.all([
			getGeo(ip),
			Promise.resolve(parseUserAgent(userAgent)),
		]);

		clickHouse
			.insert({
				table: "analytics.link_visits",
				values: [
					{
						id: crypto.randomUUID(),
						link_id: link.id,
						timestamp: new Date()
							.toISOString()
							.replace("T", " ")
							.replace("Z", ""),
						referrer,
						user_agent: userAgent,
						ip_hash: hashIp(ip),
						country: geo.country,
						region: geo.region,
						city: geo.city,
						browser_name: ua.browserName,
						device_type: ua.deviceType,
					},
				],
				format: "JSONEachRow",
			})
			.catch((err) => console.error("Failed to track visit:", err));

		return redirect(link.targetUrl, 302);
	},
	{
		params: t.Object({
			slug: t.String(),
		}),
	}
);
