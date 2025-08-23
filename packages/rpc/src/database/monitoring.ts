import { Client } from 'pg';

export interface DatabaseStats {
	// Database info
	databaseName: string;
	databaseSize: string;

	// Connection info
	maxConnections: number;
	activeConnections: number;

	// Activity stats
	totalQueries: number;
	totalInserts: number;
	totalUpdates: number;
	totalDeletes: number;

	// Performance metrics
	hitRatio: number; // Cache hit ratio percentage
	indexUsage: number; // Index usage percentage
}

export interface TableStats {
	tableName: string;
	schemaName: string;
	rowCount: number;
	totalSize: string;
	indexSize: string;
	lastVacuum?: string;
	lastAnalyze?: string;
	sequentialScans: number;
	indexScans: number;
	deadTuples: number;
}

export interface ExtensionInfo {
	name: string;
	version: string;
	schema: string;
	description: string;
	installed: boolean;
}

export interface AvailableExtension {
	name: string;
	defaultVersion: string;
	description: string;
	comment: string;
}

/**
 * Get basic database statistics using a readonly connection
 */
export async function getDatabaseStats(
	connectionUrl: string
): Promise<DatabaseStats> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	try {
		await client.connect();

		// Get database basic info
		const dbInfoResult = await client.query(`
			SELECT 
				current_database() as database_name,
				pg_size_pretty(pg_database_size(current_database())) as database_size
		`);

		// Get connection stats
		const connectionResult = await client.query(`
			SELECT 
				setting as max_connections
			FROM pg_settings 
			WHERE name = 'max_connections'
		`);

		const activeConnectionsResult = await client.query(`
			SELECT count(*) as active_connections
			FROM pg_stat_activity
			WHERE state = 'active'
		`);

		// Get database activity stats
		const activityResult = await client.query(`
			SELECT 
				SUM(xact_commit + xact_rollback) as total_queries,
				SUM(tup_inserted) as total_inserts,
				SUM(tup_updated) as total_updates,
				SUM(tup_deleted) as total_deletes
			FROM pg_stat_database
			WHERE datname = current_database()
		`);

		// Get cache hit ratio
		const hitRatioResult = await client.query(`
			SELECT 
				ROUND(
					100.0 * SUM(blks_hit) / NULLIF(SUM(blks_hit + blks_read), 0), 
					2
				) as hit_ratio
			FROM pg_stat_database
			WHERE datname = current_database()
		`);

		// Get index usage ratio
		const indexUsageResult = await client.query(`
			SELECT 
				ROUND(
					100.0 * SUM(idx_scan) / NULLIF(SUM(seq_scan + idx_scan), 0), 
					2
				) as index_usage
			FROM pg_stat_user_tables
		`);

		const dbInfo = dbInfoResult.rows[0];
		const connectionInfo = connectionResult.rows[0];
		const activeConnections = activeConnectionsResult.rows[0];
		const activity = activityResult.rows[0];
		const hitRatio = hitRatioResult.rows[0];
		const indexUsage = indexUsageResult.rows[0];

		return {
			databaseName: dbInfo.database_name,
			databaseSize: dbInfo.database_size,
			maxConnections: Number.parseInt(connectionInfo.max_connections, 10),
			activeConnections: Number.parseInt(
				activeConnections.active_connections,
				10
			),
			totalQueries: Number.parseInt(activity.total_queries || '0', 10),
			totalInserts: Number.parseInt(activity.total_inserts || '0', 10),
			totalUpdates: Number.parseInt(activity.total_updates || '0', 10),
			totalDeletes: Number.parseInt(activity.total_deletes || '0', 10),
			hitRatio: Number.parseFloat(hitRatio.hit_ratio || '0'),
			indexUsage: Number.parseFloat(indexUsage.index_usage || '0'),
		};
	} finally {
		await client.end();
	}
}

/**
 * Get table statistics using a readonly connection
 */
export async function getTableStats(
	connectionUrl: string,
	limit?: number
): Promise<TableStats[]> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	try {
		await client.connect();

		const query = `
			SELECT 
				schemaname as schema_name,
				relname as table_name,
				n_live_tup as row_count,
				pg_size_pretty(pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(relname))) as total_size,
				pg_size_pretty(pg_indexes_size(quote_ident(schemaname)||'.'||quote_ident(relname))) as index_size,
				last_vacuum,
				last_analyze,
				seq_scan as sequential_scans,
				idx_scan as index_scans,
				n_dead_tup as dead_tuples
			FROM pg_stat_user_tables 
			ORDER BY pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(relname)) DESC
			${limit ? 'LIMIT $1' : ''}
		`;

		const result = limit
			? await client.query(query, [limit])
			: await client.query(query);

		return result.rows.map((row) => ({
			tableName: row.table_name,
			schemaName: row.schema_name,
			rowCount: Number.parseInt(row.row_count || '0', 10),
			totalSize: row.total_size,
			indexSize: row.index_size,
			lastVacuum: row.last_vacuum
				? new Date(row.last_vacuum).toISOString()
				: undefined,
			lastAnalyze: row.last_analyze
				? new Date(row.last_analyze).toISOString()
				: undefined,
			sequentialScans: Number.parseInt(row.sequential_scans || '0', 10),
			indexScans: Number.parseInt(row.index_scans || '0', 10),
			deadTuples: Number.parseInt(row.dead_tuples || '0', 10),
		}));
	} finally {
		await client.end();
	}
}

/**
 * Get PostgreSQL extensions information
 */
export async function getExtensions(
	connectionUrl: string
): Promise<ExtensionInfo[]> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	try {
		await client.connect();

		const result = await client.query(`
			SELECT 
				e.extname as name,
				e.extversion as version,
				n.nspname as schema,
				COALESCE(c.description, 'No description available') as description,
				true as installed
			FROM pg_extension e
			LEFT JOIN pg_namespace n ON n.oid = e.extnamespace
			LEFT JOIN pg_description c ON c.objoid = e.oid AND c.classoid = 'pg_extension'::regclass
			ORDER BY e.extname
		`);

		return result.rows.map((row) => ({
			name: row.name,
			version: row.version,
			schema: row.schema,
			description: row.description,
			installed: row.installed,
		}));
	} finally {
		await client.end();
	}
}

/**
 * Get available PostgreSQL extensions that can be installed
 */
export async function getAvailableExtensions(
	connectionUrl: string
): Promise<AvailableExtension[]> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	try {
		await client.connect();

		const result = await client.query(`
			SELECT 
				name,
				default_version,
				comment
			FROM pg_available_extensions
			WHERE name NOT IN (
				SELECT extname FROM pg_extension
			)
			ORDER BY name
		`);

		return result.rows.map((row) => ({
			name: row.name,
			defaultVersion: row.default_version,
			description: row.comment || 'No description available',
			comment: row.comment || '',
		}));
	} finally {
		await client.end();
	}
}

/**
 * Install a PostgreSQL extension
 */
export async function installExtension(
	connectionUrl: string,
	extensionName: string,
	schema?: string
): Promise<void> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	try {
		await client.connect();

		let query = `CREATE EXTENSION IF NOT EXISTS "${extensionName}"`;
		if (schema) {
			query += ` WITH SCHEMA "${schema}"`;
		}

		await client.query(query);
	} finally {
		await client.end();
	}
}

/**
 * Drop a PostgreSQL extension
 */
export async function dropExtension(
	connectionUrl: string,
	extensionName: string
): Promise<void> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	try {
		await client.connect();

		await client.query(`DROP EXTENSION IF EXISTS "${extensionName}"`);
	} finally {
		await client.end();
	}
}
