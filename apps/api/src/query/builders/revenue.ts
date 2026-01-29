import { Analytics } from "../../types/tables";
import type { SimpleQueryConfig } from "../types";

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
					countIf(type = 'sale') as sale_count
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
					countIf(type != 'refund') as transactions
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
					countIf(type != 'refund') as transactions
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
			_filters?,
			_granularity?,
			_limit?: number
		) => {
			const limit = _limit ?? 50;
			return {
				sql: `
					SELECT 
						coalesce(product_name, 'Unknown') as name,
						product_id,
						sumIf(amount, type != 'refund') as revenue,
						countIf(type != 'refund') as transactions
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

	recent_transactions: {
		customSql: (
			websiteId: string,
			startDate: string,
			endDate: string,
			_filters?,
			_granularity?,
			_limit?: number
		) => {
			const limit = _limit ?? 50;
			return {
				sql: `
					SELECT 
						transaction_id,
						provider,
						type,
						status,
						amount,
						currency,
						product_name,
						created
					FROM ${Analytics.revenue}
					WHERE 
						(owner_id = {websiteId:String} OR website_id = {websiteId:String})
						AND created >= toDateTime({startDate:String})
						AND created <= toDateTime(concat({endDate:String}, ' 23:59:59'))
						AND type != 'refund'
					ORDER BY created DESC
					LIMIT {limit:UInt32}
				`,
				params: { websiteId, startDate, endDate, limit },
			};
		},
		timeField: "created",
		customizable: true,
	},
};
