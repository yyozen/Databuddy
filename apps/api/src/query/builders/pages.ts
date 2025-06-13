import type { ParameterBuilder } from '../types'
import { escapeSqlString } from '../utils'

export const pageBuilders: Record<string, ParameterBuilder> = {
  top_pages: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      path as name,
      uniq(anonymous_id) as visitors,
      COUNT(*) as pageviews,
      uniq(session_id) as sessions
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name = 'screen_view'
      AND path != ''
    GROUP BY path
    ORDER BY pageviews DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  exit_page: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH sessions AS (
      SELECT
        session_id,
        MAX(time) as session_end_time
      FROM analytics.events
      WHERE 
        client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
        AND path != ''
      GROUP BY session_id
    ),
    exit_pages AS (
      SELECT
        e.path,
        COUNT(DISTINCT e.session_id) as exits,
        COUNT(DISTINCT e.anonymous_id) as visitors
      FROM analytics.events e
      INNER JOIN sessions s ON e.session_id = s.session_id AND e.time = s.session_end_time
      WHERE 
        e.client_id = ${escapeSqlString(websiteId)}
        AND e.time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND e.time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND e.event_name = 'screen_view'
        AND e.path != ''
      GROUP BY e.path
    )
    SELECT 
      path as name,
      exits,
      visitors,
      exits as sessions
    FROM exit_pages
    WHERE path != ''
    ORDER BY exits DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  entry_pages: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH session_entry AS (
      SELECT 
        session_id,
        anonymous_id,
        path as entry_page,
        time as entry_time,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY time) as page_rank
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
        AND path != ''
    )
    SELECT 
      entry_page as name,
      COUNT(*) as entries,
      COUNT(DISTINCT session_id) as sessions,
      COUNT(DISTINCT anonymous_id) as visitors
    FROM session_entry
    WHERE page_rank = 1
    GROUP BY entry_page
    ORDER BY entries DESC
    LIMIT ${limit} OFFSET ${offset}
  `,
} 