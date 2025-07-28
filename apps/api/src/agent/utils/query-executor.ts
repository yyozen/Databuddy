import { chQuery } from '@databuddy/db';

export interface QueryResult {
	data: unknown[];
	executionTime: number;
	rowCount: number;
}

export async function executeQuery(sql: string): Promise<QueryResult> {
	const queryStart = Date.now();
	const result = await chQuery(sql);
	const queryTime = Date.now() - queryStart;

	return {
		data: result,
		executionTime: queryTime,
		rowCount: result.length,
	};
}
