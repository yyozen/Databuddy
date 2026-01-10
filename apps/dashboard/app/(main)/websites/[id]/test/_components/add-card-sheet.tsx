"use client";

import type { DateRange } from "@databuddy/shared/types/analytics";
import type { QueryOutputField } from "@databuddy/shared/types/query";
import {
	CaretDownIcon,
	ChartBarIcon,
	ChartLineUpIcon,
	CheckIcon,
	GaugeIcon,
	SpinnerGapIcon,
	SquaresFourIcon,
	TextTIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { StatCardDisplayMode } from "@/components/analytics/stat-card";
import { StatCard } from "@/components/analytics/stat-card";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDashboardData } from "./hooks/use-dashboard-data";
import type { QueryTypeOption } from "./hooks/use-query-types";
import { useQueryTypes } from "./hooks/use-query-types";
import { getCategoryIcon } from "./utils/category-utils";
import type { DashboardCardConfig } from "./utils/types";

// Re-export for convenience
export type { DashboardCardConfig } from "./utils/types";

/** Visualization types compatible with stat cards */
const CARD_COMPATIBLE_VISUALIZATIONS = new Set([
	"metric",
	"timeseries",
	"area",
	"line",
]);

interface AddCardSheetProps {
	isOpen: boolean;
	onCloseAction: () => void;
	onAddAction: (card: DashboardCardConfig) => void;
	websiteId: string;
	dateRange: DateRange;
}

function mapVisualizationToDisplayMode(
	viz: QueryTypeOption["defaultVisualization"]
): StatCardDisplayMode {
	switch (viz) {
		case "timeseries":
		case "area":
		case "line":
			return "chart";
		default:
			return "text";
	}
}

function isMetricType(viz: QueryTypeOption["defaultVisualization"]): boolean {
	return viz === "metric";
}

function isTrendType(viz: QueryTypeOption["defaultVisualization"]): boolean {
	return viz === "timeseries" || viz === "area" || viz === "line";
}

