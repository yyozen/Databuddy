import type { DateRange } from "@databuddy/shared/types/analytics";
import type { BatchQueryResponse } from "@databuddy/shared/types/api";
import type { UseQueryOptions } from "@tanstack/react-query";
import { useBatchDynamicQuery } from "@/hooks/use-dynamic-query";

interface QueryOptions {
	websiteId?: string;
	organizationId?: string;
}

export function useGlobalCustomEventsData(
	queryOptions: QueryOptions,
	dateRange: DateRange,
	options?: Partial<UseQueryOptions<BatchQueryResponse>>
) {
	return useBatchDynamicQuery(
		queryOptions,
		dateRange,
		[
			{
				id: "custom_events_summary",
				parameters: ["custom_events_summary"],
			},
			{ id: "custom_events", parameters: ["custom_events"] },
			{
				id: "custom_events_trends",
				parameters: ["custom_events_trends"],
			},
			{
				id: "custom_events_property_classification",
				parameters: ["custom_events_property_classification"],
				limit: 500,
			},
			{
				id: "custom_events_property_distribution",
				parameters: ["custom_events_property_distribution"],
				limit: 500,
			},
			{
				id: "custom_events_property_top_values",
				parameters: ["custom_events_property_top_values"],
				limit: 100,
			},
		],
		options
	);
}
