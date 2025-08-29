import { authClient } from '@databuddy/auth/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export type OrganizationRole = 'owner' | 'admin' | 'member';

type CreateOrganizationData = {
	name: string;
	slug?: string;
	logo?: string;
	metadata?: Record<string, unknown>;
};

type UpdateOrganizationData = {
	name?: string;
	slug?: string;
	logo?: string;
	metadata?: Record<string, unknown>;
};

type InviteMemberData = {
	email: string;
	role: OrganizationRole;
	organizationId?: string;
	resend?: boolean;
};

export type UpdateMemberData = {
	memberId: string;
	role: OrganizationRole;
	organizationId?: string;
};

const QUERY_KEYS = {
	organizationMembers: (orgId: string) =>
		['organizations', orgId, 'members'] as const,
	organizationInvitations: (orgId: string) =>
		['organizations', orgId, 'invitations'] as const,
	userInvitations: ['organizations', 'invitations', 'user'] as const,
} as const;

const createMutation = <TData, TVariables>(
	mutationFn: (variables: TVariables) => Promise<TData>,
	successMessage: string,
	errorMessage: string,
	onSuccessCallback?: () => void,
	options: { showToast?: boolean } = { showToast: true }
) => ({
	mutationFn,
	onSuccess: () => {
		onSuccessCallback?.();
		if (options.showToast) {
			toast.success(successMessage);
		}
	},
	onError: (error: Error) => {
		if (options.showToast) {
			toast.error(error.message || errorMessage);
		}
	},
});

export function useOrganizations() {
	const {
		data: organizationsData,
		error: organizationsError,
		isPending: isOrganizationsPending,
	} = trpc.organizations.list.useQuery();

	const organizations = organizationsData?.organizations || [];
	const activeOrganization = organizationsData?.activeOrganization || null;

	const createOrganizationMutation = useMutation({
		mutationFn: async (orgInput: CreateOrganizationData) => {
			const { data: result, error: apiError } =
				await authClient.organization.create({
					name: orgInput.name,
					slug:
						orgInput.slug || orgInput.name.toLowerCase().replace(/\s+/g, '-'),
					logo: orgInput.logo,
					metadata: orgInput.metadata,
				});
			if (apiError) {
				throw new Error(apiError.message || 'Failed to create organization');
			}
			return result;
		},
		onSuccess: () => {
			// Invalidate organizations list after creation
			trpcUtils.organizations.list.invalidate();
			toast.success('Organization created successfully');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to create organization');
		},
	});

	const updateOrganizationMutation = useMutation({
		mutationFn: async ({
			organizationId,
			data: updateData,
		}: {
			organizationId?: string;
			data: UpdateOrganizationData;
		}) => {
			if (!organizationId) {
				throw new Error('Organization ID is required');
			}
			const { data: result, error: apiError } =
				await authClient.organization.update({
					organizationId,
					data: {
						name: updateData.name,
						slug: updateData.slug,
						logo: updateData.logo,
						metadata: updateData.metadata,
					},
				});
			if (apiError) {
				throw new Error(apiError.message || 'Failed to update organization');
			}
			return result;
		},
		onSuccess: () => {
			trpcUtils.organizations.list.invalidate();
			toast.success('Organization updated successfully');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update organization');
		},
	});

	const trpcUtils = trpc.useUtils();

	const uploadOrganizationLogoMutation =
		trpc.organizations.uploadLogo.useMutation({
			onSuccess: () => {
				trpcUtils.organizations.list.invalidate();
				toast.success('Logo uploaded successfully');
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to upload logo');
			},
		});

	const deleteOrganizationLogoMutation =
		trpc.organizations.deleteLogo.useMutation({
			onSuccess: () => {
				trpcUtils.organizations.list.invalidate();
				toast.success('Logo deleted successfully');
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to delete logo');
			},
		});

	const deleteOrganizationMutation = useMutation({
		mutationFn: async (organizationId: string) => {
			const { data: result, error: apiError } =
				await authClient.organization.delete({
					organizationId,
				});
			if (apiError) {
				throw new Error(apiError.message || 'Failed to delete organization');
			}
			return result;
		},
		onSuccess: () => {
			trpcUtils.organizations.list.invalidate();
			toast.success('Organization deleted successfully');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to delete organization');
		},
	});

	const setActiveOrganizationMutation = useMutation({
		mutationFn: async (organizationId: string | null) => {
			if (organizationId === null) {
				const { data: setActiveData, error: apiError } =
					await authClient.organization.setActive({
						organizationId: null,
					});
				if (apiError) {
					throw new Error(
						apiError.message || 'Failed to unset active organization'
					);
				}
				return setActiveData;
			}
			const { data: setActiveData2, error: apiError2 } =
				await authClient.organization.setActive({
					organizationId,
				});
			if (apiError2) {
				throw new Error(
					apiError2.message || 'Failed to set active organization'
				);
			}
			return setActiveData2;
		},
		onSuccess: () => {
			trpcUtils.organizations.list.invalidate();
			toast.success('Workspace updated');
		},
		onError: (error: Error) => {
			// Don't show error toast for organization not found - we handle this gracefully
			if (
				!(
					error.message?.includes('ORGANIZATION_NOT_FOUND') ||
					error.message?.includes('Organization not found')
				)
			) {
				toast.error(error.message || 'Failed to update workspace');
			}
		},
	});

	return {
		organizations,
		activeOrganization,

		isLoading: isOrganizationsPending,

		organizationsError,
		activeOrganizationError: null, // No separate error for active org anymore
		hasError: !!organizationsError,

		createOrganization: createOrganizationMutation.mutate,
		createOrganizationAsync: createOrganizationMutation.mutateAsync,
		updateOrganization: updateOrganizationMutation.mutate,
		updateOrganizationAsync: updateOrganizationMutation.mutateAsync,
		deleteOrganization: deleteOrganizationMutation.mutate,
		deleteOrganizationAsync: deleteOrganizationMutation.mutateAsync,
		setActiveOrganization: setActiveOrganizationMutation.mutate,
		setActiveOrganizationAsync: setActiveOrganizationMutation.mutateAsync,
		uploadOrganizationLogo: uploadOrganizationLogoMutation.mutate,
		uploadOrganizationLogoAsync: uploadOrganizationLogoMutation.mutateAsync,
		deleteOrganizationLogo: deleteOrganizationLogoMutation.mutate,
		deleteOrganizationLogoAsync: deleteOrganizationLogoMutation.mutateAsync,

		isCreatingOrganization: createOrganizationMutation.isPending,
		isUpdatingOrganization: updateOrganizationMutation.isPending,
		isDeletingOrganization: deleteOrganizationMutation.isPending,
		isSettingActiveOrganization: setActiveOrganizationMutation.isPending,
		isUploadingOrganizationLogo: uploadOrganizationLogoMutation.isPending,
		isDeletingOrganizationLogo: deleteOrganizationLogoMutation.isPending,
	};
}

