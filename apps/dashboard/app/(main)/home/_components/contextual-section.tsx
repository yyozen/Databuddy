"use client";

import type { ProcessedMiniChartData } from "@databuddy/shared/types/website";
import {
	CheckCircleIcon,
	HeartbeatIcon,
	TrendUpIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Highlight {
	id: string;
	type: "success" | "warning" | "info";
	icon: React.ReactNode;
	title: string;
	description: string;
	link?: string;
}

interface PulseStatusCardProps {
	healthPercentage: number;
	totalMonitors: number;
	activeMonitors: number;
	isLoading?: boolean;
}

function PulseStatusCard({
	healthPercentage,
	totalMonitors,
	activeMonitors,
	isLoading,
}: PulseStatusCardProps) {
	if (isLoading) {
		return (
			<Card className="flex-1">
				<CardHeader className="pb-2">
					<Skeleton className="h-4 w-24" />
				</CardHeader>
				<CardContent className="space-y-3">
					<Skeleton className="h-2 w-full" />
					<Skeleton className="h-4 w-32" />
				</CardContent>
			</Card>
		);
	}

	if (totalMonitors === 0) {
		return (
			<Card className="flex-1">
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 font-medium text-sm">
						<HeartbeatIcon
							className="size-4 text-muted-foreground"
							weight="duotone"
						/>
						Pulse Status
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						No monitors configured.{" "}
						<Link className="text-primary hover:underline" href="/websites">
							Set up uptime monitoring
						</Link>{" "}
						for your websites.
					</p>
				</CardContent>
			</Card>
		);
	}

	const isHealthy = healthPercentage === 100;

	return (
		<Card className="flex-1">
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 font-medium text-sm">
					<HeartbeatIcon
						className="size-4 text-muted-foreground"
						weight="duotone"
					/>
					Pulse Status
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="space-y-1.5">
					<div className="flex items-center justify-between text-xs">
						<span className="text-muted-foreground">
							{activeMonitors}/{totalMonitors} monitors active
						</span>
						<span
							className={cn(
								"font-medium",
								isHealthy ? "text-success" : "text-amber-500"
							)}
						>
							{healthPercentage.toFixed(0)}%
						</span>
					</div>
					<div className="h-2 overflow-hidden rounded-full bg-muted">
						<div
							className={cn(
								"h-full transition-all",
								isHealthy ? "bg-success" : "bg-amber-500"
							)}
							style={{ width: `${healthPercentage}%` }}
						/>
					</div>
				</div>
				<p className="text-muted-foreground text-xs">
					{isHealthy
						? "All monitors are operational"
						: `${totalMonitors - activeMonitors} monitor${totalMonitors - activeMonitors !== 1 ? "s" : ""} paused`}
				</p>
			</CardContent>
		</Card>
	);
}

interface HighlightsCardProps {
	topPerformers: Array<{
		id: string;
		name: string | null;
		domain: string;
		views: number;
		trend: ProcessedMiniChartData["trend"];
	}>;
	needsSetup: Array<{
		id: string;
		name: string | null;
		domain: string;
	}>;
	isLoading?: boolean;
}

function HighlightsCard({
	topPerformers,
	needsSetup,
	isLoading,
}: HighlightsCardProps) {
	const highlights = useMemo<Highlight[]>(() => {
		const items: Highlight[] = [];

		for (const performer of topPerformers.slice(0, 2)) {
			if (performer.trend?.type === "up" && performer.trend.value > 10) {
				items.push({
					id: `trend-${performer.id}`,
					type: "success",
					icon: <TrendUpIcon className="size-4 text-success" weight="fill" />,
					title: `${performer.name || performer.domain} is growing`,
					description: `+${performer.trend.value.toFixed(0)}% traffic increase`,
					link: `/websites/${performer.id}`,
				});
			}
		}

		if (needsSetup.length > 0) {
			const first = needsSetup[0];
			items.push({
				id: `setup-${first.id}`,
				type: "warning",
				icon: (
					<WarningCircleIcon className="size-4 text-amber-500" weight="fill" />
				),
				title: `${first.name || first.domain} needs setup`,
				description:
					needsSetup.length > 1
						? `+${needsSetup.length - 1} more website${needsSetup.length > 2 ? "s" : ""} need tracking`
						: "Add tracking code to start collecting data",
				link: `/websites/${first.id}?tab=tracking-setup`,
			});
		}

		if (items.length === 0 && topPerformers.length > 0) {
			items.push({
				id: "all-good",
				type: "success",
				icon: <CheckCircleIcon className="size-4 text-success" weight="fill" />,
				title: "All systems operational",
				description: `Tracking ${topPerformers.length} active website${topPerformers.length !== 1 ? "s" : ""}`,
			});
		}

		return items;
	}, [topPerformers, needsSetup]);

	if (isLoading) {
		return (
			<Card className="flex-1">
				<CardHeader className="pb-2">
					<Skeleton className="h-4 w-24" />
				</CardHeader>
				<CardContent className="space-y-3">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="flex-1">
			<CardHeader className="pb-2">
				<CardTitle className="font-medium text-sm">Highlights</CardTitle>
			</CardHeader>
			<CardContent>
				{highlights.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						No highlights yet. Add a website to get started.
					</p>
				) : (
					<div className="space-y-2">
						{highlights.map((highlight) => (
							<div key={highlight.id}>
								{highlight.link ? (
									<Link
										className="flex items-start gap-2 rounded p-2 transition-colors hover:bg-accent"
										href={highlight.link}
									>
										<div className="mt-0.5 shrink-0">{highlight.icon}</div>
										<div className="min-w-0 flex-1">
											<p className="font-medium text-foreground text-sm">
												{highlight.title}
											</p>
											<p className="text-muted-foreground text-xs">
												{highlight.description}
											</p>
										</div>
									</Link>
								) : (
									<div className="flex items-start gap-2 p-2">
										<div className="mt-0.5 shrink-0">{highlight.icon}</div>
										<div className="min-w-0 flex-1">
											<p className="font-medium text-foreground text-sm">
												{highlight.title}
											</p>
											<p className="text-muted-foreground text-xs">
												{highlight.description}
											</p>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

interface ContextualSectionProps {
	topPerformers: HighlightsCardProps["topPerformers"];
	needsSetup: HighlightsCardProps["needsSetup"];
	pulseHealthPercentage: number;
	totalMonitors: number;
	activeMonitors: number;
	isLoading?: boolean;
}

export function ContextualSection({
	topPerformers,
	needsSetup,
	pulseHealthPercentage,
	totalMonitors,
	activeMonitors,
	isLoading,
}: ContextualSectionProps) {
	return (
		<div className="grid gap-3 lg:grid-cols-2">
			<PulseStatusCard
				activeMonitors={activeMonitors}
				healthPercentage={pulseHealthPercentage}
				isLoading={isLoading}
				totalMonitors={totalMonitors}
			/>
			<HighlightsCard
				isLoading={isLoading}
				needsSetup={needsSetup}
				topPerformers={topPerformers}
			/>
		</div>
	);
}
