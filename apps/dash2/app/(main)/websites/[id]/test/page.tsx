"use client";

import { useState, use } from "react";
import { 
  useAvailableParameters,
  useBatchDynamicQuery,
  useDynamicQuery,
  type DynamicQueryRequest
} from "@/hooks/use-dynamic-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsIcon, ZapIcon } from "lucide-react";
import { MinimalTable } from "./components/minimal-table";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { BrowserIcon } from "@/components/icon";

// Simple percentage badge component
const PercentageBadge = ({ percentage }: { percentage: number }) => (
  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
    {percentage.toFixed(1)}%
  </div>
);

type WebsitePlaceholder = {
  id: string;
  name: string;
  domain: string;
};

interface TestPageParams {
  id: string;
}

// Default date range for testing
const getDefaultDateRange = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  return {
    start_date: thirtyDaysAgo.toISOString().split("T")[0],
    end_date: today.toISOString().split("T")[0],
    granularity: 'daily' as 'hourly' | 'daily',
  };
};

// Generic column helper
const columnHelper = createColumnHelper<any>();

// Reusable column templates
const COLUMN_TEMPLATES = {
  name: (header = 'Name') => columnHelper.accessor('name', {
    header,
    cell: info => <span className="font-medium">{info.getValue()}</span>,
  }),
  browser: () => columnHelper.accessor('name', {
    header: 'Browser & Version',
    cell: info => {
      const fullName = info.getValue();
      if (typeof fullName === 'string' && fullName.includes(' ')) {
        const parts = fullName.split(' ');
        const browserName = parts[0];
        const version = parts.slice(1).join(' ');
        return (
          <div className="flex flex-col">
            <span className="font-medium">{browserName}</span>
            <span className="text-xs text-muted-foreground">v{version}</span>
          </div>
        );
      }
      return <span className="font-medium">{fullName}</span>;
    },
  }),
  visitors: () => columnHelper.accessor('visitors', {
    header: 'Visitors',
    cell: info => <span className="text-muted-foreground">{info.getValue()?.toLocaleString()}</span>,
  }),
  pageviews: () => columnHelper.accessor('pageviews', {
    header: 'Pageviews',
    cell: info => <span className="text-muted-foreground">{info.getValue()?.toLocaleString()}</span>,
  }),
  path: () => columnHelper.accessor('name', {
    header: 'Page Path',
    cell: info => <span className="font-medium font-mono text-xs">{info.getValue()}</span>,
  }),
  exits: () => columnHelper.accessor('exits', {
    header: 'Exits',
    cell: info => <span className="text-muted-foreground">{info.getValue()?.toLocaleString() || 'N/A'}</span>,
  }),
  sessions: () => columnHelper.accessor('sessions', {
    header: 'Sessions',
    cell: info => <span className="text-muted-foreground">{info.getValue()?.toLocaleString() || 'N/A'}</span>,
  }),
  loadTime: () => columnHelper.accessor('avg_load_time', {
    header: 'Avg Load Time (ms)',
    cell: info => <span className="text-muted-foreground">{info.getValue()?.toFixed(2) || 'N/A'}</span>,
  }),
};

// Tab configurations - easy to add new tabs
const TAB_CONFIGS = [
  {
    id: 'devices',
    label: 'Devices',
    queries: ['device_type', 'os_name'],
    columns: [COLUMN_TEMPLATES.name(), COLUMN_TEMPLATES.visitors(), COLUMN_TEMPLATES.pageviews()],
  },
  {
    id: 'browsers',
    label: 'Browsers',
    queries: ['browser_name'],
    columns: [COLUMN_TEMPLATES.browser(), COLUMN_TEMPLATES.visitors(), COLUMN_TEMPLATES.pageviews()],
  },
  {
    id: 'geography',
    label: 'Geography', 
    queries: ['country'],
    columns: [COLUMN_TEMPLATES.name('Location'), COLUMN_TEMPLATES.visitors(), COLUMN_TEMPLATES.pageviews()],
  },
  {
    id: 'utm',
    label: 'UTM Tracking',
    queries: ['utm_source', 'utm_medium', 'utm_campaign'],
    columns: [COLUMN_TEMPLATES.name(), COLUMN_TEMPLATES.visitors(), COLUMN_TEMPLATES.pageviews()],
  },
  {
    id: 'pages',
    label: 'Page Analytics',
    queries: ['top_pages', 'exit_page'],
    columns: [COLUMN_TEMPLATES.path(), COLUMN_TEMPLATES.pageviews(), COLUMN_TEMPLATES.visitors(), COLUMN_TEMPLATES.exits(), COLUMN_TEMPLATES.sessions()],
  },
  {
    id: 'performance',
    label: 'Performance',
    queries: ['slow_pages'],
    columns: [COLUMN_TEMPLATES.path(), COLUMN_TEMPLATES.loadTime(), COLUMN_TEMPLATES.pageviews()],
  },
  {
    id: 'traffic',
    label: 'Traffic Sources',
    queries: ['referrer'],
    columns: [COLUMN_TEMPLATES.name('Referrer'), COLUMN_TEMPLATES.visitors(), COLUMN_TEMPLATES.pageviews()],
  },
];

