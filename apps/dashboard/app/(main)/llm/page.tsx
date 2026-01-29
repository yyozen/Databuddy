"use client";

import { useEffect, useMemo } from "react";
import { useBatchDynamicQuery } from "@/hooks/use-dynamic-query";
import { LLMPrimaryKpis, LLMSecondaryKpis } from "./_components/llm-kpis";
import { useLLMPageContext } from "./_components/llm-page-context";
import { LLMTables } from "./_components/llm-tables";
import { LLMTimeSeriesChart } from "./_components/llm-time-series-chart";
import type {
	LLMKpiData,
	LLMModelData,
	LLMTimeSeriesData,
	LLMToolData,
} from "./_components/llm-types";

export default function LLMAnalyticsPage() {
	const {
		queryOptions,
		dateRange,
		hasQueryId,
		isLoadingOrg,
		registerRefresh,
		setIsFetching,
	} = useLLMPageContext();

	const queries = useMemo(
		() => [
			{
				id: "llm-kpis",
				parameters: ["llm_overview_kpis"],
				limit: 1,
				granularity: dateRange.granularity,
			},
			{
				id: "llm-time-series",
				parameters: ["llm_time_series"],
				limit: 365,
				granularity: dateRange.granularity,
			},
			{
				id: "llm-models",
				parameters: ["llm_model_breakdown"],
				limit: 20,
				granularity: dateRange.granularity,
			},
			{
				id: "llm-tools",
				parameters: ["llm_tool_name_breakdown"],
				limit: 20,
				granularity: dateRange.granularity,
			},
		],
		[dateRange.granularity]
	);

	const { isLoading, getDataForQuery, refetch, isFetching } =
		useBatchDynamicQuery(queryOptions, dateRange, queries, {
			enabled: hasQueryId,
		});

	useEffect(() => {
		return registerRefresh(refetch);
	}, [registerRefresh, refetch]);

	useEffect(() => {
		setIsFetching(isFetching);
	}, [isFetching, setIsFetching]);

	const kpis =
		(getDataForQuery("llm-kpis", "llm_overview_kpis") as LLMKpiData[])?.[0] ||
		null;
	const timeSeries =
		(getDataForQuery(
			"llm-time-series",
			"llm_time_series"
		) as LLMTimeSeriesData[]) || [];
	const models =
		(getDataForQuery("llm-models", "llm_model_breakdown") as LLMModelData[]) ||
		[];
	const tools =
		(getDataForQuery(
			"llm-tools",
			"llm_tool_name_breakdown"
		) as LLMToolData[]) || [];

	const chartData = useMemo(
		() => ({
			cost: timeSeries.map((d) => ({
				date: d.date,
				value: d.total_cost || 0,
			})),
			calls: timeSeries.map((d) => ({
				date: d.date,
				value: d.total_calls || 0,
			})),
			tokens: timeSeries.map((d) => ({
				date: d.date,
				value: d.total_tokens || 0,
			})),
			latency: timeSeries.map((d) => ({
				date: d.date,
				value: d.avg_duration_ms || 0,
			})),
		}),
		[timeSeries]
	);

	const isPageLoading = isLoadingOrg || isLoading;

	return (
		<div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
			{/* KPIs */}
			<section className="space-y-3 sm:space-y-4">
				<LLMPrimaryKpis
					chartData={chartData}
					isLoading={isPageLoading}
					kpis={kpis}
				/>
				<LLMSecondaryKpis isLoading={isPageLoading} kpis={kpis} />
			</section>

			{/* Time Series Chart */}
			<LLMTimeSeriesChart
				data={timeSeries}
				height={350}
				isLoading={isPageLoading}
			/>

			{/* Tools & Models Tables */}
			<LLMTables isLoading={isPageLoading} models={models} tools={tools} />
		</div>
	);
}
