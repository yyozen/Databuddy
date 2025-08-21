'use client';

import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizations } from '@/hooks/use-organizations';
import { OrganizationsList } from './components/organizations-list';

function OrganizationsSkeleton() {
	return (
		<div className="h-full p-6">
			<div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<Card className="animate-pulse" key={`org-skeleton-${i.toString()}`}>
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />
								<div className="min-w-0 flex-1 space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-24" />
								</div>
							</div>
							<div className="mt-6 space-y-3">
								<Skeleton className="h-8 w-full" />
								<div className="flex gap-2">
									<Skeleton className="h-8 flex-1" />
									<Skeleton className="h-8 w-8" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

export default function OrganizationsPage() {
	const { organizations, activeOrganization, isLoading } = useOrganizations();

	return (
		<div className="flex h-full flex-col p-4">
			<Suspense fallback={<OrganizationsSkeleton />}>
				<OrganizationsList
					activeOrganization={activeOrganization}
					isLoading={isLoading}
					organizations={organizations}
				/>
			</Suspense>
		</div>
	);
}
