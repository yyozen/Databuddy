import { createErrorResponse } from "../../utils/analytics-helpers";

import { createMiniChartBuilder } from "../../builders/analytics";
import { createSuccessResponse } from "../../utils/analytics-helpers";
import { chQuery, db, websites, eq, inArray, and, or, isNull, member } from "@databuddy/db";
import { logger } from "../../lib/logger";
import type { AppVariables } from "../../types";
import { timezoneMiddleware, useTimezone } from "../../middleware/timezone";
import { Hono } from "hono";
import { websiteAuthHook } from "../../middleware/website";

async function getUserOrganizationIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  const memberships = await db.query.member.findMany({
    where: eq(member.userId, userId),
    columns: {
      organizationId: true
    }
  });
  return memberships.map(m => m.organizationId);
}

const miniChartRouter = new Hono<{ Variables: AppVariables }>();

// Apply timezone middleware
miniChartRouter.use('*', timezoneMiddleware);

/**
 * Get mini chart data for website card
 * GET /analytics/mini-chart/:id
 */
miniChartRouter.get('/:id', websiteAuthHook(), async (c) => {
  const website = c.get('website');
  const timezoneInfo = useTimezone(c);

  if (!website) {
    return c.json(createErrorResponse({
      message: 'Website not found or you do not have permission to access it.'
    }), 404);
  }

  try {
    const miniChartBuilder = createMiniChartBuilder(website.id);

    const chartData = await chQuery(miniChartBuilder.getSql());

    return c.json(createSuccessResponse({
      data: chartData || [],
      timezone: {
        timezone: timezoneInfo.timezone,
        detected: timezoneInfo.detected,
        source: timezoneInfo.source
      }
    }));

  } catch (error: any) {
    logger.error('Error fetching mini chart data:', error);
    return c.json(createErrorResponse({
      message: 'Error fetching mini chart data',
      error: error.message
    }), 500);
  }
});

/**
 * Get mini charts data for multiple websites in a single request
 * GET /analytics/batch-mini-charts?ids=id1,id2,id3
 */
miniChartRouter.get('/batch-mini-charts', async (c) => {
  const ids = await c.req.query('ids');
  const user = c.get('user');
  const timezoneInfo = useTimezone(c);

  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  if (!ids) {
    return c.json(createErrorResponse({
      message: 'Website IDs required',
      error: 'Missing ids parameter'
    }), 400);
  }

  try {
    const requestedIds = ids.split(',');
    const userOrgIds = await getUserOrganizationIds(user.id);

    // Verify user has access to all requested websites
    const accessibleWebsites = await db.query.websites.findMany({
      where: and(
        inArray(websites.id, requestedIds),
        or(
          eq(websites.userId, user.id),
          userOrgIds.length > 0 ? inArray(websites.organizationId, userOrgIds) : isNull(websites.organizationId)
        )
      ),
      columns: {
        id: true
      }
    });

    const accessibleIds = new Set(accessibleWebsites.map(w => w.id));
    const inaccessibleIds = requestedIds.filter(id => !accessibleIds.has(id));

    if (inaccessibleIds.length > 0) {
      return c.json(createErrorResponse({
        message: 'You do not have permission to access some of the requested websites.',
        error: `Access denied for website IDs: ${inaccessibleIds.join(', ')}`
      }), 403);
    }

    // Fetch mini chart data for all websites in parallel
    const promises = requestedIds.map(async (id) => {
      const miniChartBuilder = createMiniChartBuilder(id);
      const data = await chQuery(miniChartBuilder.getSql());
      return {
        id,
        data: data || []
      };
    });

    const results = await Promise.all(promises);

    // Convert results array to an object with website IDs as keys
    const batchData = results.reduce((acc, { id, data }) => {
      acc[id] = data;
      return acc;
    }, {} as Record<string, any>);

    return c.json(createSuccessResponse({
      data: batchData,
      timezone: {
        timezone: timezoneInfo.timezone,
        detected: timezoneInfo.detected,
        source: timezoneInfo.source
      }
    }));

  } catch (error: any) {
    logger.error('Error fetching batch mini chart data:', error);
    return c.json(createErrorResponse({
      message: 'Error fetching batch mini chart data'
    }), 500);
  }
});

export default miniChartRouter;