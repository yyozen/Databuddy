import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, Database, TrendingUp, AlertTriangle, HardDrive } from "lucide-react";
import {
    getQueryPerformanceSummary,
    getSlowQueries,
    getQueryPerformanceByDatabase,
    getMostFrequentSlowQueries
} from "./actions";
import { format } from 'date-fns';
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import { formatNumber } from "@/components/website-event-metrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper function to format duration
const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
};

// Helper function to format bytes
const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Helper function to truncate SQL queries
const truncateQuery = (query: string, maxLength: number = 100) => {
    if (query.length <= maxLength) return query;
    return query.substring(0, maxLength) + '...';
};

// Helper function to get performance badge color
const getPerformanceBadge = (durationMs: number) => {
    if (durationMs < 1000) return { variant: "default" as const, label: "Fast" };
    if (durationMs < 5000) return { variant: "secondary" as const, label: "Medium" };
    if (durationMs < 30000) return { variant: "destructive" as const, label: "Slow" };
    return { variant: "destructive" as const, label: "Critical" };
};

export default async function QueryPerformancePage({
    searchParams,
}: {
    searchParams: Promise<{
        search?: string;
        threshold?: string;
        timeRange?: string;
    }>;
}) {
    const { search, threshold = "1000", timeRange = "24" } = await searchParams;

    const durationThreshold = parseInt(threshold);
    const timeRangeHours = parseInt(timeRange);

    // Fetch all performance data in parallel
    const [
        { summary, error: summaryError },
        { queries: slowQueries, error: slowQueriesError },
        { databases, error: databasesError },
        { frequentQueries, error: frequentQueriesError }
    ] = await Promise.all([
        getQueryPerformanceSummary(timeRangeHours, durationThreshold),
        getSlowQueries({
            duration_threshold_ms: durationThreshold,
            time_range_hours: timeRangeHours
        }),
        getQueryPerformanceByDatabase(timeRangeHours),
        getMostFrequentSlowQueries(timeRangeHours, durationThreshold)
    ]);

    // Filter slow queries based on search
    const filteredSlowQueries = slowQueries?.filter((query) => {
        if (!search) return true;
        return (
            query.query?.toLowerCase().includes(search.toLowerCase()) ||
            query.query_id?.toLowerCase().includes(search.toLowerCase()) ||
            query.user?.toLowerCase().includes(search.toLowerCase()) ||
            query.databases?.some(db => db.toLowerCase().includes(search.toLowerCase()))
        );
    });

    if (summaryError || slowQueriesError || databasesError || frequentQueriesError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Error Loading Query Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm text-destructive">
                        {summaryError && <p>Summary: {summaryError}</p>}
                        {slowQueriesError && <p>Slow Queries: {slowQueriesError}</p>}
                        {databasesError && <p>Database Performance: {databasesError}</p>}
                        {frequentQueriesError && <p>Frequent Queries: {frequentQueriesError}</p>}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Zap className="h-6 w-6" />
                        Query Performance
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Monitor and optimize ClickHouse query performance • Last {timeRangeHours}h • Threshold: {durationThreshold}ms
                    </p>
                </div>
                <DataTableToolbar
                    placeholder="Search queries, users, databases..."
                />
            </div>

            {/* Performance Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(summary.total_queries)}</div>
                            <p className="text-xs text-muted-foreground">
                                {summary.slow_queries_count} slow queries
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatDuration(summary.avg_duration_ms)}</div>
                            <p className="text-xs text-muted-foreground">
                                Average execution time
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Memory</CardTitle>
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.avg_memory_mb.toFixed(1)} MB</div>
                            <p className="text-xs text-muted-foreground">
                                Average memory usage
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Data Processed</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(summary.total_rows_read)}</div>
                            <p className="text-xs text-muted-foreground">
                                Total rows processed
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="slow-queries" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="slow-queries">Slow Queries</TabsTrigger>
                    <TabsTrigger value="frequent-queries">Frequent Slow Queries</TabsTrigger>
                    <TabsTrigger value="database-performance">Database Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="slow-queries" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Slow Queries</CardTitle>
                            <CardDescription>
                                Queries taking longer than {durationThreshold}ms in the last {timeRangeHours} hours
                                {search && ` matching "${search}"`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {(!filteredSlowQueries || filteredSlowQueries.length === 0) ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    {search
                                        ? `No slow queries found matching "${search}"`
                                        : "No slow queries found"}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Query</TableHead>
                                            <TableHead className="text-center">Duration</TableHead>
                                            <TableHead className="hidden md:table-cell text-center">Rows Read</TableHead>
                                            <TableHead className="hidden lg:table-cell text-center">Memory</TableHead>
                                            <TableHead className="hidden lg:table-cell">Database</TableHead>
                                            <TableHead className="hidden lg:table-cell">User</TableHead>
                                            <TableHead className="hidden xl:table-cell">Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSlowQueries.map((query) => {
                                            const perfBadge = getPerformanceBadge(query.query_duration_ms);
                                            return (
                                                <TableRow key={query.query_id}>
                                                    <TableCell className="max-w-[300px]">
                                                        <div className="space-y-1">
                                                            <code className="text-xs bg-muted px-2 py-1 rounded text-wrap break-all">
                                                                {truncateQuery(query.query, 150)}
                                                            </code>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Badge variant={perfBadge.variant} className="text-xs h-4">
                                                                    {perfBadge.label}
                                                                </Badge>
                                                                <span className="font-mono">{query.query_id.slice(-8)}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm">
                                                                {formatDuration(query.query_duration_ms)}
                                                            </span>
                                                            {query.exception && (
                                                                <Badge variant="destructive" className="text-xs mt-1">
                                                                    Error
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell text-center">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm">
                                                                {formatNumber(query.read_rows)}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatBytes(query.read_bytes)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell text-center">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm">
                                                                {(query.peak_memory_usage / 1024 / 1024).toFixed(1)} MB
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                peak
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <div className="flex flex-wrap gap-1">
                                                            {query.databases?.slice(0, 2).map((db, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-xs">
                                                                    {db}
                                                                </Badge>
                                                            ))}
                                                            {query.databases?.length > 2 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{query.databases.length - 2}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell text-sm">
                                                        {query.user || 'Unknown'}
                                                    </TableCell>
                                                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                                                        {format(new Date(query.event_time), 'MMM d, HH:mm:ss')}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="frequent-queries" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Most Frequent Slow Queries</CardTitle>
                            <CardDescription>
                                Queries that appear frequently in slow query logs (grouped by normalized hash)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {(!frequentQueries || frequentQueries.length === 0) ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No frequent slow queries found
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Query Pattern</TableHead>
                                            <TableHead className="text-center">Frequency</TableHead>
                                            <TableHead className="text-center">Avg Duration</TableHead>
                                            <TableHead className="text-center">Max Duration</TableHead>
                                            <TableHead className="hidden lg:table-cell">Databases</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {frequentQueries.map((query, idx) => {
                                            const perfBadge = getPerformanceBadge(query.avg_duration_ms);
                                            return (
                                                <TableRow key={idx}>
                                                    <TableCell className="max-w-[400px]">
                                                        <div className="space-y-2">
                                                            <code className="text-xs bg-muted px-2 py-1 rounded text-wrap break-all">
                                                                {truncateQuery(query.sample_query, 200)}
                                                            </code>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={perfBadge.variant} className="text-xs h-4">
                                                                    {perfBadge.label}
                                                                </Badge>
                                                                <span className="text-xs text-muted-foreground font-mono">
                                                                    {query.normalized_query_hash.slice(-12)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm">
                                                                {query.frequency}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                times
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="font-semibold text-sm">
                                                            {formatDuration(query.avg_duration_ms)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="font-semibold text-sm">
                                                            {formatDuration(query.max_duration_ms)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <div className="flex flex-wrap gap-1">
                                                            {query.databases?.slice(0, 2).map((db, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-xs">
                                                                    {db}
                                                                </Badge>
                                                            ))}
                                                            {query.databases?.length > 2 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{query.databases.length - 2}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="database-performance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Database Performance</CardTitle>
                            <CardDescription>
                                Performance breakdown by database in the last {timeRangeHours} hours
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {(!databases || databases.length === 0) ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No database performance data found
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Database</TableHead>
                                            <TableHead className="text-center">Queries</TableHead>
                                            <TableHead className="text-center">Avg Duration</TableHead>
                                            <TableHead className="text-center">Max Duration</TableHead>
                                            <TableHead className="hidden lg:table-cell text-center">Rows Read</TableHead>
                                            <TableHead className="hidden lg:table-cell text-center">Avg Memory</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {databases.map((db, idx) => {
                                            const perfBadge = getPerformanceBadge(db.avg_duration_ms);
                                            return (
                                                <TableRow key={idx}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Database className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">{db.database}</span>
                                                            <Badge variant={perfBadge.variant} className="text-xs h-4">
                                                                {perfBadge.label}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="font-semibold">
                                                            {formatNumber(db.query_count)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="font-semibold">
                                                            {formatDuration(db.avg_duration_ms)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="font-semibold">
                                                            {formatDuration(db.max_duration_ms)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell text-center">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm">
                                                                {formatNumber(db.total_rows_read)}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatBytes(db.total_bytes_read)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell text-center">
                                                        <span className="font-semibold">
                                                            {db.avg_memory_mb.toFixed(1)} MB
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 