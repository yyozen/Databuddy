'use server';

import { chQuery } from '@databuddy/db';
import type { QueryPerformanceMetrics, QueryPerformanceSummary, QueryPerformanceFilters } from '@/types/query-performance';

/**
 * Get query performance summary statistics
 */
export async function getQueryPerformanceSummary(timeRangeHours: number = 24, durationThresholdMs: number = 1000) {
  try {
    const query = `
      SELECT 
        count() as total_queries,
        countIf(query_duration_ms >= ${durationThresholdMs}) as slow_queries_count,
        avg(query_duration_ms) as avg_duration_ms,
        avg(memory_usage / 1024 / 1024) as avg_memory_mb,
        sum(read_rows) as total_rows_read,
        sum(read_bytes) as total_bytes_read,
        0 as cache_hit_ratio
      FROM system.query_log 
      WHERE event_time >= now() - INTERVAL ${timeRangeHours} HOUR
        AND type = 'QueryFinish'
        AND query NOT LIKE '%system.query_log%'
    `;

    const results = await chQuery<{
      total_queries: number;
      slow_queries_count: number;
      avg_duration_ms: number;
      avg_memory_mb: number;
      total_rows_read: number;
      total_bytes_read: number;
      cache_hit_ratio: number;
    }>(query);

    const summary: QueryPerformanceSummary = results[0] || {
      total_queries: 0,
      slow_queries_count: 0,
      avg_duration_ms: 0,
      avg_memory_mb: 0,
      total_rows_read: 0,
      total_bytes_read: 0,
      cache_hit_ratio: 0,
    };

    return { summary, error: null };
  } catch (error) {
    console.error('Error fetching query performance summary:', error);
    return {
      summary: null,
      error: `Failed to fetch query performance summary. ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get detailed query performance metrics for slow queries
 */
export async function getSlowQueries(filters: QueryPerformanceFilters = {}) {
  const {
    duration_threshold_ms = 1000,
    time_range_hours = 24,
    query_type = '',
    database = '',
  } = filters;

  try {
    let whereClause = `
      WHERE event_time >= now() - INTERVAL ${time_range_hours} HOUR
        AND type = 'QueryFinish'
        AND query_duration_ms >= ${duration_threshold_ms}
        AND query NOT LIKE '%system.query_log%'
    `;

    if (query_type) {
      whereClause += ` AND query_kind = '${query_type}'`;
    }

    if (database) {
      whereClause += ` AND has(databases, '${database}')`;
    }

    const query = `
      SELECT 
        query_id,
        query,
        query_duration_ms,
        read_rows,
        read_bytes,
        result_rows,
        memory_usage,
        memory_usage as peak_memory_usage,
        event_time,
        toUnixTimestamp(event_time) * 1000000 as query_start_time_microseconds,
        type,
        tables,
        databases,
        exception,
        user,
        toString(sipHash64(query)) as normalized_query_hash,
        'Unknown' as query_kind,
        0 as written_rows,
        0 as written_bytes,
        0 as http_method,
        '' as http_user_agent,
        0 as filesystem_cache_read_bytes,
        0 as filesystem_cache_write_bytes
      FROM system.query_log 
      ${whereClause}
      ORDER BY query_duration_ms DESC
      LIMIT 100
    `;

    const results = await chQuery<QueryPerformanceMetrics>(query);

    return { queries: results, error: null };
  } catch (error) {
    console.error('Error fetching slow queries:', error);
    return {
      queries: [],
      error: `Failed to fetch slow queries. ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get query performance breakdown by database
 */
export async function getQueryPerformanceByDatabase(timeRangeHours: number = 24) {
  try {
    const query = `
      SELECT 
        arrayJoin(databases) as database,
        count() as query_count,
        avg(query_duration_ms) as avg_duration_ms,
        max(query_duration_ms) as max_duration_ms,
        sum(read_rows) as total_rows_read,
        sum(read_bytes) as total_bytes_read,
        avg(memory_usage / 1024 / 1024) as avg_memory_mb
      FROM system.query_log 
      WHERE event_time >= now() - INTERVAL ${timeRangeHours} HOUR
        AND type = 'QueryFinish'
        AND query NOT LIKE '%system.query_log%'
        AND length(databases) > 0
      GROUP BY database
      ORDER BY avg_duration_ms DESC
      LIMIT 20
    `;

    const results = await chQuery<{
      database: string;
      query_count: number;
      avg_duration_ms: number;
      max_duration_ms: number;
      total_rows_read: number;
      total_bytes_read: number;
      avg_memory_mb: number;
    }>(query);

    return { databases: results, error: null };
  } catch (error) {
    console.error('Error fetching query performance by database:', error);
    return {
      databases: [],
      error: `Failed to fetch database performance. ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get most frequent slow queries (grouped by normalized query hash)
 */
export async function getMostFrequentSlowQueries(timeRangeHours: number = 24, durationThresholdMs: number = 1000) {
  try {
    const query = `
      SELECT 
        toString(sipHash64(query)) as normalized_query_hash,
        any(query) as sample_query,
        count() as frequency,
        avg(query_duration_ms) as avg_duration_ms,
        max(query_duration_ms) as max_duration_ms,
        avg(read_rows) as avg_rows_read,
        avg(memory_usage / 1024 / 1024) as avg_memory_mb,
        any(databases) as databases,
        any(tables) as tables
      FROM system.query_log 
      WHERE event_time >= now() - INTERVAL ${timeRangeHours} HOUR
        AND type = 'QueryFinish'
        AND query_duration_ms >= ${durationThresholdMs}
        AND query NOT LIKE '%system.query_log%'
      GROUP BY toString(sipHash64(query))
      ORDER BY frequency DESC, avg_duration_ms DESC
      LIMIT 20
    `;

    const results = await chQuery<{
      normalized_query_hash: string;
      sample_query: string;
      frequency: number;
      avg_duration_ms: number;
      max_duration_ms: number;
      avg_rows_read: number;
      avg_memory_mb: number;
      databases: string[];
      tables: string[];
    }>(query);

    return { frequentQueries: results, error: null };
  } catch (error) {
    console.error('Error fetching frequent slow queries:', error);
    return {
      frequentQueries: [],
      error: `Failed to fetch frequent slow queries. ${error instanceof Error ? error.message : String(error)}`,
    };
  }
} 