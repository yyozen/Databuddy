import type { ParameterBuilder } from '../types'
import { escapeSqlString } from '../utils'

export const userJourneyBuilders: Record<string, ParameterBuilder> = {
  user_journeys: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH ordered_events AS (
      SELECT 
        session_id,
        anonymous_id,
        path,
        time,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY time) as step_number
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
        AND path != ''
    ),
    transitions AS (
      SELECT 
        e1.session_id,
        e1.anonymous_id,
        e1.path as from_page,
        e2.path as to_page,
        e1.step_number,
        e2.step_number as next_step
      FROM ordered_events e1
      JOIN ordered_events e2 ON e1.session_id = e2.session_id AND e2.step_number = e1.step_number + 1
      WHERE e1.path != e2.path
    )
    SELECT 
      from_page,
      to_page,
      COUNT(*) as transitions,
      COUNT(DISTINCT session_id) as sessions,
      COUNT(DISTINCT anonymous_id) as users,
      ROUND(AVG(step_number), 2) as avg_step_in_journey
    FROM transitions
    GROUP BY from_page, to_page
    ORDER BY transitions DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  journey_paths: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH session_paths AS (
      SELECT 
        session_id,
        anonymous_id,
        groupArray(path) as page_sequence,
        COUNT(*) as page_count,
        MIN(time) as session_start,
        MAX(time) as session_end,
        dateDiff('second', MIN(time), MAX(time)) as session_duration
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
        AND path != ''
      GROUP BY session_id, anonymous_id
      HAVING page_count >= 2
    ),
    path_analysis AS (
      SELECT 
        arrayStringConcat(arraySlice(page_sequence, 1, LEAST(length(page_sequence), 5)), ' → ') as journey_path,
        page_sequence[1] as entry_page,
        page_sequence[-1] as exit_page,
        COUNT(*) as frequency,
        COUNT(DISTINCT anonymous_id) as unique_users,
        ROUND(AVG(page_count), 2) as avg_pages_in_path,
        ROUND(AVG(session_duration), 2) as avg_duration_seconds
      FROM session_paths
      GROUP BY journey_path, entry_page, exit_page
    )
    SELECT 
      journey_path as name,
      entry_page,
      exit_page,
      frequency,
      unique_users,
      avg_pages_in_path,
      avg_duration_seconds,
      ROUND(avg_duration_seconds / 60, 2) as avg_duration_minutes
    FROM path_analysis
    ORDER BY frequency DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  journey_dropoffs: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH session_steps AS (
      SELECT 
        session_id,
        anonymous_id,
        path,
        time,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY time) as step_number,
        COUNT(*) OVER (PARTITION BY session_id) as total_steps_in_session
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
        AND path != ''
    ),
    exit_analysis AS (
      SELECT 
        path,
        COUNT(*) as total_visits,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT anonymous_id) as total_users,
        SUM(CASE WHEN step_number = total_steps_in_session THEN 1 ELSE 0 END) as exits,
        SUM(CASE WHEN step_number < total_steps_in_session THEN 1 ELSE 0 END) as continuations
      FROM session_steps
      GROUP BY path
      HAVING total_visits >= 10
    )
    SELECT 
      path as name,
      total_visits,
      total_sessions,
      total_users,
      exits,
      continuations,
      ROUND((exits * 100.0 / total_visits), 2) as exit_rate,
      ROUND((continuations * 100.0 / total_visits), 2) as continuation_rate
    FROM exit_analysis
    ORDER BY exit_rate DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  journey_entry_points: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
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
    ),
    entry_analysis AS (
      SELECT 
        entry_page,
        COUNT(*) as entries,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(DISTINCT anonymous_id) as users
      FROM session_entry
      WHERE page_rank = 1
      GROUP BY entry_page
    ),
    session_metrics AS (
      SELECT 
        session_id,
        countIf(event_name = 'screen_view') as page_count
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      GROUP BY session_id
    ),
    session_outcomes AS (
      SELECT 
        se.entry_page,
        COUNT(DISTINCT se.session_id) as total_sessions,
        COUNT(DISTINCT CASE WHEN sm.page_count = 1 THEN se.session_id END) as bounce_sessions,
        AVG(COALESCE(sm.page_count, 1)) as avg_pages_per_session
      FROM session_entry se
      LEFT JOIN session_metrics sm ON se.session_id = sm.session_id
      WHERE se.page_rank = 1
      GROUP BY se.entry_page
    )
    SELECT 
      ea.entry_page as name,
      ea.entries,
      ea.sessions,
      ea.users,
      ROUND((COALESCE(so.bounce_sessions, 0) * 100.0 / COALESCE(so.total_sessions, 1)), 2) as bounce_rate,
      ROUND(so.avg_pages_per_session, 2) as avg_pages_per_session
    FROM entry_analysis ea
    JOIN session_outcomes so ON ea.entry_page = so.entry_page
    ORDER BY ea.entries DESC
    LIMIT ${limit} OFFSET ${offset}
  `,
} 