export function AddCardSheet({
	isOpen,
	onCloseAction,
	onAddAction,
	websiteId,
	dateRange,
}: AddCardSheetProps) {
	const { queryTypes, isLoading: isLoadingTypes } = useQueryTypes();

	const [selectedQueryType, setSelectedQueryType] =
		useState<QueryTypeOption | null>(null);
	const [selectedField, setSelectedField] = useState<QueryOutputField | null>(
		null
	);
	const [displayMode, setDisplayMode] = useState<StatCardDisplayMode>("text");
	const [customTitle, setCustomTitle] = useState("");
	const [isQueryTypeOpen, setIsQueryTypeOpen] = useState(false);
	const [isFieldOpen, setIsFieldOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Filter and group query types for cards
	const { metricTypes, trendTypes } = useMemo(() => {
		const compatible = queryTypes.filter((t) =>
			CARD_COMPATIBLE_VISUALIZATIONS.has(t.defaultVisualization || "")
		);

		return {
			metricTypes: compatible.filter((t) =>
				isMetricType(t.defaultVisualization)
			),
			trendTypes: compatible.filter((t) => isTrendType(t.defaultVisualization)),
		};
	}, [queryTypes]);

	// Create a temporary widget config for preview data fetching
	const previewWidgets = selectedQueryType
		? [
				{
					id: "preview",
					queryType: selectedQueryType.key,
					type: "card" as const,
					field: selectedField?.name || "",
					label: selectedField?.label || "",
					displayMode,
				},
			]
		: [];

	const {
		getValue,
		getChartData,
		isLoading: isPreviewLoading,
	} = useDashboardData(websiteId, dateRange, previewWidgets, {
		enabled: isOpen && !!selectedQueryType,
	});

	const resetForm = () => {
		setSelectedQueryType(null);
		setSelectedField(null);
		setDisplayMode("text");
		setCustomTitle("");
	};

	const handleOpenChange = (open: boolean) => {
		if (open) {
			resetForm();
		} else {
			onCloseAction();
		}
	};

	const handleQueryTypeSelect = (queryType: QueryTypeOption) => {
		setSelectedQueryType(queryType);
		setSelectedField(null);
		setDisplayMode(
			mapVisualizationToDisplayMode(queryType.defaultVisualization)
		);
		setIsQueryTypeOpen(false);
	};

	const handleFieldSelect = (field: QueryOutputField) => {
		setSelectedField(field);
		setIsFieldOpen(false);
	};

	const handleSubmit = () => {
		if (!(selectedQueryType && selectedField)) {
			return;
		}

		setIsSubmitting(true);

		const newCard: DashboardCardConfig = {
			id: `card-${Date.now()}`,
			type: "card",
			queryType: selectedQueryType.key,
			field: selectedField.name,
			label: selectedField.label || selectedField.name,
			displayMode,
			title: customTitle.trim() || undefined,
			category: selectedQueryType.category,
		};

		onAddAction(newCard);
		setIsSubmitting(false);
		onCloseAction();
	};

	const previewTitle =
		customTitle || selectedField?.label || selectedField?.name || "Value";
	const previewIcon = selectedQueryType
		? getCategoryIcon(selectedQueryType.category)
		: undefined;
	const previewValue =
		selectedQueryType && selectedField
			? getValue(selectedQueryType.key, selectedField.name)
			: "—";
	const previewChartData =
		displayMode === "chart" && selectedQueryType && selectedField
			? getChartData(selectedQueryType.key, selectedField.name)
			: undefined;

	// Check if chart mode is supported for selected query type
	const supportsChart =
		selectedQueryType && isTrendType(selectedQueryType.defaultVisualization);

	return (
		<Sheet onOpenChange={handleOpenChange} open={isOpen}>
			<SheetContent className="sm:max-w-md" side="right">
				<SheetHeader>
					<div className="flex items-center gap-4">
						<div className="flex size-11 items-center justify-center rounded border bg-secondary">
							<SquaresFourIcon
								className="size-5 text-primary"
								weight="duotone"
							/>
						</div>
						<div>
							<SheetTitle className="text-lg">Add Card</SheetTitle>
							<SheetDescription>
								Create a new stat card from your analytics data
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<SheetBody className="space-y-6">
					{/* Live Preview */}
					<div className="space-y-2">
						<Label className="text-muted-foreground">Preview</Label>
						<StatCard
							chartData={previewChartData}
							chartType="area"
							description={selectedQueryType?.title}
							displayMode={displayMode}
							icon={previewIcon}
							id="preview"
							isLoading={!selectedQueryType || isPreviewLoading}
							title={previewTitle}
							value={previewValue}
						/>
					</div>

					{/* Separator */}
					<div className="h-px bg-border" />

					{/* Query Type Selector */}
					<div className="space-y-2">
						<Label>
							Data Source <span className="text-destructive">*</span>
						</Label>
						{isLoadingTypes ? (
							<Skeleton className="h-10 w-full" />
						) : (
							<Popover onOpenChange={setIsQueryTypeOpen} open={isQueryTypeOpen}>
								<PopoverTrigger asChild>
									<Button
										className="w-full justify-between"
										role="combobox"
										variant="outline"
									>
										{selectedQueryType ? (
											<div className="flex items-center gap-2 truncate">
												{(() => {
													const Icon = getCategoryIcon(
														selectedQueryType.category
													);
													return (
														<Icon
															className="size-4 shrink-0 text-muted-foreground"
															weight="duotone"
														/>
													);
												})()}
												<span className="truncate">
													{selectedQueryType.title}
												</span>
											</div>
										) : (
											<span className="text-muted-foreground">
												Select a data source…
											</span>
										)}
										<CaretDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent
									align="start"
									className="w-80 p-0"
									onOpenAutoFocus={(e) => e.preventDefault()}
									onPointerDownOutside={(e) => e.preventDefault()}
								>
									<Command shouldFilter>
										<CommandInput placeholder="Search data sources…" />
										<CommandList
											className="max-h-72"
											onWheel={(e) => e.stopPropagation()}
										>
											<CommandEmpty>No data source found.</CommandEmpty>

											{/* Metrics Section */}
											{metricTypes.length > 0 && (
												<CommandGroup
													heading={
														<div className="flex items-center gap-1.5">
															<GaugeIcon
																className="size-3.5 text-muted-foreground"
																weight="duotone"
															/>
															Metrics
															<span className="ml-auto text-[10px] text-muted-foreground/60">
																single values
															</span>
														</div>
													}
												>
													{metricTypes.map((type) => {
														const Icon = getCategoryIcon(type.category);
														return (
															<CommandItem
																key={type.key}
																onSelect={() => handleQueryTypeSelect(type)}
																value={`${type.title} ${type.category}`}
															>
																<CheckIcon
																	className={cn(
																		"mr-2 size-4 shrink-0",
																		selectedQueryType?.key === type.key
																			? "opacity-100"
																			: "opacity-0"
																	)}
																/>
																<Icon
																	className="mr-2 size-4 shrink-0 text-muted-foreground"
																	weight="duotone"
																/>
																<div className="min-w-0 flex-1">
																	<p className="truncate font-medium text-sm">
																		{type.title}
																	</p>
																	<p className="truncate text-muted-foreground text-xs">
																		{type.description}
																	</p>
																</div>
															</CommandItem>
														);
													})}
												</CommandGroup>
											)}

											{/* Trends Section */}
											{trendTypes.length > 0 && (
												<CommandGroup
													heading={
														<div className="flex items-center gap-1.5">
															<ChartLineUpIcon
																className="size-3.5 text-muted-foreground"
																weight="duotone"
															/>
															Trends
															<span className="ml-auto text-[10px] text-muted-foreground/60">
																over time
															</span>
														</div>
													}
												>
													{trendTypes.map((type) => {
														const Icon = getCategoryIcon(type.category);
														return (
															<CommandItem
																key={type.key}
																onSelect={() => handleQueryTypeSelect(type)}
																value={`${type.title} ${type.category}`}
															>
																<CheckIcon
																	className={cn(
																		"mr-2 size-4 shrink-0",
																		selectedQueryType?.key === type.key
																			? "opacity-100"
																			: "opacity-0"
																	)}
																/>
																<Icon
																	className="mr-2 size-4 shrink-0 text-muted-foreground"
																	weight="duotone"
																/>
																<div className="min-w-0 flex-1">
																	<p className="truncate font-medium text-sm">
																		{type.title}
																	</p>
																	<p className="truncate text-muted-foreground text-xs">
																		{type.description}
																	</p>
																</div>
															</CommandItem>
														);
													})}
												</CommandGroup>
											)}
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						)}
					</div>

					{/* Field Selector */}
					{selectedQueryType && (
						<div className="space-y-2">
							<Label>
								Field to Display <span className="text-destructive">*</span>
							</Label>
							<Popover onOpenChange={setIsFieldOpen} open={isFieldOpen}>
								<PopoverTrigger asChild>
									<Button
										className="w-full justify-between"
										role="combobox"
										variant="outline"
									>
										{selectedField ? (
											<span className="truncate">
												{selectedField.label || selectedField.name}
											</span>
										) : (
											<span className="text-muted-foreground">
												Select a field…
											</span>
										)}
										<CaretDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent
									align="start"
									className="w-80 p-0"
									onOpenAutoFocus={(e) => e.preventDefault()}
									onPointerDownOutside={(e) => e.preventDefault()}
								>
									<Command shouldFilter>
										<CommandInput placeholder="Search fields…" />
										<CommandList className="max-h-72">
											<CommandEmpty>No field found.</CommandEmpty>
											<CommandGroup>
												{selectedQueryType.outputFields.map((field) => (
													<CommandItem
														key={field.name}
														onSelect={() => handleFieldSelect(field)}
														value={field.label || field.name}
													>
														<CheckIcon
															className={cn(
																"mr-2 size-4",
																selectedField?.name === field.name
																	? "opacity-100"
																	: "opacity-0"
															)}
														/>
														<div className="min-w-0 flex-1">
															<p className="truncate font-medium text-sm">
																{field.label || field.name}
																{field.unit && (
																	<span className="ml-1 text-muted-foreground">
																		({field.unit})
																	</span>
																)}
															</p>
															{field.description && (
																<p className="truncate text-muted-foreground text-xs">
																	{field.description}
																</p>
															)}
														</div>
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>
					)}

					{/* Display Mode - only show if trends data supports chart */}
					{selectedField && supportsChart && (
						<div className="space-y-2">
							<Label>Display Mode</Label>
							<div className="flex gap-2">
								{(
									[
										{ value: "text", label: "Text", icon: TextTIcon },
										{ value: "chart", label: "Chart", icon: ChartBarIcon },
									] as const
								).map((mode) => {
									const isSelected = displayMode === mode.value;
									const Icon = mode.icon;
									return (
										<button
											className={cn(
												"flex flex-1 cursor-pointer items-center justify-center gap-2 rounded border py-2.5 transition-all",
												isSelected
													? "border-primary bg-primary/5 text-foreground"
													: "border-transparent bg-secondary text-muted-foreground hover:border-border hover:text-foreground"
											)}
											key={mode.value}
											onClick={() => setDisplayMode(mode.value)}
											type="button"
										>
											<Icon
												className={cn(
													"size-4",
													isSelected ? "text-primary" : "text-muted-foreground"
												)}
												weight="duotone"
											/>
											<span className="font-medium text-sm">{mode.label}</span>
										</button>
									);
								})}
							</div>
						</div>
					)}

					{/* Custom Title */}
					{selectedField && (
						<div className="space-y-2">
							<Label className="text-muted-foreground" htmlFor="customTitle">
								Custom Title (optional)
							</Label>
							<Input
								id="customTitle"
								onChange={(e) => setCustomTitle(e.target.value)}
								placeholder={selectedField.label || selectedField.name}
								value={customTitle}
							/>
						</div>
					)}
				</SheetBody>

				<SheetFooter>
					<Button onClick={onCloseAction} type="button" variant="ghost">
						Cancel
					</Button>
					<Button
						className="min-w-24"
						disabled={isSubmitting || !selectedQueryType || !selectedField}
						onClick={handleSubmit}
						type="button"
					>
						{isSubmitting ? (
							<>
								<SpinnerGapIcon className="animate-spin" size={16} />
								Adding…
							</>
						) : (
							"Add Card"
						)}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
