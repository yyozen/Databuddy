"use server";

import { type BatchEventInput, Databuddy } from "@databuddy/sdk/node";

interface SdkConfig {
	apiKey: string;
	websiteId?: string;
	source?: string;
	apiUrl?: string;
	enableBatching?: boolean;
	batchSize?: number;
	enableDeduplication?: boolean;
}

interface TrackEventInput {
	name: string;
	eventId?: string;
	properties?: Record<string, unknown>;
}

interface ActionResult {
	success: boolean;
	data?: unknown;
	error?: string;
	logs?: string[];
}

// Custom logger that captures logs
function createCapturingLogger() {
	const logs: string[] = [];

	return {
		logs,
		logger: {
			debug: (message: string, data?: unknown) => {
				logs.push(`[DEBUG] ${message} ${data ? JSON.stringify(data) : ""}`);
			},
			info: (message: string, data?: unknown) => {
				logs.push(`[INFO] ${message} ${data ? JSON.stringify(data) : ""}`);
			},
			warn: (message: string, data?: unknown) => {
				logs.push(`[WARN] ${message} ${data ? JSON.stringify(data) : ""}`);
			},
			error: (message: string, data?: unknown) => {
				logs.push(`[ERROR] ${message} ${data ? JSON.stringify(data) : ""}`);
			},
		},
	};
}

export async function testTrackEventAction(
	config: SdkConfig,
	event: TrackEventInput
): Promise<ActionResult> {
	try {
		const { logs, logger } = createCapturingLogger();

		const client = new Databuddy({
			apiKey: config.apiKey,
			websiteId: config.websiteId || undefined,
			source: config.source || undefined,
			apiUrl: config.apiUrl || "http://localhost:4000",
			enableBatching: config.enableBatching ?? false,
			batchSize: config.batchSize,
			enableDeduplication: config.enableDeduplication ?? true,
			logger,
		});

		const result = await client.track({
			name: event.name,
			eventId: event.eventId,
			properties: event.properties,
		});

		// Flush to ensure events are sent
		await client.flush();

		return {
			success: result.success,
			data: result,
			logs,
			error: result.error,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function testBatchEventsAction(
	config: SdkConfig,
	events: TrackEventInput[]
): Promise<ActionResult> {
	try {
		const { logs, logger } = createCapturingLogger();

		const client = new Databuddy({
			apiKey: config.apiKey,
			websiteId: config.websiteId || undefined,
			source: config.source || undefined,
			apiUrl: config.apiUrl || "http://localhost:4000",
			enableBatching: false,
			enableDeduplication: config.enableDeduplication ?? true,
			logger,
		});

		const batchEvents: BatchEventInput[] = events.map((e) => ({
			type: "custom" as const,
			name: e.name,
			eventId: e.eventId,
			properties: e.properties,
		}));

		const result = await client.batch(batchEvents);

		return {
			success: result.success,
			data: result,
			logs,
			error: result.error,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function testWithGlobalPropertiesAction(
	config: SdkConfig,
	globalProps: Record<string, unknown>,
	event: TrackEventInput
): Promise<ActionResult> {
	try {
		const { logs, logger } = createCapturingLogger();

		const client = new Databuddy({
			apiKey: config.apiKey,
			websiteId: config.websiteId || undefined,
			source: config.source || undefined,
			apiUrl: config.apiUrl || "http://localhost:4000",
			enableBatching: false,
			enableDeduplication: config.enableDeduplication ?? true,
			logger,
		});

		client.setGlobalProperties(globalProps);
		logs.push(`[TEST] Set global properties: ${JSON.stringify(globalProps)}`);

		const result = await client.track({
			name: event.name,
			eventId: event.eventId,
			properties: event.properties,
		});

		return {
			success: result.success,
			data: {
				...result,
				globalProperties: client.getGlobalProperties(),
			},
			logs,
			error: result.error,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function testMiddlewareAction(
	config: SdkConfig,
	event: TrackEventInput,
	middlewareAction: "enrich" | "drop" | "transform"
): Promise<ActionResult> {
	try {
		const { logs, logger } = createCapturingLogger();

		const client = new Databuddy({
			apiKey: config.apiKey,
			websiteId: config.websiteId || undefined,
			source: config.source || undefined,
			apiUrl: config.apiUrl || "http://localhost:4000",
			enableBatching: false,
			enableDeduplication: config.enableDeduplication ?? true,
			logger,
		});

		if (middlewareAction === "enrich") {
			client.addMiddleware((e) => {
				logs.push(
					"[MIDDLEWARE] Enriching event with timestamp and server flag"
				);
				return {
					...e,
					properties: {
						...e.properties,
						enrichedAt: Date.now(),
						processedByMiddleware: true,
					},
				};
			});
		} else if (middlewareAction === "drop") {
			client.addMiddleware((e) => {
				logs.push(`[MIDDLEWARE] Dropping event: ${e.name}`);
				return null;
			});
		} else if (middlewareAction === "transform") {
			client.addMiddleware((e) => {
				logs.push(`[MIDDLEWARE] Transforming event name from ${e.name}`);
				return {
					...e,
					name: `transformed_${e.name}`,
				};
			});
		}

		const result = await client.track({
			name: event.name,
			eventId: event.eventId,
			properties: event.properties,
		});

		return {
			success: result.success,
			data: result,
			logs,
			error: result.error,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function testDeduplicationAction(
	config: SdkConfig,
	event: TrackEventInput,
	sendCount: number
): Promise<ActionResult> {
	try {
		const { logs, logger } = createCapturingLogger();

		const client = new Databuddy({
			apiKey: config.apiKey,
			websiteId: config.websiteId || undefined,
			source: config.source || undefined,
			apiUrl: config.apiUrl || "http://localhost:4000",
			enableBatching: false,
			enableDeduplication: true,
			logger,
		});

		const results: Array<{ success: boolean; eventId?: string; error?: string }> = [];
		for (let i = 0; i < sendCount; i++) {
			logs.push(`[TEST] Sending event attempt ${i + 1}/${sendCount}`);
			const result = await client.track({
				name: event.name,
				eventId: event.eventId,
				properties: event.properties,
			});
			results.push(result);
		}

		logs.push(
			`[TEST] Deduplication cache size: ${client.getDeduplicationCacheSize()}`
		);

		return {
			success: true,
			data: {
				attempts: sendCount,
				results,
				cacheSize: client.getDeduplicationCacheSize(),
			},
			logs,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function testBatchingBehaviorAction(
	config: SdkConfig,
	events: TrackEventInput[]
): Promise<ActionResult> {
	try {
		const { logs, logger } = createCapturingLogger();

		const client = new Databuddy({
			apiKey: config.apiKey,
			websiteId: config.websiteId || undefined,
			source: config.source || undefined,
			apiUrl: config.apiUrl || "http://localhost:4000",
			enableBatching: true,
			batchSize: config.batchSize ?? 5,
			batchTimeout: 1000,
			enableDeduplication: config.enableDeduplication ?? true,
			logger,
		});

		logs.push(
			`[TEST] Starting batching test with ${events.length} events, batch size: ${config.batchSize ?? 5}`
		);

		const results: Array<{ success: boolean; eventId?: string; error?: string }> = [];
		for (const event of events) {
			const result = await client.track({
				name: event.name,
				eventId: event.eventId,
				properties: event.properties,
			});
			results.push(result);
		}

		logs.push("[TEST] All events queued, calling flush...");
		const flushResult = await client.flush();
		logs.push(`[TEST] Flush complete: ${JSON.stringify(flushResult)}`);

		return {
			success: true,
			data: {
				trackResults: results,
				flushResult,
			},
			logs,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
