"use client";

import { ChartLineUpIcon } from "@phosphor-icons/react/dist/ssr/ChartLineUp";
import { CurrencyDollarIcon } from "@phosphor-icons/react/dist/ssr/CurrencyDollar";
import { ReceiptIcon } from "@phosphor-icons/react/dist/ssr/Receipt";
import { RepeatIcon } from "@phosphor-icons/react/dist/ssr/Repeat";
import { TrendUpIcon } from "@phosphor-icons/react/dist/ssr/TrendUp";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { StatCard } from "@/components/analytics/stat-card";
import { SimpleMetricsChart } from "@/components/charts/simple-metrics-chart";
import { EmptyState } from "@/components/empty-state";
import { useDateFilters } from "@/hooks/use-date-filters";
import { useBatchDynamicQuery } from "@/hooks/use-dynamic-query";
import { dynamicQueryFiltersAtom } from "@/stores/jotai/filterAtoms";

interface RevenueContentProps {
	websiteId: string;
}

interface RevenueOverview {
	total_revenue: number;
	total_transactions: number;
	refund_amount: number;
	refund_count: number;
	subscription_revenue: number;
	subscription_count: number;
	sale_revenue: number;
	sale_count: number;
}

interface RevenueTimeSeries {
	date: string;
	revenue: number;
	transactions: number;
}

function formatCurrency(amount: number, currency = "USD"): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

export function RevenueContent({ websiteId }: RevenueContentProps) {
	const router = useRouter();
	const { dateRange } = useDateFilters();
	const [filters] = useAtom(dynamicQueryFiltersAtom);

	const queries = [
		{
			id: "revenue-overview",
			parameters: ["revenue_overview"],
			filters,
		},
		{
			id: "revenue-time-series",
			parameters: ["revenue_time_series"],
			filters,
		},
	];

	const { isLoading, getDataForQuery } = useBatchDynamicQuery(
		websiteId,
		dateRange,
		queries
	);

	const overviewData = (getDataForQuery(
		"revenue-overview",
		"revenue_overview"
	) ?? []) as RevenueOverview[];

	const timeSeriesData = (getDataForQuery(
		"revenue-time-series",
		"revenue_time_series"
	) ?? []) as RevenueTimeSeries[];

	const overview = overviewData[0];
	const hasData = overview && overview.total_transactions > 0;

	const chartData = useMemo(() => {
		if (timeSeriesData.length === 0) {
			return [];
		}
		return timeSeriesData.map((row) => ({
			date: row.date,
			Revenue: row.revenue,
			Transactions: row.transactions,
		}));
	}, [timeSeriesData]);

	const chartMetrics = useMemo(
		() => [
			{
				key: "Revenue",
				label: "Revenue",
				color: "#10b981",
				formatValue: (v: number) => formatCurrency(v),
			},
		],
		[]
	);

	const netRevenue = overview
		? overview.total_revenue + overview.refund_amount
		: 0;

	if (isLoading === false && hasData === false) {
		return (
			<EmptyState
				action={{
					label: "Configure Webhooks",
					onClick: () => router.push(`/websites/${websiteId}/settings/general`),
				}}
				description="Connect Stripe or Paddle to start tracking revenue. Revenue data will appear here once transactions are processed through webhooks."
				icon={<CurrencyDollarIcon />}
				secondaryAction={{
					label: "View Documentation",
					onClick: () =>
						window.open("https://databuddy.cc/docs/revenue", "_blank"),
					variant: "outline",
				}}
				showPlusBadge={false}
				title="No revenue data yet"
			/>
		);
	}

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatCard
					chartData={chartData.map((d) => ({
						date: d.date,
						value: d.Revenue,
					}))}
					chartType="area"
					formatChartValue={formatCurrency}
					icon={CurrencyDollarIcon}
					id="net-revenue"
					isLoading={isLoading}
					showChart
					title="Net Revenue"
					value={formatCurrency(netRevenue)}
				/>
				<StatCard
					icon={TrendUpIcon}
					id="gross-revenue"
					isLoading={isLoading}
					title="Gross Revenue"
					value={formatCurrency(overview?.total_revenue ?? 0)}
				/>
				<StatCard
					description={`${overview?.subscription_count ?? 0} active`}
					icon={RepeatIcon}
					id="subscriptions"
					isLoading={isLoading}
					title="Subscriptions"
					value={formatCurrency(overview?.subscription_revenue ?? 0)}
				/>
				<StatCard
					description={`${overview?.refund_count ?? 0} refunds`}
					icon={ReceiptIcon}
					id="refunds"
					invertTrend
					isLoading={isLoading}
					title="Refunds"
					value={formatCurrency(Math.abs(overview?.refund_amount ?? 0))}
				/>
			</div>

			{chartData.length > 0 && (
				<SimpleMetricsChart
					data={chartData}
					description="Revenue over time"
					height={300}
					isLoading={isLoading}
					metrics={chartMetrics}
					title="Revenue Trend"
				/>
			)}

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
				<StatCard
					icon={ChartLineUpIcon}
					id="total-transactions"
					isLoading={isLoading}
					title="Total Transactions"
					value={overview?.total_transactions ?? 0}
				/>
				<StatCard
					description={`${overview?.sale_count ?? 0} sales`}
					icon={CurrencyDollarIcon}
					id="one-time-sales"
					isLoading={isLoading}
					title="One-time Sales"
					value={formatCurrency(overview?.sale_revenue ?? 0)}
				/>
				<StatCard
					icon={TrendUpIcon}
					id="avg-transaction"
					isLoading={isLoading}
					title="Avg Transaction"
					value={
						overview && overview.total_transactions > 0
							? formatCurrency(
									overview.total_revenue / overview.total_transactions
								)
							: "$0"
					}
				/>
			</div>
		</div>
	);
}
