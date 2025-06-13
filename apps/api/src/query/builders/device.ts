import type { ParameterBuilder } from '../types'
import { createStandardQuery, createQueryBuilder, METRICS, escapeSqlString } from '../utils'

export const deviceBuilders: Record<string, ParameterBuilder> = {
  device_type: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      COALESCE(device_type, 'desktop') as name,
      uniq(anonymous_id) as visitors,
      COUNT(*) as pageviews,
      uniq(session_id) as sessions
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name = 'screen_view'
    GROUP BY device_type
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  browser_name: createStandardQuery('browser_name', ['browser_name'], "browser_name != ''"),
  
  browsers_grouped: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      CONCAT(browser_name, ' ', browser_version) as name,
      browser_name,
      browser_version,
      uniq(anonymous_id) as visitors,
      COUNT(*) as pageviews,
      uniq(session_id) as sessions
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name = 'screen_view'
      AND browser_name != ''
      AND browser_version IS NOT NULL 
      AND browser_version != ''
    GROUP BY browser_name, browser_version
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  os_name: createStandardQuery('os_name', ['os_name'], "os_name != ''"),
  screen_resolution: createStandardQuery('screen_resolution', ['screen_resolution'], "screen_resolution != '' AND screen_resolution IS NOT NULL"),
  connection_type: createStandardQuery('connection_type', ['connection_type'], "connection_type != '' AND connection_type IS NOT NULL"),
} 