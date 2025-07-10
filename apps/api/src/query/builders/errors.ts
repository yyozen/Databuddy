import type { ParameterBuilder, QueryWithParams } from '../types'

type ErrorQueryBuilderOptions = {
  select: string
  where?: string
  groupBy?: string
  orderBy?: string
}

const buildErrorQuery = (
  websiteId: string,
  startDate: string,
  endDate: string,
  limit: number,
  offset: number,
  options: ErrorQueryBuilderOptions,
): QueryWithParams => {
  const { select, where, groupBy, orderBy } = options

  const baseWhere = `
    client_id = {websiteId:String}
    AND timestamp >= parseDateTimeBestEffort({startDate:String})
    AND timestamp <= parseDateTimeBestEffort({endDate:String})
    AND message != ''
  `
  const whereClause = where ? `${baseWhere} AND ${where}` : baseWhere

  const query = `
    SELECT ${select}
    FROM analytics.errors
    WHERE ${whereClause}
    ${groupBy ? `GROUP BY ${groupBy}` : ''}
    ${orderBy ? `ORDER BY ${orderBy}` : ''}
    LIMIT {limit:UInt64} OFFSET {offset:UInt64}
  `

  const params = {
    websiteId,
    startDate,
    endDate,
    limit,
    offset,
  }

  return { query, params }
}

export const errorBuilders: Record<string, ParameterBuilder> = {
  recent_errors: (websiteId, startDate, endDate, limit, offset) =>
    buildErrorQuery(websiteId, startDate, endDate, limit, offset, {
      select: `
        message as error_message,
        stack as error_stack,
        path as page_url,
        anonymous_id,
        session_id,
        timestamp as time,
        browser_name,
        browser_version,
        os_name,
        device_type,
        country,
        region
      `,
      orderBy: 'timestamp DESC',
    }),

  error_types: (websiteId, startDate, endDate, limit, offset) =>
    buildErrorQuery(websiteId, startDate, endDate, limit, offset, {
      select: `
        message as name,
        COUNT(*) as total_occurrences,
        uniq(anonymous_id) as affected_users,
        uniq(session_id) as affected_sessions,
        MAX(timestamp) as last_occurrence,
        MIN(timestamp) as first_occurrence
      `,
      groupBy: 'message',
      orderBy: 'total_occurrences DESC',
    }),

  errors_by_page: (websiteId, startDate, endDate, limit, offset) =>
    buildErrorQuery(websiteId, startDate, endDate, limit, offset, {
      select: `
        path as name,
        COUNT(*) as total_errors,
        COUNT(DISTINCT message) as unique_error_types,
        uniq(anonymous_id) as affected_users,
        uniq(session_id) as affected_sessions
      `,
      where: `path != ''`,
      groupBy: 'path',
      orderBy: 'total_errors DESC',
    }),

  errors_by_browser: (websiteId, startDate, endDate, limit, offset) =>
    buildErrorQuery(websiteId, startDate, endDate, limit, offset, {
      select: `
        CONCAT(browser_name, ' ', browser_version) as name,
        COUNT(*) as total_errors,
        COUNT(DISTINCT message) as unique_error_types,
        uniq(anonymous_id) as affected_users,
        uniq(session_id) as affected_sessions
      `,
      where: `browser_name != '' AND browser_version IS NOT NULL AND browser_version != ''`,
      groupBy: 'browser_name, browser_version',
      orderBy: 'total_errors DESC',
    }),

  errors_by_os: (websiteId, startDate, endDate, limit, offset) =>
    buildErrorQuery(websiteId, startDate, endDate, limit, offset, {
      select: `
        os_name as name,
        COUNT(*) as total_errors,
        COUNT(DISTINCT message) as unique_error_types,
        uniq(anonymous_id) as affected_users,
        uniq(session_id) as affected_sessions
      `,
      where: `os_name != ''`,
      groupBy: 'os_name',
      orderBy: 'total_errors DESC',
    }),

  errors_by_country: (websiteId, startDate, endDate, limit, offset) =>
    buildErrorQuery(websiteId, startDate, endDate, limit, offset, {
      select: `
        country as name,
        COUNT(*) as total_errors,
        COUNT(DISTINCT message) as unique_error_types,
        uniq(anonymous_id) as affected_users,
        uniq(session_id) as affected_sessions
      `,
      where: `country != ''`,
      groupBy: 'country',
      orderBy: 'total_errors DESC',
    }),

  errors_by_device: (websiteId, startDate, endDate, limit, offset) =>
    buildErrorQuery(websiteId, startDate, endDate, limit, offset, {
      select: `
        device_type as name,
        COUNT(*) as total_errors,
        COUNT(DISTINCT message) as unique_error_types,
        uniq(anonymous_id) as affected_users,
        uniq(session_id) as affected_sessions
      `,
      where: `device_type != ''`,
      groupBy: 'device_type',
      orderBy: 'total_errors DESC',
    }),

  error_trends: (websiteId, startDate, endDate, limit, offset) =>
    buildErrorQuery(websiteId, startDate, endDate, limit, offset, {
      select: `
        toDate(timestamp) as date,
        COUNT(*) as total_errors,
        COUNT(DISTINCT message) as unique_error_types,
        uniq(anonymous_id) as affected_users,
        uniq(session_id) as affected_sessions
      `,
      groupBy: 'toDate(timestamp)',
      orderBy: 'date ASC',
    }),
} 