import { Analytics } from "../../types/tables";
import type { Filter, SimpleQueryConfig, TimeUnit } from "../types";

export const RevenueBuilders: Record<string, SimpleQueryConfig> = {
	revenue_overview: {
		customSql: (websiteId: string, startDate: string, endDate: string) => ({
			sql: `
				SELECT 
					sumIf(amount, type != 'refund') as total_revenue,
					countIf(type != 'refund') as total_transactions,
					sumIf(amount, type = 'refund') as refund_amount,
					countIf(type = 'refund') as refund_count,
					sumIf(amount, type = 'subscription') as subscription_revenue,
					countIf(type = 'subscription') as subscription_count,
					sumIf(amount, type = 'sale') as sale_revenue,
					countIf(type = 'sale') as sale_count,
					uniq(anonymous_id) as unique_customers
				FROM ${Analytics.revenue}
				WHERE 
					(owner_id = {websiteId:String} OR website_id = {websiteId:String})
					AND created >= toDateTime({startDate:String})
					AND created <= toDateTime(concat({endDate:String}, ' 23:59:59'))
			`,
			params: { websiteId, startDate, endDate },
		}),
		timeField: "created",
		customizable: false,
	},

	revenue_time_series: {
		customSql: (websiteId: string, startDate: string, endDate: string) => ({
			sql: `
				SELECT 
					toDate(created) as date,
					sumIf(amount, type != 'refund') as revenue,
					countIf(type != 'refund') as transactions,
					uniq(anonymous_id) as customers
				FROM ${Analytics.revenue}
				WHERE 
					(owner_id = {websiteId:String} OR website_id = {websiteId:String})
					AND created >= toDateTime({startDate:String})
					AND created <= toDateTime(concat({endDate:String}, ' 23:59:59'))
				GROUP BY date
				ORDER BY date ASC
			`,
			params: { websiteId, startDate, endDate },
		}),
		timeField: "created",
		customizable: false,
	},

	revenue_by_provider: {
		customSql: (websiteId: string, startDate: string, endDate: string) => ({
			sql: `
				SELECT 
					provider as name,
					sumIf(amount, type != 'refund') as revenue,
					countIf(type != 'refund') as transactions,
					uniq(anonymous_id) as customers,
					ROUND((sumIf(amount, type != 'refund') / nullIf(SUM(sumIf(amount, type != 'refund')) OVER(), 0)) * 100, 2) as percentage
				FROM ${Analytics.revenue}
				WHERE 
					(owner_id = {websiteId:String} OR website_id = {websiteId:String})
					AND created >= toDateTime({startDate:String})
					AND created <= toDateTime(concat({endDate:String}, ' 23:59:59'))
				GROUP BY provider
				ORDER BY revenue DESC
			`,
			params: { websiteId, startDate, endDate },
		}),
		timeField: "created",
		customizable: false,
	},

	revenue_by_product: {
		customSql: (
			websiteId: string,
			startDate: string,
			endDate: string,
			_filters?: Filter[],
			_granularity?: TimeUnit,
			_limit?: number
		) => {
			const limit = _limit ?? 50;
			return {
				sql: `
					SELECT 
						coalesce(product_name, 'Unknown') as name,
						product_id,
						sumIf(amount, type != 'refund') as revenue,
						countIf(type != 'refund') as transactions,
						uniq(anonymous_id) as customers,
						ROUND((sumIf(amount, type != 'refund') / nullIf(SUM(sumIf(amount, type != 'refund')) OVER(), 0)) * 100, 2) as percentage
					FROM ${Analytics.revenue}
					WHERE 
						(owner_id = {websiteId:String} OR website_id = {websiteId:String})
						AND created >= toDateTime({startDate:String})
						AND created <= toDateTime(concat({endDate:String}, ' 23:59:59'))
					GROUP BY product_name, product_id
					ORDER BY revenue DESC
					LIMIT {limit:UInt32}
				`,
				params: { websiteId, startDate, endDate, limit },
			};
		},
		timeField: "created",
		customizable: true,
	},

	revenue_by_country: {
		customSql: (
			websiteId: string,
			startDate: string,
			endDate: string,
			_filters?: Filter[],
			_granularity?: TimeUnit,
			_limit?: number
		) => {
			const limit = _limit ?? 20;
			return {
				sql: `
					WITH first_touch AS (
						SELECT 
							anonymous_id,
							argMin(country, time) as first_country
						FROM ${Analytics.events}
						WHERE client_id = {websiteId:String}
							AND anonymous_id != ''
						GROUP BY anonymous_id
					),
					revenue_with_context AS (
						SELECT 
							r.transaction_id,
							r.amount,
							r.type,
							r.anonymous_id,
							ft.first_country as country
						FROM ${Analytics.revenue} r
						LEFT JOIN first_touch ft ON r.anonymous_id = ft.anonymous_id
						WHERE 
							(r.owner_id = {websiteId:String} OR r.website_id = {websiteId:String})
							AND r.created >= toDateTime({startDate:String})
							AND r.created <= toDateTime(concat({endDate:String}, ' 23:59:59'))
					)
					SELECT 
						coalesce(nullIf(country, ''), 'Unknown') as name,
						sumIf(amount, type != 'refund') as revenue,
						countIf(type != 'refund') as transactions,
						uniq(anonymous_id) as customers,
						ROUND((sumIf(amount, type != 'refund') / nullIf(SUM(sumIf(amount, type != 'refund')) OVER(), 0)) * 100, 2) as percentage
					FROM revenue_with_context
					GROUP BY name
					ORDER BY revenue DESC
					LIMIT {limit:UInt32}
				`,
				params: { websiteId, startDate, endDate, limit },
			};
		},
		timeField: "created",
		customizable: true,
		plugins: {
			normalizeGeo: true,
		},
	},

	revenue_by_browser: {
		customSql: (
			websiteId: string,
			startDate: string,
			endDate: string,
			_filters?: Filter[],
			_granularity?: TimeUnit,
			_limit?: number
		) => {
			const limit = _limit ?? 10;
			return {
				sql: `
					WITH first_touch AS (
						SELECT 
							anonymous_id,
							argMin(browser_name, time) as first_browser
						FROM ${Analytics.events}
						WHERE client_id = {websiteId:String}
							AND anonymous_id != ''
						GROUP BY anonymous_id
					),
					revenue_with_context AS (
						SELECT 
							r.transaction_id,
							r.amount,
							r.type,
							r.anonymous_id,
							ft.first_browser as browser_name
						FROM ${Analytics.revenue} r
						LEFT JOIN first_touch ft ON r.anonymous_id = ft.anonymous_id
						WHERE 
							(r.owner_id = {websiteId:String} OR r.website_id = {websiteId:String})
							AND r.created >= toDateTime({startDate:String})
							AND r.created <= toDateTime(concat({endDate:String}, ' 23:59:59'))
					)
					SELECT 
						coalesce(nullIf(browser_name, ''), 'Unknown') as name,
						sumIf(amount, type != 'refund') as revenue,
						countIf(type != 'refund') as transactions,
						uniq(anonymous_id) as customers,
						ROUND((sumIf(amount, type != 'refund') / nullIf(SUM(sumIf(amount, type != 'refund')) OVER(), 0)) * 100, 2) as percentage
					FROM revenue_with_context
					GROUP BY name
					ORDER BY revenue DESC
					LIMIT {limit:UInt32}
				`,
				params: { websiteId, startDate, endDate, limit },
			};
		},
		timeField: "created",
		customizable: true,
	},

	revenue_by_device: {
		customSql: (
			websiteId: string,
			startDate: string,
			endDate: string,
			_filters?: Filter[],
			_granularity?: TimeUnit,
			_limit?: number
		) => {
			const limit = _limit ?? 10;
			return {
				sql: `
					WITH first_touch AS (
						SELECT 
							anonymous_id,
							argMin(device_type, time) as first_device
						FROM ${Analytics.events}
						WHERE client_id = {websiteId:String}
							AND anonymous_id != ''
						GROUP BY anonymous_id
					),
					revenue_with_context AS (
						SELECT 
							r.transaction_id,
							r.amount,
							r.type,
							r.anonymous_id,
							ft.first_device as device_type
						FROM ${Analytics.revenue} r
						LEFT JOIN first_touch ft ON r.anonymous_id = ft.anonymous_id
						WHERE 
							(r.owner_id = {websiteId:String} OR r.website_id = {websiteId:String})
							AND r.created >= toDateTime({startDate:String})
							AND r.created <= toDateTime(concat({endDate:String}, ' 23:59:59'))
					)
					SELECT 
						coalesce(nullIf(device_type, ''), 'Unknown') as name,
						sumIf(amount, type != 'refund') as revenue,
						countIf(type != 'refund') as transactions,
						uniq(anonymous_id) as customers,
						ROUND((sumIf(amount, type != 'refund') / nullIf(SUM(sumIf(amount, type != 'refund')) OVER(), 0)) * 100, 2) as percentage
					FROM revenue_with_context
					GROUP BY name
					ORDER BY revenue DESC
					LIMIT {limit:UInt32}
				`,
				params: { websiteId, startDate, endDate, limit },
			};
		},
		timeField: "created",
		customizable: true,
	},

	revenue_by_referrer: {
		customSql: (
			websiteId: string,
			startDate: string,
			endDate: string,
			_filters?: Filter[],
			_granularity?: TimeUnit,
			_limit?: number
		) => {
			const limit = _limit ?? 20;
			return {
				sql: `
					WITH first_touch AS (
						SELECT 
							anonymous_id,
							argMin(domain(referrer), time) as first_referrer
						FROM ${Analytics.events}
						WHERE client_id = {websiteId:String}
							AND anonymous_id != ''
						GROUP BY anonymous_id
					),
					revenue_with_context AS (
						SELECT 
							r.transaction_id,
							r.amount,
							r.type,
							r.anonymous_id,
							ft.first_referrer as referrer_domain
						FROM ${Analytics.revenue} r
						LEFT JOIN first_touch ft ON r.anonymous_id = ft.anonymous_id
						WHERE 
							(r.owner_id = {websiteId:String} OR r.website_id = {websiteId:String})
							AND r.created >= toDateTime({startDate:String})
							AND r.created <= toDateTime(concat({endDate:String}, ' 23:59:59'))
					)
					SELECT 
						coalesce(nullIf(referrer_domain, ''), 'Direct') as name,
						sumIf(amount, type != 'refund') as revenue,
						countIf(type != 'refund') as transactions,
						uniq(anonymous_id) as customers,
						ROUND((sumIf(amount, type != 'refund') / nullIf(SUM(sumIf(amount, type != 'refund')) OVER(), 0)) * 100, 2) as percentage
					FROM revenue_with_context
					GROUP BY name
					ORDER BY revenue DESC
					LIMIT {limit:UInt32}
				`,
				params: { websiteId, startDate, endDate, limit },
			};
		},
		timeField: "created",
		customizable: true,
	},

	revenue_by_utm_source: {
		customSql: (
			websiteId: string,
			startDate: string,
			endDate: string,
			_filters?: Filter[],
			_granularity?: TimeUnit,
			_limit?: number
		) => {
			const limit = _limit ?? 20;
			return {
				sql: `
					WITH first_touch AS (
						SELECT 
							anonymous_id,
							argMin(utm_source, time) as first_utm_source
						FROM ${Analytics.events}
						WHERE client_id = {websiteId:String}
							AND anonymous_id != ''
						GROUP BY anonymous_id
					),
					revenue_with_context AS (
						SELECT 
							r.transaction_id,
							r.amount,
							r.type,
							r.anonymous_id,
							ft.first_utm_source as utm_source
						FROM ${Analytics.revenue} r
						LEFT JOIN first_touch ft ON r.anonymous_id = ft.anonymous_id
						WHERE 
							(r.owner_id = {websiteId:String} OR r.website_id = {websiteId:String})
							AND r.created >= toDateTime({startDate:String})
							AND r.created <= toDateTime(concat({endDate:String}, ' 23:59:59'))
					)
					SELECT 
						coalesce(nullIf(utm_source, ''), 'None') as name,
						sumIf(amount, type != 'refund') as revenue,
						countIf(type != 'refund') as transactions,
						uniq(anonymous_id) as customers,
						ROUND((sumIf(amount, type != 'refund') / nullIf(SUM(sumIf(amount, type != 'refund')) OVER(), 0)) * 100, 2) as percentage
					FROM revenue_with_context
					GROUP BY name
					ORDER BY revenue DESC
					LIMIT {limit:UInt32}
				`,
				params: { websiteId, startDate, endDate, limit },
			};
		},
		timeField: "created",
		customizable: true,
	},

	revenue_by_utm_campaign: {
		customSql: (
			websiteId: string,
			startDate: string,
			endDate: string,
			_filters?: Filter[],
			_granularity?: TimeUnit,
			_limit?: number
		) => {
			const limit = _limit ?? 20;
			return {
				sql: `
					WITH first_touch AS (
						SELECT 
							anonymous_id,
							argMin(utm_campaign, time) as first_utm_campaign
						FROM ${Analytics.events}
						WHERE client_id = {websiteId:String}
							AND anonymous_id != ''
						GROUP BY anonymous_id
					),
					revenue_with_context AS (
						SELECT 
							r.transaction_id,
							r.amount,
							r.type,
							r.anonymous_id,
							ft.first_utm_campaign as utm_campaign
						FROM ${Analytics.revenue} r
						LEFT JOIN first_touch ft ON r.anonymous_id = ft.anonymous_id
						WHERE 
							(r.owner_id = {websiteId:String} OR r.website_id = {websiteId:String})
							AND r.created >= toDateTime({startDate:String})
							AND r.created <= toDateTime(concat({endDate:String}, ' 23:59:59'))
					)
					SELECT 
						coalesce(nullIf(utm_campaign, ''), 'None') as name,
						sumIf(amount, type != 'refund') as revenue,
						countIf(type != 'refund') as transactions,
						uniq(anonymous_id) as customers,
						ROUND((sumIf(amount, type != 'refund') / nullIf(SUM(sumIf(amount, type != 'refund')) OVER(), 0)) * 100, 2) as percentage
					FROM revenue_with_context
					GROUP BY name
					ORDER BY revenue DESC
					LIMIT {limit:UInt32}
				`,
				params: { websiteId, startDate, endDate, limit },
			};
		},
		timeField: "created",
		customizable: true,
	},

	recent_transactions: {
		customSql: (
			websiteId: string,
			startDate: string,
			endDate: string,
			_filters?: Filter[],
			_granularity?: TimeUnit,
			_limit?: number
		) => {
			const limit = _limit ?? 50;
			return {
				sql: `
					WITH first_touch AS (
						SELECT 
							anonymous_id,
							argMin(country, time) as first_country,
							argMin(browser_name, time) as first_browser,
							argMin(device_type, time) as first_device,
							argMin(domain(referrer), time) as first_referrer
						FROM ${Analytics.events}
						WHERE client_id = {websiteId:String}
							AND anonymous_id != ''
						GROUP BY anonymous_id
					)
					SELECT 
						r.transaction_id,
						r.provider,
						r.type,
						r.status,
						r.amount,
						r.currency,
						r.product_name,
						r.created,
						r.anonymous_id,
						ft.first_country as country,
						ft.first_browser as browser_name,
						ft.first_device as device_type,
						ft.first_referrer as referrer
					FROM ${Analytics.revenue} r
					LEFT JOIN first_touch ft ON r.anonymous_id = ft.anonymous_id
					WHERE 
						(r.owner_id = {websiteId:String} OR r.website_id = {websiteId:String})
						AND r.created >= toDateTime({startDate:String})
						AND r.created <= toDateTime(concat({endDate:String}, ' 23:59:59'))
						AND r.type != 'refund'
					ORDER BY r.created DESC
					LIMIT {limit:UInt32}
				`,
				params: { websiteId, startDate, endDate, limit },
			};
		},
		timeField: "created",
		customizable: true,
		plugins: {
			normalizeGeo: true,
		},
	},
};
