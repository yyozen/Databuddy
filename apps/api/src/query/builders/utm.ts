import type { ParameterBuilder } from '../types'
import { createStandardQuery, escapeSqlString } from '../utils'

export const utmBuilders: Record<string, ParameterBuilder> = {
  utm_source: createStandardQuery('utm_source', ['utm_source'], "utm_source != ''"),
  utm_medium: createStandardQuery('utm_medium', ['utm_medium'], "utm_medium != ''"),
  utm_campaign: createStandardQuery('utm_campaign', ['utm_campaign'], "utm_campaign != ''"),
  utm_content: createStandardQuery('utm_content', ['utm_content'], "utm_content != ''"),
  utm_term: createStandardQuery('utm_term', ['utm_term'], "utm_term != ''"),
  
  referrer: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      referrer as name,
      uniq(anonymous_id) as visitors,
      COUNT(*) as pageviews,
      uniq(session_id) as sessions
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name = 'screen_view'
      AND referrer != '' 
      AND referrer IS NOT NULL
    GROUP BY referrer
    ORDER BY visitors DESC
  `,
} 