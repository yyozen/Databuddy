"use client";

import type { DateRange } from "@databuddy/shared/types/analytics";
import { PlusIcon } from "@phosphor-icons/react";
import { useAtomValue } from "jotai";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { StatCard } from "@/components/analytics/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
	formattedDateRangeAtom,
	timeGranularityAtom,
	timezoneAtom,
} from "@/stores/jotai/filterAtoms";
import { AddCardSheet } from "./_components/add-card-sheet";
import { useDashboardData } from "./_components/hooks/use-dashboard-data";
import { getCategoryIcon } from "./_components/utils/category-utils";
import type { DashboardCardConfig } from "./_components/utils/types";

const DEFAULT_CARDS: DashboardCardConfig[] = [
	{
		id: "pageviews",
		type: "card",
		queryType: "summary_metrics",
		field: "pageviews",
		label: "Pageviews",
		displayMode: "text",
		category: "Analytics",
	},
	{
		id: "visitors",
		type: "card",
		queryType: "summary_metrics",
		field: "unique_visitors",
		label: "Unique Visitors",
		displayMode: "text",
		category: "Analytics",
	},
	{
		id: "sessions",
		type: "card",
		queryType: "summary_metrics",
		field: "sessions",
		label: "Sessions",
		displayMode: "text",
		category: "Analytics",
	},
	{
		id: "bounce-rate",
		type: "card",
		queryType: "summary_metrics",
		field: "bounce_rate",
		label: "Bounce Rate",
		displayMode: "text",
		category: "Analytics",
	},
];

export default function TestPage() {
	const { id: websiteId } = useParams<{ id: string }>();
	const formattedDateRange = useAtomValue(formattedDateRangeAtom);
	const granularity = useAtomValue(timeGranularityAtom);
	const timezone = useAtomValue(timezoneAtom);
	const [cards, setCards] = useState<DashboardCardConfig[]>(DEFAULT_CARDS);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const dateRange: DateRange = useMemo(
		() => ({
			start_date: formattedDateRange.startDate,
			end_date: formattedDateRange.endDate,
			granularity,
			timezone,
		}),
		[
			formattedDateRange.startDate,
			formattedDateRange.endDate,
			granularity,
			timezone,
		]
	);

	const { getValue, getChartData, isLoading, isFetching } = useDashboardData(
		websiteId,
		dateRange,
		cards
	);

	const handleAddCard = (card: DashboardCardConfig) => {
		setCards((prev) => [...prev, card]);
	};

	return (
		<div className="space-y-6 p-4 lg:p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-lg">Custom Dashboard</h1>
					<p className="text-muted-foreground text-sm">
						{cards.length} card{cards.length !== 1 ? "s" : ""}
					</p>
				</div>
				<Button
					onClick={() => setIsSheetOpen(true)}
					size="sm"
					variant="outline"
				>
					<PlusIcon className="mr-1.5 size-4" />
					Add Card
				</Button>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{cards.map((card) => (
					<StatCard
						chartData={
							card.displayMode === "chart"
								? getChartData(card.queryType, card.field)
								: undefined
						}
						chartType="area"
						displayMode={card.displayMode}
						icon={getCategoryIcon(card.category || "Other")}
						id={card.id}
						isLoading={isLoading || isFetching}
						key={card.id}
						title={card.title || card.label}
						value={getValue(card.queryType, card.field)}
					/>
				))}

				{/* Add Card Tile */}
				<Card
					className={cn(
						"group flex cursor-pointer flex-col items-center justify-center gap-2 border-dashed bg-transparent py-0 transition-all hover:border-primary hover:bg-accent/50",
						"min-h-[168px]"
					)}
					onClick={() => setIsSheetOpen(true)}
				>
					<div className="flex size-10 items-center justify-center rounded-full bg-accent transition-colors group-hover:bg-primary/10">
						<PlusIcon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
					</div>
					<span className="font-medium text-muted-foreground text-sm transition-colors group-hover:text-foreground">
						Add Card
					</span>
				</Card>
			</div>

			<AddCardSheet
				dateRange={dateRange}
				isOpen={isSheetOpen}
				onAddAction={handleAddCard}
				onCloseAction={() => setIsSheetOpen(false)}
				websiteId={websiteId}
			/>
		</div>
	);
}
