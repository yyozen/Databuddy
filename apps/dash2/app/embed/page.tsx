"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebsiteOverviewTab } from "../(main)/websites/[id]/components/tabs/overview-tab";
import { WebsiteAudienceTab } from "../(main)/websites/[id]/components/tabs/audience-tab";
import { WebsiteContentTab } from "../(main)/websites/[id]/components/tabs/content-tab";
import { WebsitePerformanceTab } from "../(main)/websites/[id]/components/tabs/performance-tab";
import { WebsiteErrorsTab } from "../(main)/websites/[id]/components/tabs/errors-tab";
import { useQuery } from "@tanstack/react-query";
import { getWebsiteById } from "../actions/websites";
import { Skeleton } from "@/components/ui/skeleton";

// Hardcoded website ID for the embed
const WEBSITE_ID = "OXmNQsViBT-FOS_wZCTHc"; // <-- Replace with your real website ID

// Default date range: last 7 days, daily granularity
const DEFAULT_DATE_RANGE = {
  start_date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().slice(0, 10),
  end_date: new Date().toISOString().slice(0, 10),
  granularity: "daily" as const,
};

export default function EmbedDashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch website data
  const { data, isLoading, isError } = useQuery({
    queryKey: ["website", WEBSITE_ID],
    queryFn: async () => {
      const result = await getWebsiteById(WEBSITE_ID);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: 1,
    retryDelay: 3000,
  });

  const tabProps = useMemo(() => ({
    websiteId: WEBSITE_ID,
    dateRange: DEFAULT_DATE_RANGE,
    websiteData: data,
    isRefreshing,
    setIsRefreshing,
  }), [data, isRefreshing]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Skeleton className="h-screen w-full max-w-5xl mx-auto" /></div>;
  }
  if (!data || isError) {
    return <div className="p-6 text-center text-red-500">Failed to load dashboard.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-2">
      <div className="w-full max-w-5xl rounded-2xl shadow-xl p-4 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="overview" className="space-y-4">
          <TabsList className="h-10 rounded-lg p-1 w-full justify-start gap-1 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <WebsiteOverviewTab {...tabProps} />
          </TabsContent>
          <TabsContent value="audience">
            <WebsiteAudienceTab {...tabProps} />
          </TabsContent>
          <TabsContent value="content">
            <WebsiteContentTab {...tabProps} />
          </TabsContent>
          <TabsContent value="performance">
            <WebsitePerformanceTab {...tabProps} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 