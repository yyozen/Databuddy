import type { ParameterBuilder } from '../types'
import { escapeSqlString } from '../utils'

const activeStatsBuilder: ParameterBuilder = (
    websiteId,
) => {
    return `
    SELECT
      uniq(anonymous_id) as active_users
    FROM analytics.events
    WHERE
      client_id = ${escapeSqlString(websiteId)}
      AND time >= now() - INTERVAL 5 MINUTE
  `
}

const latestEventsBuilder: ParameterBuilder = (
    websiteId,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
) => {
    return `
    SELECT
      *
    FROM analytics.events
    WHERE
      client_id = ${escapeSqlString(websiteId)}
      AND time >= now() - INTERVAL 5 MINUTE
    ORDER BY time DESC
    LIMIT ${limit} OFFSET ${offset}
  `
}

export const realTimeBuilders: Record<string, ParameterBuilder> = {
    active_stats: activeStatsBuilder,
    latest_events: latestEventsBuilder,
} 