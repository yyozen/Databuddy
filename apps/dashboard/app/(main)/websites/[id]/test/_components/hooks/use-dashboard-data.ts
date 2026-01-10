import type { DateRange } from "@databuddy/shared/types/analytics";
import { useMemo } from "react";
import { useDynamicQuery } from "@/hooks/use-dynamic-query";
import { formatWidgetValue, parseNumericValue } from "../utils/formatters";
import type {
	DashboardWidgetBase,
	QueryCell,
	QueryDataMap,
	QueryRow,
} from "../utils/types";

interface UseDashboardDataOptions {
	enabled?: boolean;
}

interface ChartDataPoint {
	date: string;
	value: number;
}

interface DashboardDataResult {
	/** Raw data map by query type */
	dataMap: QueryDataMap | undefined;
	/** Loading state */
	isLoading: boolean;
	/** Fetching state (for background refetches) */
	isFetching: boolean;
	/** Get formatted value for a single field from first row */
	getValue: (queryType: string, field: string) => string;
	/** Get raw value for a single field from first row */
	getRawValue: (queryType: string, field: string) => QueryCell | undefined;
	/** Get first row of data for a query type */
	getRow: (queryType: string) => QueryRow | undefined;
	/** Get all rows for a query type (useful for tables) */
	getRows: (queryType: string) => QueryRow[];
	/** Get chart-ready data points for a field */
	getChartData: (queryType: string, field: string) => ChartDataPoint[];
	/** Check if data exists for a query type */
	hasData: (queryType: string) => boolean;
}

/**
 * Hook for fetching and accessing dashboard widget data.
 * Handles collecting unique query types, fetching, and providing
 * convenient accessors for different widget types.
 */
export function useDashboardData<T extends DashboardWidgetBase>(
	websiteId: string,
	dateRange: DateRange,
	widgets: T[],
	options?: UseDashboardDataOptions
): DashboardDataResult {
	const queryParameters = useMemo(() => {
		const uniqueTypes = [...new Set(widgets.map((w) => w.queryType))];
		return uniqueTypes;
	}, [widgets]);

	const { data, isLoading, isFetching } = useDynamicQuery(
		websiteId,
		dateRange,
		{
			id: "dashboard-widgets",
			parameters: queryParameters,
		},
		{
			enabled: (options?.enabled ?? true) && queryParameters.length > 0,
		}
	);

	const dataMap = data as QueryDataMap | undefined;

	const getValue = useMemo(
		() => (queryType: string, field: string): string => {
			const rows = dataMap?.[queryType];
			if (!(rows && Array.isArray(rows)) || rows.length === 0) {
				return "—";
			}

			const firstRow = rows.at(0);
			if (!firstRow) {
				return "—";
			}

			return formatWidgetValue(firstRow[field], field);
		},
		[dataMap]
	);

	const getRawValue = useMemo(
		() =>
			(queryType: string, field: string): QueryCell | undefined => {
				const rows = dataMap?.[queryType];
				if (!(rows && Array.isArray(rows)) || rows.length === 0) {
					return undefined;
				}

				const firstRow = rows.at(0);
				return firstRow?.[field];
			},
		[dataMap]
	);

	const getRow = useMemo(
		() =>
			(queryType: string): QueryRow | undefined => {
				const rows = dataMap?.[queryType];
				if (!(rows && Array.isArray(rows)) || rows.length === 0) {
					return undefined;
				}
				return rows.at(0);
			},
		[dataMap]
	);

	const getRows = useMemo(
		() =>
			(queryType: string): QueryRow[] => {
				const rows = dataMap?.[queryType];
				if (!(rows && Array.isArray(rows))) {
					return [];
				}
				return rows;
			},
		[dataMap]
	);

	const getChartData = useMemo(
		() =>
			(queryType: string, field: string): ChartDataPoint[] => {
				const rows = dataMap?.[queryType];
				if (!(rows && Array.isArray(rows))) {
					return [];
				}

				return rows
					.map((row) => {
						const rawDate = row.date;
						const rawValue = row[field];
						return {
							date: rawDate ? String(rawDate) : "",
							value: parseNumericValue(rawValue),
						};
					})
					.filter((d) => d.date);
			},
		[dataMap]
	);

	const hasData = useMemo(
		() =>
			(queryType: string): boolean => {
				const rows = dataMap?.[queryType];
				return !!(rows && Array.isArray(rows) && rows.length > 0);
			},
		[dataMap]
	);

	return {
		dataMap,
		isLoading,
		isFetching,
		getValue,
		getRawValue,
		getRow,
		getRows,
		getChartData,
		hasData,
	};
}
