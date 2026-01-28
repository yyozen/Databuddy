export interface DynamicQueryFilter {
	field: string;
	operator: string;
	value: string | number | boolean;
}

export interface DynamicQueryRequest {
	id: string;
	parameters: string[];
	filters?: DynamicQueryFilter[];
	limit?: number;
	page?: number;
	granularity?: string;
}

export interface ParameterResult {
	parameter: string;
	success: boolean;
	data: unknown[];
	error?: string;
}

export interface DynamicQueryResponse {
	success: boolean;
	queryId: string;
	data: ParameterResult[];
	meta: {
		parameters: string[];
		total_parameters: number;
		page: number;
		limit: number;
		filters_applied: number;
	};
}

export interface BatchQueryResponse {
	success: boolean;
	batch: true;
	results: DynamicQueryResponse[];
}
