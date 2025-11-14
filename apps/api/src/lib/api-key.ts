import type { InferSelectModel } from "@databuddy/db";
import { and, apikey, apikeyAccess, db, eq, isNull } from "@databuddy/db";
import { cacheable } from "@databuddy/redis";
import { logger } from "./logger";

export type ApiKeyRow = InferSelectModel<typeof apikey>;
export type ApiScope = InferSelectModel<typeof apikey>["scopes"][number];

const getCachedApiKeyBySecret = cacheable(
	async (secret: string): Promise<ApiKeyRow | null> => {
		try {
			const key = await db.query.apikey.findFirst({
				where: and(
					eq(apikey.key, secret),
					eq(apikey.enabled, true),
					isNull(apikey.revokedAt)
				),
			});
			return key ?? null;
		} catch (error) {
			logger.error({ error }, "Failed to get API key by secret from cache");
			return null;
		}
	},
	{
		expireInSec: 60,
		prefix: "api-key-by-secret",
		staleWhileRevalidate: true,
		staleTime: 30,
	}
);

const getCachedAccessEntries = cacheable(
	async (keyId: string) => {
		try {
			return await db
				.select()
				.from(apikeyAccess)
				.where(eq(apikeyAccess.apikeyId, keyId));
		} catch (error) {
			logger.error({ error, keyId }, "Failed to get API key access entries from cache");
			return [] as InferSelectModel<typeof apikeyAccess>[];
		}
	},
	{
		expireInSec: 60,
		prefix: "api-key-access-entries",
		staleWhileRevalidate: true,
		staleTime: 30,
	}
);

export async function getApiKeyFromHeader(
	headers: Headers
): Promise<ApiKeyRow | null> {
	const xApiKey = headers.get("x-api-key")?.trim();
	const auth = headers.get("authorization");
	const bearer = auth?.toLowerCase()?.startsWith("bearer ")
		? auth.slice(7).trim()
		: null;
	const secret =
		xApiKey && xApiKey.length > 0
			? xApiKey
			: bearer && bearer.length > 0
				? bearer
				: null;
	if (!secret) {
		return null;
	}
	const key = await getCachedApiKeyBySecret(secret);
	if (!key) {
		logger.warn(
			{
				userAgent: headers.get("user-agent"),
				ip: headers.get("x-forwarded-for") || headers.get("x-real-ip"),
				method: "getApiKeyFromHeader",
			},
			"API key authentication failed: invalid key"
		);
		return null;
	}
	if (key.expiresAt && new Date(key.expiresAt) <= new Date()) {
		logger.warn(
			{
				apikeyId: key.id,
				expiresAt: key.expiresAt,
				userAgent: headers.get("user-agent"),
				ip: headers.get("x-forwarded-for") || headers.get("x-real-ip"),
			},
			"API key authentication failed: expired key"
		);
		return null;
	}

	// Audit log successful API key usage
	logger.info(
		{
			apikeyId: key.id,
			userId: key.userId,
			organizationId: key.organizationId,
			scopes: key.scopes,
			userAgent: headers.get("user-agent"),
			ip: headers.get("x-forwarded-for") || headers.get("x-real-ip"),
			keyPrefix: key.prefix,
		},
		"API key used successfully"
	);

	return key;
}

export function isApiKeyPresent(headers: Headers): boolean {
	const xApiKey = headers.get("x-api-key");
	if (xApiKey) {
		return true;
	}
	const auth = headers.get("authorization");
	return auth?.toLowerCase().startsWith("bearer ") ?? false;
}

export async function resolveEffectiveScopesForWebsite(
	key: ApiKeyRow | null,
	websiteId: string
): Promise<Set<ApiScope>> {
	if (!key) {
		return new Set();
	}

	const effective = new Set<ApiScope>();
	for (const s of key.scopes || []) {
		effective.add(s as ApiScope);
	}

	const entries = await getCachedAccessEntries(key.id);
	for (const entry of entries) {
		const isGlobal = entry.resourceType === "global";
		const isWebsiteMatch =
			entry.resourceType === "website" && entry.resourceId === websiteId;
		if (isGlobal || isWebsiteMatch) {
			for (const s of entry.scopes) {
				effective.add(s as ApiScope);
			}
		}
	}

	return effective;
}

export async function hasWebsiteScope(
	key: ApiKeyRow | null,
	websiteId: string,
	required: ApiScope
): Promise<boolean> {
	if (!key) {
		return false;
	}

	if ((key.scopes || []).includes(required)) {
		return true;
	}
	const effective = await resolveEffectiveScopesForWebsite(key, websiteId);
	const hasScope = effective.has(required);

	return hasScope;
}
