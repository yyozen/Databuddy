"use client";

import {
	ChartLineIcon,
	CursorClickIcon,
	EyeIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import type {
	ChartStepType,
	ChartType,
	StatCardDisplayMode,
} from "@/components/analytics/stat-card";
import { StatCard } from "@/components/analytics/stat-card";
import { Button } from "@/components/ui/button";

const SAMPLE_CHART_DATA = [
	{ date: "2026-01-01", value: 120 },
	{ date: "2026-01-02", value: 145 },
	{ date: "2026-01-03", value: 132 },
	{ date: "2026-01-04", value: 178 },
	{ date: "2026-01-05", value: 165 },
	{ date: "2026-01-06", value: 198 },
	{ date: "2026-01-07", value: 210 },
];

interface DashboardItemConfig {
	id: string;
	title: string;
	value: string | number;
	description?: string;
	icon?: React.ElementType;
	trend?: number;
	invertTrend?: boolean;
	chartData?: Array<{ date: string; value: number }>;
	chartType?: ChartType;
	chartStepType?: ChartStepType;
	displayMode: StatCardDisplayMode;
}

const DEFAULT_ITEMS: DashboardItemConfig[] = [
	{
		id: "active-users",
		title: "Active Now",
		value: 42,
		description: "real-time visitors",
		icon: UsersIcon,
		displayMode: "text",
	},
	{
		id: "pageviews",
		title: "Pageviews",
		value: "12.4K",
		icon: EyeIcon,
		trend: 12.5,
		chartData: SAMPLE_CHART_DATA,
		chartType: "area",
		displayMode: "chart",
	},
	{
		id: "events",
		title: "Events",
		value: "3.2K",
		icon: CursorClickIcon,
		trend: -4.2,
		chartData: SAMPLE_CHART_DATA.map((d) => ({ ...d, value: d.value * 0.3 })),
		chartType: "bar",
		displayMode: "chart",
	},
	{
		id: "bounce-rate",
		title: "Bounce Rate",
		value: "34%",
		description: "last 7 days",
		icon: ChartLineIcon,
		displayMode: "text",
	},
];

export default function TestPage() {
	const [items, setItems] = useState<DashboardItemConfig[]>(DEFAULT_ITEMS);
	const [isLoading, setIsLoading] = useState(false);

	const toggleLoading = () => {
		setIsLoading((prev) => !prev);
	};

	const shuffleItems = () => {
		setItems((prev) => [...prev].sort(() => Math.random() - 0.5));
	};

	return (
		<div className="space-y-6 p-4 lg:p-6">
			<div className="flex items-center justify-between">
				<h1 className="font-semibold text-lg">Custom Dashboard</h1>
				<div className="flex gap-2">
					<Button onClick={toggleLoading} size="sm" variant="outline">
						{isLoading ? "Stop Loading" : "Simulate Loading"}
					</Button>
					<Button onClick={shuffleItems} size="sm" variant="outline">
						Shuffle
					</Button>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{items.map((item) => (
					<StatCard
						chartData={item.chartData}
						chartStepType={item.chartStepType}
						chartType={item.chartType}
						description={item.description}
						displayMode={item.displayMode}
						icon={item.icon}
						id={item.id}
						invertTrend={item.invertTrend}
						isLoading={isLoading}
						key={item.id}
						title={item.title}
						trend={item.trend}
						value={item.value}
					/>
				))}
			</div>
		</div>
	);
}
