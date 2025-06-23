export interface QueryPerformanceMetrics {
  query_id: string;
  query: string;
  query_duration_ms: number;
  read_rows: number;
  read_bytes: number;
  result_rows: number;
  memory_usage: number;
  event_time: string;
  query_start_time_microseconds: number;
  type: string;
  tables: string[];
  databases: string[];
  exception: string;
  user: string;
  normalized_query_hash: string;
  query_kind: string;
  peak_memory_usage: number;
  written_rows: number;
  written_bytes: number;
  http_method: number;
  http_user_agent: string;
  filesystem_cache_read_bytes: number;
  filesystem_cache_write_bytes: number;
}

export interface QueryPerformanceSummary {
  total_queries: number;
  slow_queries_count: number;
  avg_duration_ms: number;
  avg_memory_mb: number;
  total_rows_read: number;
  total_bytes_read: number;
  cache_hit_ratio: number;
}

export interface QueryPerformanceFilters {
  duration_threshold_ms?: number;
  time_range_hours?: number;
  query_type?: string;
  database?: string;
} 