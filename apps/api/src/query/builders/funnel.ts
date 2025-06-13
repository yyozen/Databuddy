import type { ParameterBuilder } from '../types'
import { escapeSqlString } from '../utils'

export const funnelBuilders: Record<string, ParameterBuilder> = {
  funnel_analysis: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone: string = 'UTC', filters: any[] = []) => {
    const funnelStepsFilter = filters.find((f: any) => f.field === 'funnel_steps');
    if (!funnelStepsFilter || !Array.isArray(funnelStepsFilter.value)) {
      return `SELECT '' as step_name, 0 as step_number, 0 as users, 0 as conversion_rate WHERE 1=0`;
    }

    const steps = funnelStepsFilter.value;
    
    // Build step CTEs dynamically
    const stepCTEs = steps.map((step: any, index: number) => {
      let whereCondition = '';
      
      if (step.type === 'PAGE_VIEW') {
        whereCondition = `path = ${escapeSqlString(step.target)}`;
      } else if (step.type === 'EVENT') {
        whereCondition = `event_name = ${escapeSqlString(step.target)}`;
      } else if (step.type === 'CUSTOM' && step.conditions) {
        // Handle custom conditions - this can be expanded based on needs
        whereCondition = `event_name = ${escapeSqlString(step.target)}`;
      }
      
      return `
        step_${index + 1}_users AS (
          SELECT DISTINCT
            session_id,
            anonymous_id,
            MIN(time) as step_time
          FROM analytics.events
          WHERE client_id = ${escapeSqlString(websiteId)}
            AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
            AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
            AND ${whereCondition}
          GROUP BY session_id, anonymous_id
        )`;
    }).join(',\n');

    // Build step joins for funnel progression
    const stepJoins = steps.map((step: any, index: number) => {
      if (index === 0) return '';
      
      return `
        LEFT JOIN step_${index + 1}_users s${index + 1} 
          ON s1.session_id = s${index + 1}.session_id 
          AND s${index + 1}.step_time >= s${index}.step_time`;
    }).join('\n');

    // Build step analysis
    const stepAnalysis = steps.map((step: any, index: number) => {
      const stepNum = index + 1;
      return `
        SELECT 
          ${stepNum} as step_number,
          ${escapeSqlString(step.name)} as step_name,
          COUNT(DISTINCT s1.session_id) as total_users,
          ${index === 0 ? 
            'COUNT(DISTINCT s1.session_id)' : 
            `COUNT(DISTINCT s${stepNum}.session_id)`} as users,
          ${index === 0 ? 
            '100.0' : 
            `ROUND((COUNT(DISTINCT s${stepNum}.session_id) * 100.0 / COUNT(DISTINCT s1.session_id)), 2)`} as conversion_rate,
          ${index === 0 ? 
            '0' : 
            `(COUNT(DISTINCT s1.session_id) - COUNT(DISTINCT s${stepNum}.session_id))`} as dropoffs
        FROM step_1_users s1 ${stepJoins}`;
    });

    return `
      WITH ${stepCTEs}
      ${stepAnalysis.join('\nUNION ALL\n')}
      ORDER BY step_number
      LIMIT ${limit} OFFSET ${offset}
    `;
  },

  funnel_performance: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH funnel_sessions AS (
      SELECT DISTINCT
        session_id,
        anonymous_id,
        COUNT(DISTINCT path) as unique_pages_visited,
        MIN(time) as session_start,
        MAX(time) as session_end,
        dateDiff('second', MIN(time), MAX(time)) as session_duration
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = 'screen_view'
      GROUP BY session_id, anonymous_id
      HAVING unique_pages_visited >= 2
    )
    SELECT
      'overall' as funnel_name,
      COUNT(DISTINCT session_id) as total_sessions,
      COUNT(DISTINCT anonymous_id) as total_users,
      AVG(unique_pages_visited) as avg_pages_per_session,
      AVG(session_duration) as avg_session_duration,
      ROUND(AVG(session_duration) / 60, 2) as avg_duration_minutes
    FROM funnel_sessions
    LIMIT ${limit} OFFSET ${offset}
  `,

  funnel_steps_breakdown: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone: string = 'UTC', filters: any[] = []) => { 
    const funnelIdFilter = filters.find((f: any) => f.field === 'funnel_id');
    if (!funnelIdFilter) {
      return `SELECT '' as step_name, 0 as step_number, 0 as users, 0 as total_users, 0 as conversion_rate, 0 as dropoffs, 0 as dropoff_rate WHERE 1=0`;
    }

    // This would need to be enhanced to fetch funnel steps from the database
    // For now, return a placeholder query
    return `
      WITH step_analysis AS (
        SELECT 
          1 as step_number,
          'Landing Page' as step_name,
          COUNT(DISTINCT session_id) as users,
          COUNT(DISTINCT session_id) as total_users,
          100.0 as conversion_rate,
          0 as dropoffs,
          0.0 as dropoff_rate,
          0.0 as avg_time_to_complete
        FROM analytics.events
        WHERE client_id = ${escapeSqlString(websiteId)}
          AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
          AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
          AND event_name = 'screen_view'
        UNION ALL
        SELECT 
          2 as step_number,
          'Conversion Page' as step_name,
          COUNT(DISTINCT session_id) as users,
          (SELECT COUNT(DISTINCT session_id) FROM analytics.events 
           WHERE client_id = ${escapeSqlString(websiteId)}
             AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
             AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
             AND event_name = 'screen_view') as total_users,
          50.0 as conversion_rate,
          COUNT(DISTINCT session_id) as dropoffs,
          50.0 as dropoff_rate,
          120.0 as avg_time_to_complete
        FROM analytics.events
        WHERE client_id = ${escapeSqlString(websiteId)}
          AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
          AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
          AND event_name = 'screen_view'
          AND path LIKE '%signup%'
      )
      SELECT * FROM step_analysis
      ORDER BY step_number
      LIMIT ${limit} OFFSET ${offset}
    `;
  },

  funnel_user_segments: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone: string = 'UTC', filters: any[] = []) => {
    const funnelIdFilter = filters.find((f: any) => f.field === 'funnel_id');
    if (!funnelIdFilter) {
      return `SELECT '' as segment_name, 0 as users, 0 as conversion_rate WHERE 1=0`;
    }

    return `
      WITH user_segments AS (
        SELECT 
          CASE 
            WHEN device_type = 'desktop' THEN 'Desktop Users'
            WHEN device_type = 'mobile' THEN 'Mobile Users'
            WHEN device_type = 'tablet' THEN 'Tablet Users'
            ELSE 'Other'
          END as segment_name,
          COUNT(DISTINCT anonymous_id) as users,
          COUNT(DISTINCT session_id) as sessions,
          AVG(load_time) as avg_load_time
        FROM analytics.events
        WHERE client_id = ${escapeSqlString(websiteId)}
          AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
          AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
          AND event_name = 'screen_view'
        GROUP BY segment_name
      )
      SELECT 
        segment_name,
        users,
        sessions,
        ROUND(users * 100.0 / SUM(users) OVER(), 2) as conversion_rate,
        ROUND(avg_load_time, 2) as avg_load_time
      FROM user_segments
      ORDER BY users DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  },
} 