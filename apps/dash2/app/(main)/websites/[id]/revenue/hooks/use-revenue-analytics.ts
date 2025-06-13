'use client';

import { useRevenueAnalytics as useRevenueAnalyticsBase } from '@/hooks/use-dynamic-query';
import type { DateRange } from '@/hooks/use-analytics';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';

/**
 * Hook for revenue analytics specific to the revenue page
 * Uses the base useRevenueAnalytics hook with website context
 */
export function useRevenueAnalytics(dateRange: DateRange) {
  const params = useParams();
  const websiteId = params.id as string;

  const result = useRevenueAnalyticsBase(websiteId, dateRange, {
    enabled: !!websiteId,
    staleTime: 2 * 60 * 1000, // 2 minutes for revenue data
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Format currency values for display
  const formattedData = useMemo(() => {
    if (!result.revenueData) return null;

    const formatCurrency = (amount: number, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const formatPercentage = (value: number) => {
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    return {
      ...result.revenueData,
      summary: {
        ...result.revenueData.summary,
        total_revenue_formatted: formatCurrency(result.revenueData.summary.total_revenue),
        avg_order_value_formatted: formatCurrency(result.revenueData.summary.avg_order_value),
        success_rate_formatted: `${result.revenueData.summary.success_rate.toFixed(1)}%`,
      },
      summaryStats: {
        ...result.summaryStats,
        revenueGrowth_formatted: formatPercentage(result.summaryStats.revenueGrowth),
        transactionGrowth_formatted: formatPercentage(result.summaryStats.transactionGrowth),
        refundRate_formatted: `${result.summaryStats.refundRate.toFixed(1)}%`,
      },
      trends: result.revenueData.trends.map(trend => ({
        ...trend,
        revenue_formatted: formatCurrency(trend.revenue),
        date: new Date(trend.time).toLocaleDateString(),
      })),
      recentTransactions: result.revenueData.recentTransactions.map(transaction => ({
        ...transaction,
        amount_formatted: formatCurrency(transaction.amount, transaction.currency),
        created_formatted: new Date(transaction.created).toLocaleString(),
      })),
      recentRefunds: result.revenueData.recentRefunds.map(refund => ({
        ...refund,
        amount_formatted: formatCurrency(refund.amount, refund.currency),
        created_formatted: new Date(refund.created).toLocaleString(),
      })),
      byCountry: result.revenueData.byCountry.map(country => ({
        ...country,
        total_revenue_formatted: formatCurrency(country.total_revenue),
        avg_order_value_formatted: formatCurrency(country.avg_order_value),
      })),
      byCurrency: result.revenueData.byCurrency.map(currency => ({
        ...currency,
        total_revenue_formatted: formatCurrency(currency.total_revenue),
        avg_order_value_formatted: formatCurrency(currency.avg_order_value),
      })),
      byCardBrand: result.revenueData.byCardBrand.map(brand => ({
        ...brand,
        total_revenue_formatted: formatCurrency(brand.total_revenue),
        avg_order_value_formatted: formatCurrency(brand.avg_order_value),
      })),
    };
  }, [result.revenueData, result.summaryStats]);

  return {
    ...result,
    formattedData,
    // Convenience flags
    hasAnyData: result.hasSummaryData || result.hasTrendsData || result.hasTransactionsData,
    isEmpty: !result.isLoading && !(result.hasSummaryData || result.hasTrendsData || result.hasTransactionsData),
  };
}

/**
 * Hook for revenue summary metrics only (lighter weight)
 */
export function useRevenueSummary(dateRange: DateRange) {
  const params = useParams();
  const websiteId = params.id as string;

  const result = useRevenueAnalyticsBase(websiteId, dateRange, {
    enabled: !!websiteId,
    staleTime: 1 * 60 * 1000, // 1 minute for summary
  });

  return {
    summary: result.revenueData?.summary,
    summaryStats: result.summaryStats,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    hasSummaryData: result.hasSummaryData,
  };
} 