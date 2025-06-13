"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    CreditCard,
    RefreshCw,
    AlertCircle,
    Globe,
    Banknote,
    Receipt
} from "lucide-react";
import { useRevenueAnalytics } from "../../hooks/use-revenue-analytics";
import { useAtom } from 'jotai';
import { formattedDateRangeAtom } from '@/stores/jotai/filterAtoms';
import { cn } from "@/lib/utils";
import { useMemo } from 'react';

interface MetricCardProps {
    title: string;
    value: string;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
    description?: string;
}

function MetricCard({ title, value, change, changeType, icon, description }: MetricCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {change && (
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        {changeType === 'positive' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {changeType === 'negative' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        <span className={cn(
                            changeType === 'positive' && 'text-green-500',
                            changeType === 'negative' && 'text-red-500'
                        )}>
                            {change}
                        </span>
                        <span>from last period</span>
                    </div>
                )}
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}

interface DataTableProps {
    title: string;
    description?: string;
    data: any[];
    columns: { key: string; label: string; format?: (value: any) => string }[];
    emptyMessage?: string;
}

function DataTable({ title, description, data, columns, emptyMessage = "No data available" }: DataTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {emptyMessage}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {data.slice(0, 10).map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                <div className="flex-1">
                                    <div className="font-medium">{item[columns[0].key]}</div>
                                    {columns.length > 2 && (
                                        <div className="text-sm text-muted-foreground">
                                            {columns[1].format ? columns[1].format(item[columns[1].key]) : item[columns[1].key]}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="font-medium">
                                        {columns[columns.length - 1].format
                                            ? columns[columns.length - 1].format?.(item[columns[columns.length - 1].key])
                                            : item[columns[columns.length - 1].key]
                                        }
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-20 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <div key={j} className="flex justify-between">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function RevenueAnalyticsTab() {
    const [formattedDateRange] = useAtom(formattedDateRangeAtom);

    // Convert the formatted date range to the expected format
    const dateRange = useMemo(() => ({
        start_date: formattedDateRange.startDate,
        end_date: formattedDateRange.endDate,
        granularity: 'daily' as const,
        timezone: 'UTC'
    }), [formattedDateRange]);

    const {
        formattedData,
        summaryStats,
        isLoading,
        isError,
        error,
        hasAnyData,
        isEmpty
    } = useRevenueAnalytics(dateRange);

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (isError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Failed to load revenue analytics: {error?.message || 'Unknown error'}
                </AlertDescription>
            </Alert>
        );
    }

    if (isEmpty) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Analytics</CardTitle>
                    <CardDescription>
                        Detailed revenue insights and trends
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No revenue data yet</h3>
                        <p className="text-muted-foreground">
                            Revenue analytics will appear here once you start receiving payments
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const summary = formattedData?.summary;
    const stats = formattedData?.summaryStats;

    return (
        <div className="space-y-6">
            {/* Summary Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Revenue"
                    value={summary?.total_revenue_formatted || '$0.00'}
                    change={stats?.revenueGrowth_formatted}
                    changeType={summaryStats?.revenueGrowth && summaryStats.revenueGrowth >= 0 ? 'positive' : 'negative'}
                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                />
                <MetricCard
                    title="Total Transactions"
                    value={summary?.total_transactions?.toLocaleString() || '0'}
                    change={stats?.transactionGrowth_formatted}
                    changeType={summaryStats?.transactionGrowth && summaryStats.transactionGrowth >= 0 ? 'positive' : 'negative'}
                    icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
                />
                <MetricCard
                    title="Average Order Value"
                    value={summary?.avg_order_value_formatted || '$0.00'}
                    icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
                />
                <MetricCard
                    title="Success Rate"
                    value={summary?.success_rate_formatted || '0%'}
                    description={`${summary?.total_refunds || 0} refunds (${stats?.refundRate_formatted || '0%'})`}
                    icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                />
            </div>

            {/* Data Tables */}
            <div className="grid gap-4 md:grid-cols-2">
                <DataTable
                    title="Revenue by Country"
                    description="Top performing countries by revenue"
                    data={formattedData?.byCountry || []}
                    columns={[
                        { key: 'name', label: 'Country' },
                        { key: 'total_transactions', label: 'Transactions' },
                        { key: 'total_revenue_formatted', label: 'Revenue' }
                    ]}
                    emptyMessage="No country data available"
                />

                <DataTable
                    title="Revenue by Currency"
                    description="Revenue breakdown by currency"
                    data={formattedData?.byCurrency || []}
                    columns={[
                        { key: 'name', label: 'Currency' },
                        { key: 'total_transactions', label: 'Transactions' },
                        { key: 'total_revenue_formatted', label: 'Revenue' }
                    ]}
                    emptyMessage="No currency data available"
                />

                <DataTable
                    title="Revenue by Card Brand"
                    description="Payment method performance"
                    data={formattedData?.byCardBrand || []}
                    columns={[
                        { key: 'name', label: 'Card Brand' },
                        { key: 'total_transactions', label: 'Transactions' },
                        { key: 'total_revenue_formatted', label: 'Revenue' }
                    ]}
                    emptyMessage="No card brand data available"
                />

                <DataTable
                    title="Recent Transactions"
                    description="Latest successful payments"
                    data={formattedData?.recentTransactions || []}
                    columns={[
                        { key: 'id', label: 'Transaction ID' },
                        { key: 'created_formatted', label: 'Date' },
                        { key: 'amount_formatted', label: 'Amount' }
                    ]}
                    emptyMessage="No recent transactions"
                />
            </div>

            {/* Recent Refunds */}
            {formattedData?.recentRefunds && formattedData.recentRefunds.length > 0 && (
                <DataTable
                    title="Recent Refunds"
                    description="Latest refund activity"
                    data={formattedData.recentRefunds}
                    columns={[
                        { key: 'id', label: 'Refund ID' },
                        { key: 'reason', label: 'Reason' },
                        { key: 'created_formatted', label: 'Date' },
                        { key: 'amount_formatted', label: 'Amount' }
                    ]}
                    emptyMessage="No recent refunds"
                />
            )}
        </div>
    );
} 