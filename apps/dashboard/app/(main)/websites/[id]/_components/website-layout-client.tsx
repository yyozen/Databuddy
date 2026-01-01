"use client";

import type { InferSelectModel, websites } from "@databuddy/db";
import { useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { WebsiteErrorState } from "@/components/website-error-state";
import { isAnalyticsRefreshingAtom } from "@/stores/jotai/filterAtoms";
import { AnalyticsToolbar } from "./analytics-toolbar";
import { WebsiteTrackingSetupTab } from "./tabs/tracking-setup-tab";

type Website = InferSelectModel<typeof websites>;

const NO_TOOLBAR_ROUTES = [
	"/assistant",
	"/map",
	"/flags",
	"/databunny",
	"/settings",
	"/users",
	"/agent",
	"/pulse",
];

interface WebsiteLayoutClientProps {
	children: React.ReactNode;
	websiteId: string;
	initialWebsite: Website | null;
	initialTrackingSetup: boolean;
}

export function WebsiteLayoutClient({
	children,
	websiteId,
	initialWebsite,
	initialTrackingSetup,
}: WebsiteLayoutClientProps) {
	const pathname = usePathname();
	const queryClient = useQueryClient();
	const [isRefreshing, setIsRefreshing] = useAtom(isAnalyticsRefreshingAtom);

	const isDemoRoute = pathname?.startsWith("/demo/");
	const hideToolbar = NO_TOOLBAR_ROUTES.some((route) =>
		pathname.includes(route)
	);

	if (!initialWebsite) {
		return <WebsiteErrorState error={{ data: { code: "NOT_FOUND" } }} />;
	}

	const isTrackingSetup = isDemoRoute ? true : initialTrackingSetup;
	const showTrackingSetup = !(isDemoRoute || isTrackingSetup);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["websites", websiteId] }),
				queryClient.invalidateQueries({
					queryKey: ["websites", "isTrackingSetup", websiteId],
				}),
				queryClient.invalidateQueries({
					queryKey: ["dynamic-query", websiteId],
				}),
				queryClient.invalidateQueries({
					queryKey: ["batch-dynamic-query", websiteId],
				}),
			]);
			toast.success("Data refreshed");
		} catch {
			toast.error("Failed to refresh data");
		} finally {
			setIsRefreshing(false);
		}
	};

	const renderContent = () => {
		if (hideToolbar) {
			return children;
		}

		if (showTrackingSetup) {
			return (
				<div className="p-4">
					<WebsiteTrackingSetupTab websiteId={websiteId} />
				</div>
			);
		}

		return children;
	};

	return (
		<div className="flex h-full flex-col overflow-hidden">
			{!hideToolbar && (
				<div className="sticky top-0 right-0 left-0 z-50 shrink-0 overscroll-contain bg-background md:top-0 md:left-84">
					<AnalyticsToolbar
						isDisabled={!(isDemoRoute || isTrackingSetup)}
						isLoading={false}
						isRefreshing={isRefreshing}
						onRefreshAction={handleRefresh}
						websiteId={websiteId}
					/>
				</div>
			)}

			<div
				className={
					hideToolbar
						? "min-h-0 flex-1"
						: "min-h-0 flex-1 overflow-y-auto overscroll-contain"
				}
			>
				{renderContent()}
			</div>
		</div>
	);
}