export function useOrganizationMembers(organizationId: string) {
	const queryClient = useQueryClient();

	const {
		data: members = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: QUERY_KEYS.organizationMembers(organizationId),
		queryFn: async () => {
			const { data: fullOrgData, error: apiError } =
				await authClient.organization.getFullOrganization({
					query: { organizationId },
				});
			if (apiError) {
				throw new Error(apiError.message || 'Failed to fetch members');
			}
			return fullOrgData?.members || [];
		},
		enabled: !!organizationId,
	});

	const invalidateMembers = () => {
		queryClient.invalidateQueries({
			queryKey: QUERY_KEYS.organizationMembers(organizationId),
		});
	};

	const inviteMemberMutation = useMutation(
		createMutation(
			async (data: InviteMemberData) => {
				const { data: result, error: apiError } =
					await authClient.organization.inviteMember({
						email: data.email,
						role: data.role,
						organizationId: data.organizationId,
						resend: data.resend,
					});
				if (apiError) {
					throw new Error(apiError.message || 'Failed to invite member');
				}
				return result;
			},
			'Member invited successfully',
			'Failed to invite member',
			invalidateMembers
		)
	);

	const updateMemberMutation = useMutation(
		createMutation(
			async (data: UpdateMemberData) => {
				const { data: result, error: apiError } =
					await authClient.organization.updateMemberRole({
						memberId: data.memberId,
						role: data.role,
						organizationId: data.organizationId,
					});
				if (apiError) {
					throw new Error(apiError.message || 'Failed to update member role');
				}
				return result;
			},
			'Member role updated successfully',
			'Failed to update member role',
			invalidateMembers
		)
	);

	const removeMemberMutation = useMutation(
		createMutation(
			async (memberIdOrEmail: string) => {
				const { data: result, error: apiError } =
					await authClient.organization.removeMember({
						memberIdOrEmail,
						organizationId,
					});
				if (apiError) {
					throw new Error(apiError.message || 'Failed to remove member');
				}
				return result;
			},
			'Member removed successfully',
			'Failed to remove member',
			invalidateMembers
		)
	);

	return {
		members,
		isLoading,
		error,
		hasError: !!error,
		refetch,

		inviteMember: inviteMemberMutation.mutate,
		inviteMemberAsync: inviteMemberMutation.mutateAsync,
		updateMember: updateMemberMutation.mutate,
		updateMemberAsync: updateMemberMutation.mutateAsync,
		removeMember: removeMemberMutation.mutate,
		removeMemberAsync: removeMemberMutation.mutateAsync,

		isInvitingMember: inviteMemberMutation.isPending,
		isUpdatingMember: updateMemberMutation.isPending,
		isRemovingMember: removeMemberMutation.isPending,
	};
}
