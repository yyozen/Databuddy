import { websitesApi } from "@databuddy/auth";
import { and, db, eq, isNull, revenueConfig, websites } from "@databuddy/db";
import { createId } from "@databuddy/shared/utils/ids";
import { z } from "zod";
import type { Context } from "../orpc";
import { protectedProcedure } from "../orpc";

function generateHash(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(24));
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

async function getOwnerId(
	ctx: Context & { user: NonNullable<Context["user"]> },
	websiteId?: string
): Promise<string> {
	if (websiteId) {
		const website = await db.query.websites.findFirst({
			where: eq(websites.id, websiteId),
			columns: { organizationId: true },
		});
		if (website) {
			return website.organizationId;
		}
	}

	const activeOrgId = (ctx.session as { activeOrganizationId?: string })
		?.activeOrganizationId;
	if (activeOrgId) {
		return activeOrgId;
	}

	return ctx.user.id;
}

async function hasManagePermission(headers: Headers): Promise<boolean> {
	const { success } = await websitesApi.hasPermission({
		headers,
		body: { permissions: { website: ["configure"] } },
	});
	return success;
}

export const revenueRouter = {
	get: protectedProcedure
		.input(z.object({ websiteId: z.string().optional() }))
		.handler(async ({ context, input }) => {
			const ownerId = await getOwnerId(context, input.websiteId);

			const config = await context.db.query.revenueConfig.findFirst({
				where: input.websiteId
					? and(
						eq(revenueConfig.ownerId, ownerId),
						eq(revenueConfig.websiteId, input.websiteId)
					)
					: and(
						eq(revenueConfig.ownerId, ownerId),
						isNull(revenueConfig.websiteId)
					),
			});

			if (!config) {
				return null;
			}

			return {
				id: config.id,
				websiteId: config.websiteId,
				webhookHash: config.webhookHash,
				stripeConfigured: Boolean(config.stripeWebhookSecret),
				paddleConfigured: Boolean(config.paddleWebhookSecret),
				currency: config.currency,
				createdAt: config.createdAt,
				updatedAt: config.updatedAt,
			};
		}),

	upsert: protectedProcedure
		.input(
			z.object({
				websiteId: z.string().optional(),
				stripeWebhookSecret: z.string().optional(),
				paddleWebhookSecret: z.string().optional(),
				currency: z.string().length(3).optional(),
			})
		)
		.handler(async ({ context, input, errors }) => {
			if (!(await hasManagePermission(context.headers))) {
				throw errors.FORBIDDEN({ message: "Missing permissions" });
			}

			const ownerId = await getOwnerId(context, input.websiteId);

			const existing = await context.db.query.revenueConfig.findFirst({
				where: input.websiteId
					? and(
						eq(revenueConfig.ownerId, ownerId),
						eq(revenueConfig.websiteId, input.websiteId)
					)
					: and(
						eq(revenueConfig.ownerId, ownerId),
						isNull(revenueConfig.websiteId)
					),
			});

			if (existing) {
				const [updated] = await context.db
					.update(revenueConfig)
					.set({
						stripeWebhookSecret:
							input.stripeWebhookSecret ?? existing.stripeWebhookSecret,
						paddleWebhookSecret:
							input.paddleWebhookSecret ?? existing.paddleWebhookSecret,
						currency: input.currency ?? existing.currency,
						updatedAt: new Date(),
					})
					.where(eq(revenueConfig.id, existing.id))
					.returning();

				return {
					id: updated.id,
					websiteId: updated.websiteId,
					webhookHash: updated.webhookHash,
					stripeConfigured: Boolean(updated.stripeWebhookSecret),
					paddleConfigured: Boolean(updated.paddleWebhookSecret),
					currency: updated.currency,
				};
			}

			const [created] = await context.db
				.insert(revenueConfig)
				.values({
					id: createId(),
					ownerId,
					websiteId: input.websiteId || null,
					webhookHash: generateHash(),
					stripeWebhookSecret: input.stripeWebhookSecret || null,
					paddleWebhookSecret: input.paddleWebhookSecret || null,
					currency: input.currency || "USD",
				})
				.returning();

			return {
				id: created.id,
				websiteId: created.websiteId,
				webhookHash: created.webhookHash,
				stripeConfigured: Boolean(created.stripeWebhookSecret),
				paddleConfigured: Boolean(created.paddleWebhookSecret),
				currency: created.currency,
			};
		}),

	regenerateHash: protectedProcedure
		.input(z.object({ websiteId: z.string().optional() }))
		.handler(async ({ context, input, errors }) => {
			if (!(await hasManagePermission(context.headers))) {
				throw errors.FORBIDDEN({ message: "Missing permissions" });
			}

			const ownerId = await getOwnerId(context, input.websiteId);

			const existing = await context.db.query.revenueConfig.findFirst({
				where: input.websiteId
					? and(
						eq(revenueConfig.ownerId, ownerId),
						eq(revenueConfig.websiteId, input.websiteId)
					)
					: and(
						eq(revenueConfig.ownerId, ownerId),
						isNull(revenueConfig.websiteId)
					),
			});

			if (!existing) {
				throw errors.NOT_FOUND({ message: "Revenue config not found" });
			}

			const newHash = generateHash();

			await context.db
				.update(revenueConfig)
				.set({ webhookHash: newHash, updatedAt: new Date() })
				.where(eq(revenueConfig.id, existing.id));

			return { webhookHash: newHash };
		}),

	delete: protectedProcedure
		.input(z.object({ websiteId: z.string().optional() }))
		.handler(async ({ context, input, errors }) => {
			if (!(await hasManagePermission(context.headers))) {
				throw errors.FORBIDDEN({ message: "Missing permissions" });
			}

			const ownerId = await getOwnerId(context, input.websiteId);

			const existing = await context.db.query.revenueConfig.findFirst({
				where: input.websiteId
					? and(
						eq(revenueConfig.ownerId, ownerId),
						eq(revenueConfig.websiteId, input.websiteId)
					)
					: and(
						eq(revenueConfig.ownerId, ownerId),
						isNull(revenueConfig.websiteId)
					),
			});

			if (!existing) {
				throw errors.NOT_FOUND({ message: "Revenue config not found" });
			}

			await context.db
				.delete(revenueConfig)
				.where(eq(revenueConfig.id, existing.id));

			return { deleted: true };
		}),
};
