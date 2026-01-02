"use client";

import { ArrowClockwiseIcon, HouseIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WebsiteDialog } from "@/components/website-dialog";
import { useGlobalAnalytics } from "@/hooks/use-global-analytics";
import { usePulseStatus } from "@/hooks/use-pulse-status";
import { useWebsites } from "@/hooks/use-websites";
import { cn } from "@/lib/utils";
import { PageHeader } from "../websites/_components/page-header";
import { CompactWebsiteGrid } from "./_components/compact-website-grid";
import { ContextualSection } from "./_components/contextual-section";
import { GlobalSummaryRow } from "./_components/global-summary-row";

export default function HomePage() {
	const [dialogOpen, setDialogOpen] = useState(false);

	const { websites, chartData, activeUsers, isLoading, isFetching, refetch } =
		useWebsites();

	const {
		totalActiveUsers,
		totalViews,
		averageTrend,
		trendDirection,
		websiteCount,
		topPerformers,
		needsSetup,
	} = useGlobalAnalytics();

	const {
		totalMonitors,
		activeMonitors,
		healthPercentage,
		isLoading: isPulseLoading,
	} = usePulseStatus();

	const handleRefresh = () => {
		refetch();
	};

	return (
		<div className="flex h-full flex-col">
			<PageHeader
				description="Overview of all your websites and analytics"
				icon={<HouseIcon />}
				right={
					<>
						<Button
							aria-label="Refresh data"
							disabled={isLoading || isFetching}
							onClick={handleRefresh}
							size="icon"
							variant="secondary"
						>
							<ArrowClockwiseIcon
								aria-hidden
								className={cn(
									"size-4",
									isLoading || isFetching ? "animate-spin" : ""
								)}
							/>
						</Button>
						<Button
							className={cn(
								"gap-2 px-3 py-2 font-medium sm:px-4 sm:py-2",
								"bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
								"group relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
							)}
							onClick={() => setDialogOpen(true)}
							size="default"
						>
							<div className="absolute inset-0 -translate-x-full bg-linear-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 group-hover:translate-x-full" />
							<PlusIcon className="relative z-10 size-4 transition-transform duration-300 group-hover:rotate-90" />
							<span className="relative z-10 truncate">New Website</span>
						</Button>
					</>
				}
				title="Overview"
			/>

			<div className="flex-1 space-y-6 overflow-y-auto p-3 sm:p-4 lg:p-6">
				<GlobalSummaryRow
					averageTrend={averageTrend}
					isLoading={isLoading}
					pulseHealthPercentage={healthPercentage}
					totalActiveUsers={totalActiveUsers}
					totalMonitors={totalMonitors}
					totalViews={totalViews}
					trendDirection={trendDirection}
					websiteCount={websiteCount}
				/>

				<CompactWebsiteGrid
					activeUsers={activeUsers}
					chartData={chartData}
					isLoading={isLoading}
					onAddWebsiteAction={() => setDialogOpen(true)}
					websites={websites}
				/>

				<ContextualSection
					activeMonitors={activeMonitors}
					isLoading={isLoading || isPulseLoading}
					needsSetup={needsSetup}
					pulseHealthPercentage={healthPercentage}
					topPerformers={topPerformers}
					totalMonitors={totalMonitors}
				/>
			</div>

			<WebsiteDialog onOpenChange={setDialogOpen} open={dialogOpen} />
		</div>
	);
}
