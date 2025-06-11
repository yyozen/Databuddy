import { createSqlBuilder } from "../../builders/analytics";

import { Hono } from "hono";  
import type { AppVariables } from "../../types";
import { logger } from "../../lib/logger";
import { chQuery } from "@databuddy/db";
import { parseUserAgentDetails } from "../../utils/ua";

export const errorsRouter = new Hono<{ Variables: AppVariables }>();

// Helper function to create error details builder (modified for pagination)
function createErrorDetailsBuilder(websiteId: string, startDate: string, endDate: string, limit: number, page: number) {
  const builder = createSqlBuilder('events');
  const offset = (Number(page) - 1) * Number(limit);
  
  builder.sb.select = {
    time: 'time',
    error_type: 'COALESCE(error_type, \'Unknown\') as error_type',
    error_message: 'COALESCE(error_message, \'\') as error_message',
    error_stack: 'COALESCE(error_stack, \'\') as error_stack',
    page_url: 'COALESCE(url, \'\') as page_url',
    user_agent: 'COALESCE(user_agent, \'\') as user_agent',
    session_id: 'session_id',
    anonymous_id: 'anonymous_id',
    country: 'COALESCE(country, \'Unknown\') as country',
    region: 'COALESCE(region, \'Unknown\') as region'
  };
  
  builder.sb.where = {
    client_filter: `client_id = '${websiteId}'`,
    date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
    event_filter: "event_name = 'error'"
  };
  
  builder.sb.orderBy = {
    time: 'time DESC'
  };
  
  builder.sb.limit = Number(limit);
  builder.sb.offset = offset;
  
  return builder;
}

errorsRouter.get('/', async (c) => {
  const params = await c.req.query();

  try {
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const limit = Number(params.limit);
    const page = Number(params.page);

    // --- Query 1: Error Types Summary and Pivoted Timeline --- 
    // Step 1.1: Get Top N Error Types
    const topErrorTypesBuilder = createSqlBuilder('events');
    topErrorTypesBuilder.sb.select = {
      error_type: 'COALESCE(error_type, \'Unknown\') as error_type',
      count: 'COUNT(*) as count',
      unique_sessions: 'COUNT(DISTINCT session_id) as unique_sessions'
    };
    topErrorTypesBuilder.sb.where = {
      client_filter: `client_id = '${params.website_id}'`,
      date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
      event_filter: "event_name = 'error'"
    };
    topErrorTypesBuilder.sb.groupBy = { error_type: 'error_type' };
    topErrorTypesBuilder.sb.orderBy = { count: 'count DESC' };
    topErrorTypesBuilder.sb.limit = 5;

    const topErrorTypesResult = await chQuery(topErrorTypesBuilder.getSql());

    // Step 1.2: Construct and Execute Pivoted Timeline Query based on Top N Error Types
    const pivotedTimelineSelects: Record<string, string> = { date: 'toDate(time) as date' };
    const topTypeNames = topErrorTypesResult.map(t => t.error_type as string);

    for (const typeName of topTypeNames) {
      const alias = typeName.replace(/[^a-zA-Z0-9_]/g, '') || 'UnknownType';
      pivotedTimelineSelects[alias] = `countIf(error_type = \'${typeName.replace(/'/g, "''")}\') as ${alias}`;
    }
    // Handle "Other Errors" - use NOT (error_type IN (...)) syntax instead of NOT IN
    if (topTypeNames.length > 0) {
             pivotedTimelineSelects.OtherErrors = `countIf(NOT (error_type IN (${topTypeNames.map(t => `'${t.replace(/'/g, "''").replace(/\\/g, "\\\\")}'`).join(',')}))) as OtherErrors`;
     } else {
       pivotedTimelineSelects.OtherErrors = 'COUNT(*) as OtherErrors';
    }

    const timelinePivotedBuilder = createSqlBuilder('events');
    timelinePivotedBuilder.sb.select = pivotedTimelineSelects;
    timelinePivotedBuilder.sb.where = {
      client_filter: `client_id = '${params.website_id}'`,
      date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
      event_filter: "event_name = 'error'"
    };
    timelinePivotedBuilder.sb.groupBy = { date: 'date' };
    timelinePivotedBuilder.sb.orderBy = { date: 'date ASC' };

    const errorsOverTimePivoted = await chQuery(timelinePivotedBuilder.getSql());

    // --- Query 2: Paginated Recent Error Details ---
    const errorDetailsBuilder = createErrorDetailsBuilder(params.website_id, startDate, endDate, limit, page);
    const errorDetailsResult = await chQuery(errorDetailsBuilder.getSql());

    const processedErrorDetails = errorDetailsResult.map(error => {
      const userAgentInfo = parseUserAgentDetails(error.user_agent as string);
      return {
        time: error.time,
        error_type: error.error_type,
        error_message: error.error_message,
        error_stack: error.error_stack,
        page_url: error.page_url,
        session_id: error.session_id,
        anonymous_id: error.anonymous_id,
        country: error.country,
        region: error.region,
        browser: userAgentInfo.browser_name,
        browser_version: userAgentInfo.browser_version,
        os: userAgentInfo.os_name,
        os_version: userAgentInfo.os_version,
        device_type: userAgentInfo.device_type,
        device_brand: userAgentInfo.device_brand,
        device_model: userAgentInfo.device_model
      };
    });
    
    const totalErrorDetailsBuilder = createSqlBuilder('events');
    totalErrorDetailsBuilder.sb.select = { count: 'COUNT(*) as count' };
    totalErrorDetailsBuilder.sb.where = {
        client_filter: `client_id = '${params.website_id}'`,
        date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
        event_filter: "event_name = 'error'"
    };
    const totalErrorDetailsResult = await chQuery(totalErrorDetailsBuilder.getSql());
    const totalErrorDetails = totalErrorDetailsResult[0]?.count || 0;

    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      error_types: topErrorTypesResult,
      errors_over_time: errorsOverTimePivoted,
      recent_errors: processedErrorDetails,
      pagination: {
        page: page,
        limit: limit,
        total_items: totalErrorDetails,
        total_pages: Math.ceil(totalErrorDetails / limit),
        hasNext: page * limit < totalErrorDetails,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    logger.error('Error retrieving error analytics data', { 
      error,
      website_id: params.website_id
    });
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500);
  }
}); 

export default errorsRouter;