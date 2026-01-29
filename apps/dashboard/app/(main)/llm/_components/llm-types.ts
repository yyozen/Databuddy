export interface LLMKpiData {
	total_calls: number;
	total_cost: number;
	total_tokens: number;
	total_input_tokens: number;
	total_output_tokens: number;
	avg_duration_ms: number;
	p75_duration_ms: number;
	error_count: number;
	error_rate: number;
	cache_hit_rate: number;
	tool_use_rate: number;
	web_search_rate: number;
}

export interface LLMTimeSeriesData {
	date: string;
	total_calls: number;
	total_cost: number;
	total_tokens: number;
	avg_duration_ms: number;
	p75_duration_ms: number;
}

export interface LLMModelData {
	name: string;
	model: string;
	provider: string;
	calls: number;
	total_cost: number;
	total_tokens: number;
	avg_duration_ms: number;
	p75_duration_ms: number;
	error_rate: number;
}

export interface LLMToolData {
	name: string;
	tool_name: string;
	calls: number;
}

export interface LLMErrorSeriesData {
	date: string;
	error_count: number;
	error_rate: number;
}

export interface LLMErrorBreakdownData {
	name: string;
	error_name: string;
	sample_message: string;
	error_count: number;
}

export interface LLMHttpStatusData {
	name: string;
	http_status: number;
	calls: number;
}

export interface LLMRecentErrorData {
	name: string;
	timestamp: string;
	error_name: string;
	error_message: string;
	error_stack?: string;
	model: string;
	provider: string;
	http_status?: number;
	duration_ms: number;
}

export function formatCurrency(value: number | null | undefined): string {
	if (value === null || value === undefined) {
		return "$0.00";
	}
	if (value < 0.01 && value > 0) {
		return `$${value.toFixed(4)}`;
	}
	return `$${value.toFixed(2)}`;
}

export function formatNumber(value: number | null | undefined): string {
	if (value === null || value === undefined) {
		return "0";
	}
	return Intl.NumberFormat(undefined, {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(value);
}

export function formatDuration(ms: number | null | undefined): string {
	if (ms === null || ms === undefined || ms === 0) {
		return "0ms";
	}
	if (ms < 1000) {
		return `${Math.round(ms)}ms`;
	}
	return `${(ms / 1000).toFixed(1)}s`;
}

export function formatPercentage(value: number | null | undefined): string {
	if (value === null || value === undefined) {
		return "0%";
	}
	return `${(value * 100).toFixed(1)}%`;
}
