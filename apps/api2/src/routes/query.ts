import { Elysia, t } from "elysia";
import { executeQuery, compileQuery } from "../query";
import { QueryBuilders } from "../query/builders";
import { db } from "@databuddy/db";
import { eq } from "drizzle-orm";
import { websites } from "@databuddy/db";
import { cacheable } from "@databuddy/redis";

const FilterSchema = t.Object({
    field: t.String(),
    op: t.Enum({
        eq: 'eq',
        ne: 'ne',
        like: 'like',
        gt: 'gt',
        lt: 'lt',
        in: 'in',
        notIn: 'notIn'
    }),
    value: t.Union([t.String(), t.Number(), t.Array(t.Union([t.String(), t.Number()]))])
});

const DynamicQueryRequestSchema = t.Object({
    id: t.Optional(t.String()),
    parameters: t.Array(t.String()),
    limit: t.Optional(t.Number()),
    page: t.Optional(t.Number()),
    filters: t.Optional(t.Array(FilterSchema)),
    granularity: t.Optional(t.Union([
        t.Literal('hourly'),
        t.Literal('daily'),
        t.Literal('hour'),
        t.Literal('day')
    ])),
    groupBy: t.Optional(t.String())
});

export const query = new Elysia({ prefix: '/v1/query' })
    .get('/types', () => ({
        success: true,
        types: Object.keys(QueryBuilders),
        configs: Object.fromEntries(
            Object.entries(QueryBuilders).map(([key, config]) => [
                key,
                {
                    allowedFilters: config.allowedFilters || [],
                    customizable: config.customizable || false,
                    defaultLimit: config.limit
                }
            ])
        )
    }))

    .post('/compile', async ({ body, query }) => {
        try {
            const { website_id } = query;
            const websiteDomain = website_id ? await getWebsiteDomain(website_id) : null;
            const result = compileQuery(body, websiteDomain);
            return { success: true, ...result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Compilation failed'
            };
        }
    }, {
        body: t.Object({
            projectId: t.String(),
            type: t.Enum(Object.fromEntries(Object.keys(QueryBuilders).map(k => [k, k]))),
            from: t.String(),
            to: t.String(),
            timeUnit: t.Optional(t.Enum({
                minute: 'minute',
                hour: 'hour',
                day: 'day',
                week: 'week',
                month: 'month'
            })),
            filters: t.Optional(t.Array(FilterSchema)),
            groupBy: t.Optional(t.Array(t.String())),
            orderBy: t.Optional(t.String()),
            limit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
            offset: t.Optional(t.Number({ minimum: 0 }))
        })
    })

    .post('/', async ({ body, query }) => {
        try {
            if (Array.isArray(body)) {
                const results = [];
                for (const queryRequest of body) {
                    try {
                        const result = await executeDynamicQuery(queryRequest, query);
                        results.push(result);
                    } catch (error) {
                        results.push({
                            success: false,
                            error: error instanceof Error ? error.message : 'Query failed'
                        });
                    }
                }
                return {
                    success: true,
                    batch: true,
                    results
                };
            }

            const result = await executeDynamicQuery(body, query);
            return { success: true, ...result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Query failed'
            };
        }
    }, {
        body: t.Union([DynamicQueryRequestSchema, t.Array(DynamicQueryRequestSchema)])
    });

const getWebsiteDomain = cacheable(
    async (websiteId: string): Promise<string | null> => {
        try {
            const website = await db.query.websites.findFirst({
                where: eq(websites.id, websiteId),
            });
            return website?.domain || null;
        } catch (error) {
            console.error('Error fetching website domain:', error);
            return null;
        }
    },
    {
        expireInSec: 300,
        prefix: 'website-domain',
        staleWhileRevalidate: true,
        staleTime: 60
    }
);

async function executeDynamicQuery(request: any, queryParams: any) {
    const { website_id, start_date, end_date, timezone } = queryParams;

    const websiteDomain = website_id ? await getWebsiteDomain(website_id) : null;

    const results = [];

    const parameterPromises = request.parameters.map(async (parameter: string) => {
        try {
            const queryType = parameter;

            if (!QueryBuilders[queryType]) {
                return {
                    parameter,
                    success: false,
                    error: `Unknown query type: ${queryType}`,
                    data: []
                };
            }

            let timeUnit: 'hour' | 'day' = 'day';
            if (request.granularity === 'hourly') {
                timeUnit = 'hour';
            } else if (request.granularity === 'daily') {
                timeUnit = 'day';
            } else if (request.granularity === 'hour') {
                timeUnit = 'hour';
            } else if (request.granularity === 'day') {
                timeUnit = 'day';
            }

            const queryRequest = {
                projectId: website_id,
                type: queryType,
                from: start_date,
                to: end_date,
                timeUnit,
                filters: request.filters || [],
                limit: request.limit || 100,
                offset: (request.page || 1) - 1
            };

            const data = await executeQuery(queryRequest, websiteDomain);

            return {
                parameter,
                success: true,
                data: data || []
            };

        } catch (error) {
            return {
                parameter,
                success: false,
                error: error instanceof Error ? error.message : 'Query failed',
                data: []
            };
        }
    });

    const parameterResults = await Promise.all(parameterPromises);
    results.push(...parameterResults);

    return {
        queryId: request.id,
        data: results,
        meta: {
            parameters: request.parameters,
            total_parameters: request.parameters.length,
            page: request.page || 1,
            limit: request.limit || 100,
            filters_applied: request.filters?.length || 0
        }
    };
} 