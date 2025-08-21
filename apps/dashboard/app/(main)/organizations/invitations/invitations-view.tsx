'use client';

import {
	CheckIcon,
	ClockIcon,
	EnvelopeIcon,
	XIcon,
} from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganizationInvitations } from '@/hooks/use-organization-invitations';
import type {
	ActiveOrganization,
	Organization,
} from '@/hooks/use-organizations';
import { InvitationList } from './invitation-list';

function InvitationsSkeleton() {
	return (
		<div className="h-full p-6">
			<div className="space-y-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						className="flex items-center gap-4 rounded-lg border bg-card p-4"
						key={i.toString()}
					>
						<Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />
						<div className="min-w-0 flex-1 space-y-2">
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-3 w-40" />
						</div>
						<Skeleton className="h-8 w-20" />
					</div>
				))}
			</div>
		</div>
	);
}

function EmptyInvitationsState() {
	return (
		<div className="flex h-full flex-col items-center justify-center p-8 text-center">
			<div className="mx-auto mb-8 w-fit rounded-2xl border border-primary/20 bg-primary/10 p-8">
				<EnvelopeIcon
					className="h-16 w-16 text-primary"
					size={64}
					weight="duotone"
				/>
			</div>
			<h3 className="mb-4 font-bold text-2xl">No Pending Invitations</h3>
			<p className="max-w-md text-muted-foreground leading-relaxed">
				There are no pending invitations for this organization. All invited
				members have either joined or declined their invitations.
			</p>
		</div>
	);
}

export function InvitationsView({
	organization,
}: {
	organization: NonNullable<Organization | ActiveOrganization>;
}) {
	const {
		filteredInvitations,
		isLoading: isLoadingInvitations,
		selectedTab,
		isCancelling: isCancellingInvitation,
		pendingCount,
		expiredCount,
		acceptedCount,
		cancelInvitation,
		setTab,
	} = useOrganizationInvitations(organization.id);

	if (isLoadingInvitations) {
		return <InvitationsSkeleton />;
	}

	if (
		!filteredInvitations ||
		(pendingCount === 0 && expiredCount === 0 && acceptedCount === 0)
	) {
		return <EmptyInvitationsState />;
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex-1 p-6">
				<Tabs
					className="flex h-full flex-col"
					onValueChange={setTab}
					value={selectedTab}
				>
					<div className="mb-8 border-b">
						<TabsList className="h-12 w-full justify-start rounded-none border-0 bg-transparent p-0">
							<TabsTrigger
								className="h-12 rounded-none border-transparent border-b-2 bg-transparent px-6 pt-3 pb-3 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
								value="pending"
							>
								<ClockIcon
									className="mr-2 h-4 w-4"
									size={16}
									weight="duotone"
								/>
								Pending
								{pendingCount > 0 && (
									<span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
										{pendingCount}
									</span>
								)}
							</TabsTrigger>
							<TabsTrigger
								className="h-12 rounded-none border-transparent border-b-2 bg-transparent px-6 pt-3 pb-3 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
								value="expired"
							>
								<XIcon className="mr-2 h-4 w-4" size={16} weight="bold" />
								Expired
								{expiredCount > 0 && (
									<span className="ml-2 rounded-full bg-muted-foreground/10 px-2 py-0.5 font-medium text-muted-foreground text-xs">
										{expiredCount}
									</span>
								)}
							</TabsTrigger>
							<TabsTrigger
								className="h-12 rounded-none border-transparent border-b-2 bg-transparent px-6 pt-3 pb-3 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
								value="accepted"
							>
								<CheckIcon className="mr-2 h-4 w-4" size={16} weight="bold" />
								Accepted
								{acceptedCount > 0 && (
									<span className="ml-2 rounded-full bg-green-500/10 px-2 py-0.5 font-medium text-green-600 text-xs">
										{acceptedCount}
									</span>
								)}
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent className="flex-1" value="pending">
						{pendingCount > 0 ? (
							<InvitationList
								invitations={filteredInvitations}
								isCancellingInvitation={isCancellingInvitation}
								onCancelInvitationAction={cancelInvitation}
							/>
						) : (
							<div className="flex h-full flex-col items-center justify-center p-8 text-center">
								<div className="mx-auto mb-6 w-fit rounded-2xl border border-primary/20 bg-primary/10 p-6">
									<EnvelopeIcon
										className="h-12 w-12 text-primary"
										size={48}
										weight="duotone"
									/>
								</div>
								<h3 className="mb-2 font-semibold text-lg">
									No Pending Invitations
								</h3>
								<p className="max-w-sm text-muted-foreground text-sm">
									All sent invitations have been responded to or have expired.
								</p>
							</div>
						)}
					</TabsContent>

					<TabsContent className="flex-1" value="expired">
						{expiredCount > 0 ? (
							<InvitationList
								invitations={filteredInvitations}
								isCancellingInvitation={isCancellingInvitation}
								onCancelInvitationAction={cancelInvitation}
							/>
						) : (
							<div className="flex h-full flex-col items-center justify-center p-8 text-center">
								<div className="mx-auto mb-6 w-fit rounded-2xl border border-orange-200 bg-orange-100 p-6">
									<ClockIcon
										className="h-12 w-12 text-orange-600"
										size={48}
										weight="duotone"
									/>
								</div>
								<h3 className="mb-2 font-semibold text-lg">
									No Expired Invitations
								</h3>
								<p className="max-w-sm text-muted-foreground text-sm">
									Great! You don't have any expired invitations at the moment.
								</p>
							</div>
						)}
					</TabsContent>

					<TabsContent className="flex-1" value="accepted">
						{acceptedCount > 0 ? (
							<InvitationList
								invitations={filteredInvitations}
								isCancellingInvitation={isCancellingInvitation}
								onCancelInvitationAction={cancelInvitation}
							/>
						) : (
							<div className="flex h-full flex-col items-center justify-center p-8 text-center">
								<div className="mx-auto mb-6 w-fit rounded-2xl border border-green-200 bg-green-100 p-6">
									<CheckIcon
										className="h-12 w-12 text-green-600"
										size={48}
										weight="bold"
									/>
								</div>
								<h3 className="mb-2 font-semibold text-lg">
									No Accepted Invitations Yet
								</h3>
								<p className="max-w-sm text-muted-foreground text-sm">
									When team members accept invitations, they'll appear here.
								</p>
							</div>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
