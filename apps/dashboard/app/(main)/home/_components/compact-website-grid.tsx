"use client";

import type {
	ProcessedMiniChartData,
	Website,
} from "@databuddy/shared/types/website";
import {
	CodeIcon,
	EyeIcon,
	MinusIcon,
	PlusIcon,
	TrendDownIcon,
	TrendUpIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { FaviconImage } from "@/components/analytics/favicon-image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CompactWebsiteCardProps {
	website: Website;
	chartData?: ProcessedMiniChartData;
	activeUsers?: number;
}

function formatNumber(num: number) {
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(1)}M`;
	}
	if (num >= 1000) {
		return `${(num / 1000).toFixed(1)}K`;
	}
	return num.toString();
}

function CompactWebsiteCard({
	website,
	chartData,
	activeUsers,
}: CompactWebsiteCardProps) {
	const hasData = chartData && chartData.totalViews > 0;
	const trend = chartData?.trend;

	return (
		<Link
			className="group block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
			href={`/websites/${website.id}`}
		>
			<Card className="flex h-full items-center gap-3 p-3 transition-colors group-hover:border-primary/60">
				<FaviconImage
					altText={`${website.name} favicon`}
					className="shrink-0"
					domain={website.domain}
					size={32}
				/>
				<div className="min-w-0 flex-1">
					<p className="truncate font-medium text-foreground text-sm">
						{website.name || website.domain}
					</p>
					<p className="truncate text-muted-foreground text-xs">
						{website.domain}
					</p>
				</div>
				{activeUsers !== undefined && activeUsers > 0 && (
					<div className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-success text-xs tabular-nums">
						<span className="relative flex size-1.5">
							<span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
							<span className="relative inline-flex size-1.5 rounded-full bg-success" />
						</span>
						{activeUsers}
					</div>
				)}
				<div className="flex shrink-0 flex-col items-end gap-0.5">
					{hasData ? (
						<>
							<span className="flex items-center gap-1 font-medium text-foreground text-xs tabular-nums">
								<EyeIcon
									className="size-3.5 text-muted-foreground"
									weight="duotone"
								/>
								{formatNumber(chartData.totalViews)}
							</span>
							{trend && (
								<span
									className={cn(
										"flex items-center gap-0.5 text-xs tabular-nums",
										trend.type === "up" && "text-success",
										trend.type === "down" && "text-destructive",
										trend.type === "neutral" && "text-muted-foreground"
									)}
								>
									{trend.type === "up" && (
										<TrendUpIcon className="size-3" weight="fill" />
									)}
									{trend.type === "down" && (
										<TrendDownIcon className="size-3" weight="fill" />
									)}
									{trend.type === "neutral" && <MinusIcon className="size-3" />}
									{trend.type === "up" && "+"}
									{trend.type === "down" && "-"}
									{trend.value.toFixed(0)}%
								</span>
							)}
						</>
					) : (
						<span className="flex items-center gap-1 text-amber-500 text-xs">
							<CodeIcon className="size-3.5" weight="duotone" />
							Setup
						</span>
					)}
				</div>
			</Card>
		</Link>
	);
}

function CompactWebsiteCardSkeleton() {
	return (
		<Card className="flex items-center gap-3 p-3">
			<Skeleton className="size-8 shrink-0 rounded" />
			<div className="min-w-0 flex-1 space-y-1">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-3 w-32" />
			</div>
			<div className="flex flex-col items-end gap-1">
				<Skeleton className="h-3.5 w-10" />
				<Skeleton className="h-3 w-8" />
			</div>
		</Card>
	);
}

interface CompactWebsiteGridProps {
	websites: Website[];
	chartData?: Record<string, ProcessedMiniChartData>;
	activeUsers?: Record<string, number>;
	isLoading?: boolean;
	onAddWebsiteAction: () => void;
}

export function CompactWebsiteGrid({
	websites,
	chartData,
	activeUsers,
	isLoading,
	onAddWebsiteAction,
}: CompactWebsiteGridProps) {
	if (isLoading) {
		return (
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="font-semibold text-foreground text-sm">
						Your Websites
					</h2>
				</div>
				<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<CompactWebsiteCardSkeleton key={`skeleton-${i}`} />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-foreground text-sm">Your Websites</h2>
				<Link
					className="text-muted-foreground text-xs hover:text-foreground"
					href="/websites"
				>
					View all
				</Link>
			</div>
			{websites.length === 0 ? (
				<Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
					<div className="flex size-12 items-center justify-center rounded-full bg-accent">
						<PlusIcon
							className="size-6 text-accent-foreground"
							weight="duotone"
						/>
					</div>
					<div>
						<p className="font-medium text-foreground text-sm">
							No websites yet
						</p>
						<p className="text-muted-foreground text-xs">
							Add your first website to start tracking analytics
						</p>
					</div>
					<Button onClick={onAddWebsiteAction} size="sm">
						<PlusIcon className="size-4" />
						Add Website
					</Button>
				</Card>
			) : (
				<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{websites.map((website) => (
						<CompactWebsiteCard
							activeUsers={activeUsers?.[website.id]}
							chartData={chartData?.[website.id]}
							key={website.id}
							website={website}
						/>
					))}
					<button
						className="flex items-center justify-center gap-2 rounded border border-dashed bg-card p-3 text-muted-foreground text-sm transition-colors hover:border-primary/60 hover:text-foreground"
						onClick={onAddWebsiteAction}
						type="button"
					>
						<PlusIcon className="size-4" />
						Add Website
					</button>
				</div>
			)}
		</div>
	);
}
