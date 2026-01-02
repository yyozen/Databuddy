"use client";

import {
	EyeIcon,
	HeartbeatIcon,
	TrendDownIcon,
	TrendUpIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
	label: string;
	value: string | number;
	icon: React.ReactNode;
	trend?: {
		value: number;
		direction: "up" | "down" | "neutral";
	};
	subtitle?: string;
	isLoading?: boolean;
	className?: string;
}

function SummaryCard({
	label,
	value,
	icon,
	trend,
	subtitle,
	isLoading,
	className,
}: SummaryCardProps) {
	if (isLoading) {
		return (
			<div
				className={cn(
					"flex items-center gap-3 rounded border bg-card p-4",
					className
				)}
			>
				<Skeleton className="size-10 rounded" />
				<div className="flex-1 space-y-1.5">
					<Skeleton className="h-3 w-16" />
					<Skeleton className="h-6 w-20" />
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded border bg-card p-4",
				className
			)}
		>
			<div className="flex size-10 shrink-0 items-center justify-center rounded bg-accent">
				{icon}
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-muted-foreground text-xs">{label}</p>
				<div className="flex items-center gap-2">
					<span className="font-semibold text-foreground text-xl tabular-nums">
						{typeof value === "number" ? value.toLocaleString() : value}
					</span>
					{trend && trend.direction !== "neutral" && (
						<span
							className={cn(
								"flex items-center gap-0.5 font-medium text-xs",
								trend.direction === "up" && "text-success",
								trend.direction === "down" && "text-destructive"
							)}
						>
							{trend.direction === "up" ? (
								<TrendUpIcon className="size-3.5" weight="fill" />
							) : (
								<TrendDownIcon className="size-3.5" weight="fill" />
							)}
							{trend.value.toFixed(0)}%
						</span>
					)}
				</div>
				{subtitle && (
					<p className="text-muted-foreground text-xs">{subtitle}</p>
				)}
			</div>
		</div>
	);
}

interface GlobalSummaryRowProps {
	totalActiveUsers: number;
	totalViews: number;
	averageTrend: number;
	trendDirection: "up" | "down" | "neutral";
	websiteCount: number;
	pulseHealthPercentage: number;
	totalMonitors: number;
	isLoading?: boolean;
}

export function GlobalSummaryRow({
	totalActiveUsers,
	totalViews,
	averageTrend,
	trendDirection,
	websiteCount,
	pulseHealthPercentage,
	totalMonitors,
	isLoading,
}: GlobalSummaryRowProps) {
	const formatViews = (views: number) => {
		if (views >= 1_000_000) {
			return `${(views / 1_000_000).toFixed(1)}M`;
		}
		if (views >= 1000) {
			return `${(views / 1000).toFixed(1)}K`;
		}
		return views.toString();
	};

	return (
		<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
			<SummaryCard
				icon={
					<UsersIcon
						className="size-5 text-accent-foreground"
						weight="duotone"
					/>
				}
				isLoading={isLoading}
				label="Active Now"
				subtitle={`across ${websiteCount} website${websiteCount !== 1 ? "s" : ""}`}
				value={totalActiveUsers}
			/>
			<SummaryCard
				icon={
					<EyeIcon className="size-5 text-accent-foreground" weight="duotone" />
				}
				isLoading={isLoading}
				label="Total Views"
				trend={
					averageTrend > 0
						? { value: averageTrend, direction: trendDirection }
						: undefined
				}
				value={formatViews(totalViews)}
			/>
			<SummaryCard
				className="col-span-2 lg:col-span-2"
				icon={
					<HeartbeatIcon
						className="size-5 text-accent-foreground"
						weight="duotone"
					/>
				}
				isLoading={isLoading}
				label="Pulse Status"
				subtitle={
					totalMonitors > 0
						? `${totalMonitors} monitor${totalMonitors !== 1 ? "s" : ""} configured`
						: "No monitors configured"
				}
				value={
					totalMonitors > 0
						? `${pulseHealthPercentage.toFixed(0)}% healthy`
						: "—"
				}
			/>
		</div>
	);
}
