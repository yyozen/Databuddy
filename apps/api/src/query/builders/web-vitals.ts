import type { ParameterBuilder } from '../types'
import { escapeSqlString } from '../utils'

export const webVitalsBuilders: Record<string, ParameterBuilder> = {
  web_vitals_overview: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      'overview' as name,
      COUNT(*) as total_measurements,
      uniq(anonymous_id) as unique_users,
      uniq(session_id) as unique_sessions,
      avgIf(fcp, fcp > 0) as avg_fcp,
      avgIf(lcp, lcp > 0) as avg_lcp,
      avgIf(cls, cls >= 0) as avg_cls,
      avgIf(fid, fid > 0) as avg_fid,
      avgIf(inp, inp > 0) as avg_inp,
      quantileIf(0.75)(fcp, fcp > 0) as p75_fcp,
      quantileIf(0.75)(lcp, lcp > 0) as p75_lcp,
      quantileIf(0.75)(cls, cls >= 0) as p75_cls,
      quantileIf(0.75)(fid, fid > 0) as p75_fid,
      quantileIf(0.75)(inp, inp > 0) as p75_inp
    FROM analytics.web_vitals
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
    LIMIT ${limit} OFFSET ${offset}
  `,

  web_vitals_by_page: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      path as name,
      COUNT(*) as total_measurements,
      uniq(anonymous_id) as unique_users,
      avgIf(fcp, fcp > 0) as avg_fcp,
      avgIf(lcp, lcp > 0) as avg_lcp,
      avgIf(cls, cls >= 0) as avg_cls,
      avgIf(fid, fid > 0) as avg_fid,
      avgIf(inp, inp > 0) as avg_inp
    FROM analytics.web_vitals
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND path != ''
    GROUP BY path
    ORDER BY total_measurements DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  web_vitals_by_device: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      device_type as name,
      COUNT(*) as total_measurements,
      uniq(anonymous_id) as unique_users,
      avgIf(fcp, fcp > 0) as avg_fcp,
      avgIf(lcp, lcp > 0) as avg_lcp,
      avgIf(cls, cls >= 0) as avg_cls,
      avgIf(fid, fid > 0) as avg_fid,
      avgIf(inp, inp > 0) as avg_inp
    FROM analytics.web_vitals
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND device_type != ''
    GROUP BY device_type
    ORDER BY total_measurements DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  web_vitals_trends: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      toDate(timestamp) as date,
      COUNT(*) as total_measurements,
      uniq(anonymous_id) as unique_users,
      avgIf(fcp, fcp > 0) as avg_fcp,
      avgIf(lcp, lcp > 0) as avg_lcp,
      avgIf(cls, cls >= 0) as avg_cls,
      avgIf(fid, fid > 0) as avg_fid,
      avgIf(inp, inp > 0) as avg_inp
    FROM analytics.web_vitals
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
    GROUP BY toDate(timestamp)
    ORDER BY date DESC
    LIMIT ${limit} OFFSET ${offset}
  `,
} 