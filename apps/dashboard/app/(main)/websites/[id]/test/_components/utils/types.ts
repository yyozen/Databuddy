import type { StatCardDisplayMode } from "@/components/analytics/stat-card";

/** Base config all dashboard widgets share */
export interface DashboardWidgetBase {
	id: string;
	queryType: string;
	category?: string;
	title?: string;
}

/** Card widget - displays a single value with optional chart */
export interface DashboardCardConfig extends DashboardWidgetBase {
	type: "card";
	field: string;
	label: string;
	displayMode: StatCardDisplayMode;
}

/** Table widget - displays multiple rows with multiple columns */
export interface DashboardTableConfig extends DashboardWidgetBase {
	type: "table";
	fields: string[];
	labels?: Record<string, string>;
	limit?: number;
}

/** Chart widget - displays time series with multiple series */
export interface DashboardChartConfig extends DashboardWidgetBase {
	type: "chart";
	fields: string[];
	labels?: Record<string, string>;
	chartType: "area" | "bar" | "line";
}

/** Union of all widget types */
export type DashboardWidgetConfig =
	| DashboardCardConfig
	| DashboardTableConfig
	| DashboardChartConfig;

/** Query data types */
export type QueryCell = string | number | boolean | null;
export type QueryRow = Record<string, QueryCell>;
export type QueryDataMap = Record<string, QueryRow[]>;
