"use client";

import { useState, useMemo } from "react";
import { useFunnelAnalyticsByReferrer } from "@/hooks/use-funnels";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReferrerSourceCell } from "@/components/atomic/ReferrerSourceCell";
import { TrendDownIcon, ChartBarIcon, UsersIcon } from "@phosphor-icons/react";

interface Props {
    websiteId: string;
    funnelId: string;
    dateRange: { start_date: string; end_date: string };
    onReferrerChange?: (referrer: string) => void;
}



export default function FunnelAnalyticsByReferrer({
    websiteId,
    funnelId,
    dateRange,
    onReferrerChange
}: Props) {
    const [selectedReferrer, setSelectedReferrer] = useState("all");

    const handleChange = (referrer: string) => {
        setSelectedReferrer(referrer);
        onReferrerChange?.(referrer);
    };

    const { data, isLoading, error } = useFunnelAnalyticsByReferrer(websiteId, funnelId, dateRange);

    const referrers = useMemo(() => {
        if (!data?.data?.referrer_analytics) return [];
        return data.data.referrer_analytics
            .map(r => ({
                value: r.referrer,
                label: r.referrer_parsed?.name || r.referrer || 'Direct',
                parsed: r.referrer_parsed,
                users: r.total_users
            }))
            .sort((a, b) => b.users - a.users);
    }, [data]);



    if (isLoading) {
        return (
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-48" />
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                        <TrendDownIcon size={16} weight="duotone" className="h-5 w-5 text-red-600" />
                        <p className="text-red-600 font-medium">Error loading referrer data</p>
                    </div>
                    <p className="text-red-600/80 text-sm mt-2">{error.message}</p>
                </CardContent>
            </Card>
        );
    }

    if (!data?.data?.referrer_analytics?.length) {
        return (
            <Card className="border-dashed rounded">
                <CardContent className="pt-6">
                    <div className="text-center py-8">
                        <UsersIcon size={24} weight="duotone" className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">No referrer data available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }



    const totalUsers = data?.data?.referrer_analytics?.reduce((sum, r) => sum + r.total_users, 0) || 0;

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <ChartBarIcon size={16} weight="duotone" className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Traffic Source</span>
            </div>
            <Select value={selectedReferrer} onValueChange={handleChange}>
                <SelectTrigger className="w-64 rounded">
                    <SelectValue placeholder="Select traffic source" />
                </SelectTrigger>
                <SelectContent className="rounded">
                    <SelectItem value="all">
                        <div className="flex items-center gap-2">
                            <ChartBarIcon size={14} weight="duotone" className="h-3.5 w-3.5" />
                            <span>All Sources</span>
                            <Badge variant="outline" className="ml-auto text-xs">
                                {totalUsers} users
                            </Badge>
                        </div>
                    </SelectItem>
                    {referrers.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2 w-full">
                                <ReferrerSourceCell
                                    name={option.label}
                                    referrer={option.value}
                                    domain={option.parsed?.domain || ''}
                                    className="flex-shrink-0"
                                />
                                <Badge variant="outline" className="ml-auto text-xs">
                                    {option.users} users
                                </Badge>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
} 