function AvailableParametersExample({ websiteId }: { websiteId: string }) {
  const { data: params, isLoading } = useAvailableParameters(websiteId);

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <SettingsIcon className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">Available Parameters</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                All queryable parameters in the system
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted/20 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <SettingsIcon className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">Available Parameters</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              All queryable parameters in the system
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {params && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Parameters</span>
              <Badge variant="outline">{params.parameters.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {params.parameters.slice(0, 15).map((param: string) => (
                <Badge key={param} variant="secondary" className="text-xs">
                  {param}
                </Badge>
              ))}
              {params.parameters.length > 15 && (
                <Badge variant="outline" className="text-xs">
                  +{params.parameters.length - 15} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BrowserAnalysis({ websiteId, dateRange }: { websiteId: string, dateRange: any }) {
  // Use the new grouped browser parameter directly from API
  const { data: groupedData, isLoading, errors } = useDynamicQuery(
    websiteId,
    dateRange,
    {
      id: 'browsers-grouped',
      parameters: ['browsers_grouped'],
      limit: 50,
    }
  );

  // Extract grouped browser data from API response
  const groupedBrowserData = useMemo(() => {
    const rawData = groupedData?.browsers_grouped || [];
    
    // Add market share calculation and format for UI
    const totalVisitors = rawData.reduce((sum: number, browser: any) => sum + (browser.visitors || 0), 0);
    
    return rawData.map((browser: any) => {
      const marketShare = totalVisitors > 0 
        ? Math.round((browser.visitors / totalVisitors) * 100)
        : 0;
      
      return {
        id: browser.name,
        browserName: browser.name,
        name: browser.name,
        version: `${browser.versions?.length || 0} versions`,
        visitors: browser.visitors || 0,
        pageviews: browser.pageviews || 0,
        sessions: browser.sessions || 0,
        marketShare: marketShare.toString(),
        versions: (browser.versions || []).map((v: any) => ({
          ...v,
          name: v.version || 'Unknown Version'
        }))
      };
    });
  }, [groupedData]);

  // Browser icon component
  const getBrowserIcon = (browserName: string, size: "sm" | "md" | "lg" = "md") => {
    return (
      <BrowserIcon 
        name={browserName}
        size={size}
        fallback={
          <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">
            {browserName.charAt(0).toUpperCase()}
          </div>
        }
      />
    );
  };



  const browserColumns: ColumnDef<any>[] = [
    columnHelper.accessor('browserName', {
      header: 'Browser',
      cell: info => (
        <div className="flex items-center gap-3">
          {getBrowserIcon(info.getValue() as string, "md")}
          <div>
            <div className="font-semibold text-foreground">{info.getValue() as string}</div>
            <div className="text-xs text-muted-foreground">
              {info.row.original.versions?.length || 0} versions detected
            </div>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('visitors', {
      header: 'Visitors',
      cell: info => (
        <div>
          <div className="font-medium">{info.getValue()?.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">unique users</div>
        </div>
      ),
    }),
    columnHelper.accessor('pageviews', {
      header: 'Pageviews',
      cell: info => (
        <div>
          <div className="font-medium">{info.getValue()?.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">total views</div>
        </div>
      ),
    }),
    columnHelper.accessor('marketShare', {
      header: 'Share',
      cell: info => {
        const percentage = Number.parseInt(info.getValue() as string, 10);
        return <PercentageBadge percentage={percentage} />;
      },
    }),
  ];

  return (
    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <ZapIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">Browser Version Analysis</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Expandable browser breakdown showing all versions per browser
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              Errors: {errors.map(e => e.error).join(', ')}
            </p>
          </div>
        )}
        
        <MinimalTable
          data={groupedBrowserData}
          columns={browserColumns}
          title="Browser Versions"
          description={`${groupedBrowserData.length} browsers with expandable version details`}
          isLoading={isLoading}
          initialPageSize={15}
          showSearch={true}
          emptyMessage="No browser data available"
          className="border-0 shadow-none bg-transparent"
          expandable={true}
          getSubRows={(row) => row.versions}
          renderSubRow={(subRow, parentRow, index) => {
            const percentage = Math.round(((subRow.visitors || 0) / (parentRow.visitors || 1)) * 100);
            const gradientConfig = percentage >= 40 ? {
              bg: 'linear-gradient(90deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%)',
              border: 'rgba(34, 197, 94, 0.2)'
            } : percentage >= 25 ? {
              bg: 'linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)',
              border: 'rgba(59, 130, 246, 0.2)'
            } : percentage >= 10 ? {
              bg: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%)',
              border: 'rgba(245, 158, 11, 0.2)'
            } : {
              bg: 'linear-gradient(90deg, rgba(107, 114, 128, 0.08) 0%, rgba(107, 114, 128, 0.04) 100%)',
              border: 'rgba(107, 114, 128, 0.15)'
            };
            
                          return (
                <div 
                  className="grid grid-cols-4 gap-3 py-1.5 px-4 text-sm border-l-2 transition-all duration-200"
                  style={{ 
                    background: gradientConfig.bg,
                    borderLeftColor: gradientConfig.border
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <span className="font-medium">{subRow.version || 'Unknown'}</span>
                  </div>
                  <div className="text-right font-medium">{subRow.visitors?.toLocaleString()}</div>
                  <div className="text-right font-medium">{subRow.pageviews?.toLocaleString()}</div>
                  <div className="text-right">
                    <PercentageBadge percentage={percentage} />
                  </div>
                </div>
              );
          }}
        />
      </CardContent>
    </Card>
  );
}

function AnalyticsTable({ websiteId, dateRange }: { websiteId: string, dateRange: any }) {
  // Generate batch queries from tab configs
  const batchQueries = TAB_CONFIGS.map(tab => ({
    id: tab.id,
    parameters: tab.queries,
    limit: 50,
  }));

  const { results, isLoading, meta } = useBatchDynamicQuery(websiteId, dateRange, batchQueries);

  // Convert results to tabs format
  const tabs = TAB_CONFIGS.map(config => {
    const result = results.find(r => r.queryId === config.id);
    return {
      id: config.id,
      label: config.label,
      data: result ? Object.values(result.data).flat() : [],
      columns: config.columns,
    };
  });

  return (
    <div className="space-y-4">
      {/* Batch Query Metrics */}
      {meta && (
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <ZapIcon className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base font-semibold">Batch Query Performance</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {TAB_CONFIGS.length} analytics categories in a single request
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-lg font-bold text-emerald-600">{meta.total_queries}</div>
                <div className="text-xs text-muted-foreground font-medium">Total Queries</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{meta.successful_queries}</div>
                <div className="text-xs text-muted-foreground font-medium">Successful</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-lg font-bold text-red-600">{meta.failed_queries}</div>
                <div className="text-xs text-muted-foreground font-medium">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Table */}
      <MinimalTable
        tabs={tabs}
        title="Analytics Dashboard"
        description="Comprehensive analytics data across all categories"
        isLoading={isLoading}
        initialPageSize={10}
        showSearch={true}
        emptyMessage="No analytics data available"
      />
    </div>
  );
}

export default function TestComponentsPage({ params: paramsPromise }: { params: Promise<TestPageParams> }) {
  const params = use(paramsPromise);
  const websiteId = params.id;
  const [dateRange] = useState(() => getDefaultDateRange());

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* Parameters Overview */}
      <AvailableParametersExample websiteId={websiteId} />
      
      {/* Browser Version Analysis */}
      <BrowserAnalysis websiteId={websiteId} dateRange={dateRange} />
      
      {/* Analytics Dashboard */}
      <AnalyticsTable websiteId={websiteId} dateRange={dateRange} />
    </div>
  );
}