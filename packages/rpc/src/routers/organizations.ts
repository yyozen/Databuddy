import { websitesApi } from '@databuddy/auth';
import {
	db,
	invitation,
	member,
	organization,
	session,
	user,
} from '@databuddy/db';
import {
	getPendingInvitationsSchema,
	uploadOrganizationLogoSchema,
} from '@databuddy/validation';
import { TRPCError } from '@trpc/server';
import { Autumn as autumn } from 'autumn-js';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { s3 } from '../utils/s3';

export const organizationsRouter = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx }) => {
		try {
			const organizations = await db
				.select({
					id: organization.id,
					name: organization.name,
					slug: organization.slug,
					logo: organization.logo,
				})
				.from(organization)
				.innerJoin(member, eq(organization.id, member.organizationId))
				.where(eq(member.userId, ctx.user.id))
				.orderBy(organization.name);

			const [userSession] = await db
				.select({
					activeOrganizationId: session.activeOrganizationId,
				})
				.from(session)
				.where(eq(session.userId, ctx.user.id))
				.limit(1);

			let activeOrganization: (typeof organizations)[number] | null = null;
			if (userSession?.activeOrganizationId) {
				activeOrganization =
					organizations.find(
						(org) => org.id === userSession.activeOrganizationId
					) || null;
			}

			return {
				organizations,
				activeOrganization,
			};
		} catch (error) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to fetch organizations',
				cause: error,
			});
		}
	}),

	uploadLogo: protectedProcedure
		.input(
			uploadOrganizationLogoSchema.extend({
				fileData: z.string().min(1, 'File data is required'),
				fileName: z.string().min(1, 'File name is required'),
				fileType: z.string().min(1, 'File type is required'),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { success } = await websitesApi.hasPermission({
				headers: ctx.headers,
				body: { permissions: { organization: ['manage_logo'] } },
			});
			if (!success) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message:
						'You do not have permission to manage this organization logo.',
				});
			}

			const [org] = await db
				.select()
				.from(organization)
				.where(eq(organization.id, input.organizationId))
				.limit(1);

			if (!org) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Organization not found.',
				});
			}

			try {
				if (org.logo) {
					await s3.deleteOrganizationLogo(org.logo);
				}

				if (
					typeof input.fileData !== 'string' ||
					typeof input.fileName !== 'string' ||
					typeof input.fileType !== 'string'
				) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Invalid file data format',
					});
				}

				const base64Data = input.fileData.split(',')[1];
				if (!base64Data) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Invalid file data format',
					});
				}
				const buffer = Buffer.from(base64Data, 'base64');
				const file = new File([buffer], input.fileName, {
					type: input.fileType,
				});

				const logoUrl = await s3.uploadOrganizationLogo(
					input.organizationId,
					file
				);

				const [updatedOrganization] = await db
					.update(organization)
					.set({ logo: logoUrl })
					.where(eq(organization.id, input.organizationId))
					.returning();

				return {
					organization: updatedOrganization,
					logoUrl,
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to upload organization logo',
					cause: error,
				});
			}
		}),

	deleteLogo: protectedProcedure
		.input(uploadOrganizationLogoSchema)
		.mutation(async ({ input, ctx }) => {
			const { success } = await websitesApi.hasPermission({
				headers: ctx.headers,
				body: { permissions: { organization: ['manage_logo'] } },
			});
			if (!success) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message:
						'You do not have permission to manage this organization logo.',
				});
			}

			const [org] = await db
				.select()
				.from(organization)
				.where(eq(organization.id, input.organizationId))
				.limit(1);

			if (!org) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Organization not found.',
				});
			}

			try {
				if (org.logo) {
					await s3.deleteOrganizationLogo(org.logo);
				}

				const [updatedOrganization] = await db
					.update(organization)
					.set({ logo: null })
					.where(eq(organization.id, input.organizationId))
					.returning();

				return {
					organization: updatedOrganization,
					success: true,
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to delete organization logo',
					cause: error,
				});
			}
		}),

	getPendingInvitations: protectedProcedure
		.input(getPendingInvitationsSchema)
		.query(async ({ input, ctx }) => {
			const { success } = await websitesApi.hasPermission({
				headers: ctx.headers,
				body: { permissions: { organization: ['read'] } },
			});
			if (!success) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message:
						'You do not have permission to view invitations for this organization.',
				});
			}

			const [org] = await db
				.select()
				.from(organization)
				.where(eq(organization.id, input.organizationId))
				.limit(1);

			if (!org) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Organization not found.',
				});
			}

			try {
				const conditions = [
					eq(invitation.organizationId, input.organizationId),
				];

				if (!input.includeExpired) {
					conditions.push(eq(invitation.status, 'pending'));
				}

				const invitations = await db
					.select({
						id: invitation.id,
						email: invitation.email,
						role: invitation.role,
						status: invitation.status,
						expiresAt: invitation.expiresAt,
						inviterId: invitation.inviterId,
					})
					.from(invitation)
					.where(and(...conditions))
					.orderBy(desc(invitation.expiresAt));

				return invitations;
			} catch (error) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to fetch pending invitations',
					cause: error,
				});
			}
		}),

	getUsage: protectedProcedure.query(async ({ ctx }) => {
		const [orgResult] = await db
			.select({
				ownerId: user.id,
				activeOrgId: session.activeOrganizationId,
			})
			.from(session)
			.innerJoin(
				organization,
				eq(session.activeOrganizationId, organization.id)
			)
			.innerJoin(member, eq(organization.id, member.organizationId))
			.innerJoin(user, eq(member.userId, user.id))
			.where(and(eq(session.userId, ctx.user.id), eq(member.role, 'owner')))
			.limit(1);

		const customerId = orgResult?.ownerId || ctx.user.id;

		try {
			const checkResult = await autumn.check({
				customer_id: customerId,
				feature_id: 'events',
			});

			const data = checkResult.data;
			const used = data.usage ?? 0;
			const usageLimit = data.usage_limit ?? 0;
			const unlimited = data.unlimited ?? false;
			const balance = data.balance ?? 0;
			const includedUsage = data.included_usage ?? 0;

			const remaining = unlimited ? null : Math.max(0, usageLimit - used);

			return {
				used,
				limit: unlimited ? null : usageLimit,
				unlimited,
				balance,
				remaining,
				includedUsage,
				isOrganizationUsage: Boolean(orgResult?.activeOrgId),
				canUserUpgrade:
					!orgResult?.activeOrgId || orgResult.ownerId === ctx.user.id,
			};
		} catch (error) {
			console.error('Failed to check usage:', error);
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to retrieve usage data',
				cause: error,
			});
		}
	}),
});
