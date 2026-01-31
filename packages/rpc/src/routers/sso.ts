import { websitesApi } from "@databuddy/auth";
import { desc, eq, ssoProvider } from "@databuddy/db";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../orpc";

export const ssoRouter = {
	list: protectedProcedure
		.input(z.object({ organizationId: z.string() }))
		.handler(async ({ context, input }) => {
			const { success } = await websitesApi.hasPermission({
				headers: context.headers,
				body: {
					organizationId: input.organizationId,
					permissions: { organization: ["read"] },
				},
			});

			if (!success) {
				throw new ORPCError("FORBIDDEN", {
					message: "You do not have permission to access this organization",
				});
			}

			const providers = await context.db
				.select()
				.from(ssoProvider)
				.where(eq(ssoProvider.organizationId, input.organizationId))
				.orderBy(desc(ssoProvider.id));

			return providers.map((p) => ({
				id: p.id,
				providerId: p.providerId,
				issuer: p.issuer,
				domain: p.domain,
				organizationId: p.organizationId,
				userId: p.userId,
				oidcConfig: p.oidcConfig,
				samlConfig: p.samlConfig,
			}));
		}),

	getById: protectedProcedure
		.input(z.object({ providerId: z.string() }))
		.handler(async ({ context, input }) => {
			const provider = await context.db.query.ssoProvider.findFirst({
				where: eq(ssoProvider.providerId, input.providerId),
			});

		if (!provider) {
			return null;
		}

		if (!provider.organizationId) {
			throw new ORPCError("FORBIDDEN", {
				message: "SSO provider must belong to an organization",
			});
		}

		const { success } = await websitesApi.hasPermission({
			headers: context.headers,
			body: {
				organizationId: provider.organizationId,
				permissions: { organization: ["read"] },
			},
		});

		if (!success) {
			throw new ORPCError("FORBIDDEN", {
				message: "You do not have permission to access this SSO provider",
			});
		}

			return {
				id: provider.id,
				providerId: provider.providerId,
				issuer: provider.issuer,
				domain: provider.domain,
				organizationId: provider.organizationId,
				userId: provider.userId,
				oidcConfig: provider.oidcConfig,
				samlConfig: provider.samlConfig,
			};
		}),

	delete: protectedProcedure
		.input(z.object({ providerId: z.string() }))
		.handler(async ({ context, input }) => {
			const provider = await context.db.query.ssoProvider.findFirst({
				where: eq(ssoProvider.providerId, input.providerId),
			});

		if (!provider) {
			throw new ORPCError("NOT_FOUND", {
				message: "SSO provider not found",
			});
		}

		if (!provider.organizationId) {
			throw new ORPCError("FORBIDDEN", {
				message: "SSO provider must belong to an organization",
			});
		}

		const { success } = await websitesApi.hasPermission({
			headers: context.headers,
			body: {
				organizationId: provider.organizationId,
				permissions: { organization: ["update"] },
			},
		});

			if (!success) {
				throw new ORPCError("FORBIDDEN", {
					message: "You do not have permission to delete this SSO provider",
				});
			}

			await context.db
				.delete(ssoProvider)
				.where(eq(ssoProvider.providerId, input.providerId));

			return { success: true };
		}),
};
