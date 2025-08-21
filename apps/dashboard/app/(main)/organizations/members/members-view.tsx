'use client';

import { UsersIcon } from '@phosphor-icons/react';

import { Skeleton } from '@/components/ui/skeleton';
import {
	type ActiveOrganization,
	type Organization,
	useOrganizationMembers,
} from '@/hooks/use-organizations';
import { MemberList } from './member-list';

function MembersSkeleton() {
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
						<Skeleton className="h-8 w-24" />
					</div>
				))}
			</div>
		</div>
	);
}

function EmptyMembersState() {
	return (
		<div className="flex h-full flex-col items-center justify-center p-8 text-center">
			<div className="mx-auto mb-8 w-fit rounded-2xl border border-primary/20 bg-primary/10 p-8">
				<UsersIcon
					className="h-16 w-16 text-primary"
					size={64}
					weight="duotone"
				/>
			</div>
			<h3 className="mb-4 font-bold text-2xl">Build Your Team</h3>
			<p className="mb-8 max-w-md text-muted-foreground leading-relaxed">
				This organization doesn't have any team members yet. Invite people to
				start collaborating and building together.
			</p>
			<div className="rounded-lg border border-dashed bg-muted/20 p-6">
				<div className="flex items-center justify-center gap-4 text-muted-foreground text-sm">
					<div className="flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-primary" />
						<span>Assign roles</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-primary" />
						<span>Track activity</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-primary" />
						<span>Share access</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function ErrorState({ error }: { error: Error }) {
	return (
		<div className="flex h-full flex-col items-center justify-center p-8 text-center">
			<div className="mx-auto mb-8 w-fit rounded-2xl border border-destructive/20 bg-destructive/10 p-8">
				<UsersIcon
					className="h-16 w-16 text-destructive"
					size={64}
					weight="duotone"
				/>
			</div>
			<h3 className="mb-4 font-bold text-2xl text-destructive">
				Failed to Load Members
			</h3>
			<p className="max-w-md text-muted-foreground leading-relaxed">
				{error.message}
			</p>
		</div>
	);
}

export function MembersView({
	organization,
}: {
	organization: NonNullable<Organization | ActiveOrganization>;
}) {
	const {
		members,
		isLoading: isLoadingMembers,
		removeMember,
		isRemovingMember,
		updateMember,
		isUpdatingMember,
		error: membersError,
	} = useOrganizationMembers(organization.id);

	if (isLoadingMembers) {
		return <MembersSkeleton />;
	}

	if (membersError) {
		return <ErrorState error={membersError} />;
	}

	if (!members || members.length === 0) {
		return <EmptyMembersState />;
	}

	return (
		<div className="h-full p-6">
			<MemberList
				isRemovingMember={isRemovingMember}
				isUpdatingMember={isUpdatingMember}
				members={members}
				onRemoveMember={removeMember}
				onUpdateRole={updateMember}
				organizationId={organization.id}
			/>
		</div>
	);
}
