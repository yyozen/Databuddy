"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";
import NotFound from "@/app/not-found";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrackingSetup } from "@/hooks/use-tracking-setup";
import { useWebsite } from "@/hooks/use-websites";
import { isAnalyticsRefreshingAtom } from "@/stores/jotai/filterAtoms";
import { AnalyticsToolbar } from "./_components/analytics-toolbar";
import { FiltersSection } from "./_components/filters-section";

type WebsiteLayoutProps = {
	children: React.ReactNode;
};

export default function WebsiteLayout({ children }: WebsiteLayoutProps) {
	const { id } = useParams();
	const pathname = usePathname();
	const queryClient = useQueryClient();
	const { isTrackingSetup, isTrackingSetupLoading } = useTrackingSetup(
		id as string
	);
	const { isLoading: isWebsiteLoading } = useWebsite(id as string);
	const [isRefreshing, setIsRefreshing] = useAtom(isAnalyticsRefreshingAtom);
	const toolbarRef = useRef<HTMLDivElement>(null);

	const noToolbarPages = [
		"/assistant",
		"/map",
		"/flags",
		"/databunny",
		"/settings",
		"/users",
	];

	const isAssistantPage = noToolbarPages.some((page) =>
		pathname.includes(page)
	);

	if (!id) {
		return <NotFound />;
	}

	const websiteId = id as string;
	const isToolbarLoading =
		isWebsiteLoading || isTrackingSetupLoading || isTrackingSetup === null;
	const isToolbarDisabled = !isTrackingSetup || isToolbarLoading;

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["websites", id] }),
				queryClient.invalidateQueries({
					queryKey: ["websites", "isTrackingSetup", id],
				}),
				queryClient.invalidateQueries({ queryKey: ["dynamic-query", id] }),
				queryClient.invalidateQueries({
					queryKey: ["batch-dynamic-query", id],
				}),
			]);
			toast.success("Data refreshed");
		} catch {
			toast.error("Failed to refresh data");
		} finally {
			setIsRefreshing(false);
		}
	};

	return (
		<div className="flex h-full flex-col overflow-hidden">
			{!isAssistantPage && (
				<div
					className="sticky top-0 right-0 left-0 z-50 shrink-0 space-y-0 bg-background md:top-0 md:left-84"
					ref={toolbarRef}
				>
					<AnalyticsToolbar
						isDisabled={isToolbarDisabled}
						isLoading={isToolbarLoading}
						isRefreshing={isRefreshing}
						onRefresh={handleRefresh}
						websiteId={websiteId}
					/>
					{isTrackingSetup && <FiltersSection />}
				</div>
			)}

			<div
				className={`${isAssistantPage ? "min-h-0 flex-1" : "min-h-0 flex-1 overflow-y-auto overscroll-contain"}`}
			>
				{!isAssistantPage && isTrackingSetupLoading ? (
					<div className="space-y-4 p-4">
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{[1, 2].map((num) => (
								<div
									className="rounded border border-sidebar-border bg-sidebar p-4"
									key={`skeleton-${num}`}
								>
									<Skeleton className="h-80 w-full" />
								</div>
							))}
						</div>
					</div>
				) : !isAssistantPage && isTrackingSetup === false ? (
					<div className="flex h-full items-center justify-center p-6">
						<div className="max-w-md space-y-4 text-center">
							<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
								<WarningCircleIcon className="size-6 text-muted-foreground" />
							</div>
							<h3 className="font-semibold text-lg">Tracking Not Setup</h3>
							<p className="text-muted-foreground text-sm">
								Install the tracking script to start collecting analytics data
								for this website.
							</p>
							<Button asChild>
								<Link href={`/websites/${websiteId}/settings`}>
									Setup Tracking
								</Link>
							</Button>
						</div>
					</div>
				) : (
					children
				)}
			</div>
		</div>
	);
}
