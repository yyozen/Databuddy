"use client";

import {
	ArrowClockwiseIcon,
	CheckCircleIcon,
	CodeIcon,
	GearIcon,
	PaperPlaneTiltIcon,
	StackIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	testBatchEventsAction,
	testBatchingBehaviorAction,
	testDeduplicationAction,
	testMiddlewareAction,
	testTrackEventAction,
	testWithGlobalPropertiesAction,
} from "./actions";

interface TestResult {
	success: boolean;
	data?: unknown;
	error?: string;
	logs?: string[];
	timestamp: number;
}

export default function SandboxPage() {
	// SDK Configuration
	const [apiKey, setApiKey] = useState("");
	const [websiteId, setWebsiteId] = useState(
		"5ced32e5-0219-4e75-a18a-ad9826f85698"
	);
	const [source, setSource] = useState("sandbox");
	const [apiUrl, setApiUrl] = useState("http://localhost:4000");
	const [batchSize, setBatchSize] = useState("5");
	const [enableDeduplication, setEnableDeduplication] = useState(true);

	// Event Configuration
	const [eventName, setEventName] = useState("sandbox_test_event");
	const [eventId, setEventId] = useState("");
	const [eventProperties, setEventProperties] = useState(
		'{\n  "test": true,\n  "environment": "sandbox"\n}'
	);

	// Global Properties
	const [globalProperties, setGlobalProperties] = useState(
		'{\n  "app_version": "1.0.0",\n  "platform": "web"\n}'
	);

	// Batch Events
	const [batchEvents, setBatchEvents] = useState(
		'[\n  { "name": "batch_event_1", "properties": { "index": 1 } },\n  { "name": "batch_event_2", "properties": { "index": 2 } },\n  { "name": "batch_event_3", "properties": { "index": 3 } }\n]'
	);

	// Middleware
	const [middlewareAction, setMiddlewareAction] = useState<
		"enrich" | "drop" | "transform"
	>("enrich");

	// Deduplication
	const [deduplicationSendCount, setDeduplicationSendCount] = useState("3");

	// Results
	const [results, setResults] = useState<TestResult[]>([]);
	const [isLoading, setIsLoading] = useState<string | null>(null);

	const config = {
		apiKey,
		websiteId: websiteId || undefined,
		source: source || undefined,
		apiUrl: apiUrl || undefined,
		batchSize: Number.parseInt(batchSize, 10) || 5,
		enableDeduplication,
	};

	const addResult = (result: Omit<TestResult, "timestamp">) => {
		setResults((prev) => [{ ...result, timestamp: Date.now() }, ...prev]);
	};

	const parseJson = (json: string, defaultValue: unknown): unknown => {
		try {
			return JSON.parse(json);
		} catch {
			return defaultValue;
		}
	};

	const handleTrackEvent = async () => {
		setIsLoading("track");
		const result = await testTrackEventAction(config, {
			name: eventName,
			eventId: eventId || undefined,
			properties: parseJson(eventProperties, {}) as Record<string, unknown>,
		});
		addResult(result);
		setIsLoading(null);
	};

	const handleBatchEvents = async () => {
		setIsLoading("batch");
		const events = parseJson(batchEvents, []) as Array<{
			name: string;
			eventId?: string;
			properties?: Record<string, unknown>;
		}>;
		const result = await testBatchEventsAction(config, events);
		addResult(result);
		setIsLoading(null);
	};

	const handleGlobalProperties = async () => {
		setIsLoading("global");
		const globals = parseJson(globalProperties, {}) as Record<string, unknown>;
		const result = await testWithGlobalPropertiesAction(config, globals, {
			name: eventName,
			eventId: eventId || undefined,
			properties: parseJson(eventProperties, {}) as Record<string, unknown>,
		});
		addResult(result);
		setIsLoading(null);
	};

	const handleMiddleware = async () => {
		setIsLoading("middleware");
		const result = await testMiddlewareAction(
			config,
			{
				name: eventName,
				eventId: eventId || undefined,
				properties: parseJson(eventProperties, {}) as Record<string, unknown>,
			},
			middlewareAction
		);
		addResult(result);
		setIsLoading(null);
	};

	const handleDeduplication = async () => {
		setIsLoading("dedup");
		const result = await testDeduplicationAction(
			config,
			{
				name: eventName,
				eventId: eventId || `dedup_test_${Date.now()}`,
				properties: parseJson(eventProperties, {}) as Record<string, unknown>,
			},
			Number.parseInt(deduplicationSendCount, 10) || 3
		);
		addResult(result);
		setIsLoading(null);
	};

	const handleBatchingBehavior = async () => {
		setIsLoading("batching");
		const events = parseJson(batchEvents, []) as Array<{
			name: string;
			eventId?: string;
			properties?: Record<string, unknown>;
		}>;
		const result = await testBatchingBehaviorAction(config, events);
		addResult(result);
		setIsLoading(null);
	};

	const clearResults = () => setResults([]);

	return (
		<div className="container mx-auto max-w-7xl p-6">
			<div className="mb-8">
				<h1 className="font-bold text-3xl">Node SDK Sandbox</h1>
				<p className="mt-2 text-muted-foreground">
					Test and debug the server-side Databuddy Node SDK
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Configuration */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<GearIcon className="size-5" weight="duotone" />
							SDK Configuration
						</CardTitle>
						<CardDescription>
							Configure the SDK settings for testing
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label className="font-medium text-sm" htmlFor="apiKey">
								API Key
							</label>
							<Input
								id="apiKey"
								onChange={(e) => setApiKey(e.target.value)}
								placeholder="dbdy_live_xxx..."
								value={apiKey}
							/>
						</div>
						<div className="space-y-2">
							<label className="font-medium text-sm" htmlFor="websiteId">
								Website ID
							</label>
							<Input
								id="websiteId"
								onChange={(e) => setWebsiteId(e.target.value)}
								placeholder="UUID..."
								value={websiteId}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<label className="font-medium text-sm" htmlFor="source">
									Source
								</label>
								<Input
									id="source"
									onChange={(e) => setSource(e.target.value)}
									placeholder="backend, cli, api..."
									value={source}
								/>
							</div>
							<div className="space-y-2">
								<label className="font-medium text-sm" htmlFor="batchSize">
									Batch Size
								</label>
								<Input
									id="batchSize"
									onChange={(e) => setBatchSize(e.target.value)}
									placeholder="5"
									type="number"
									value={batchSize}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<label className="font-medium text-sm" htmlFor="apiUrl">
								API URL
							</label>
							<Input
								id="apiUrl"
								onChange={(e) => setApiUrl(e.target.value)}
								placeholder="http://localhost:4000"
								value={apiUrl}
							/>
						</div>
						<div className="flex items-center gap-2">
							<input
								checked={enableDeduplication}
								className="size-4 rounded border"
								id="enableDeduplication"
								onChange={(e) => setEnableDeduplication(e.target.checked)}
								type="checkbox"
							/>
							<label className="text-sm" htmlFor="enableDeduplication">
								Enable Deduplication
							</label>
						</div>
					</CardContent>
				</Card>

				{/* Event Configuration */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CodeIcon className="size-5" weight="duotone" />
							Event Configuration
						</CardTitle>
						<CardDescription>
							Configure the event data for testing
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<label className="font-medium text-sm" htmlFor="eventName">
									Event Name
								</label>
								<Input
									id="eventName"
									onChange={(e) => setEventName(e.target.value)}
									placeholder="event_name"
									value={eventName}
								/>
							</div>
							<div className="space-y-2">
								<label className="font-medium text-sm" htmlFor="eventId">
									Event ID (optional)
								</label>
								<Input
									id="eventId"
									onChange={(e) => setEventId(e.target.value)}
									placeholder="unique_id"
									value={eventId}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<label className="font-medium text-sm" htmlFor="eventProperties">
								Properties (JSON)
							</label>
							<Textarea
								className="font-mono text-xs"
								id="eventProperties"
								minRows={4}
								onChange={(e) => setEventProperties(e.target.value)}
								value={eventProperties}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Test Actions */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<PaperPlaneTiltIcon className="size-5" weight="duotone" />
							Test Actions
						</CardTitle>
						<CardDescription>
							Run different tests against the SDK
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{/* Single Event */}
							<div className="space-y-3 rounded border p-4">
								<h3 className="font-semibold text-sm">Track Single Event</h3>
								<p className="text-muted-foreground text-xs">
									Send a single event using track()
								</p>
								<Button
									className="w-full"
									disabled={isLoading !== null}
									onClick={handleTrackEvent}
								>
									{isLoading === "track" ? (
										<ArrowClockwiseIcon className="animate-spin" />
									) : (
										<PaperPlaneTiltIcon weight="fill" />
									)}
									Track Event
								</Button>
							</div>

							{/* Batch Events */}
							<div className="space-y-3 rounded border p-4">
								<h3 className="font-semibold text-sm">Batch Events</h3>
								<p className="text-muted-foreground text-xs">
									Send multiple events using batch()
								</p>
								<Textarea
									className="font-mono text-xs"
									minRows={3}
									onChange={(e) => setBatchEvents(e.target.value)}
									value={batchEvents}
								/>
								<Button
									className="w-full"
									disabled={isLoading !== null}
									onClick={handleBatchEvents}
								>
									{isLoading === "batch" ? (
										<ArrowClockwiseIcon className="animate-spin" />
									) : (
										<StackIcon weight="duotone" />
									)}
									Batch Events
								</Button>
							</div>

							{/* Global Properties */}
							<div className="space-y-3 rounded border p-4">
								<h3 className="font-semibold text-sm">Global Properties</h3>
								<p className="text-muted-foreground text-xs">
									Test setGlobalProperties()
								</p>
								<Textarea
									className="font-mono text-xs"
									minRows={3}
									onChange={(e) => setGlobalProperties(e.target.value)}
									value={globalProperties}
								/>
								<Button
									className="w-full"
									disabled={isLoading !== null}
									onClick={handleGlobalProperties}
								>
									{isLoading === "global" ? (
										<ArrowClockwiseIcon className="animate-spin" />
									) : (
										<GearIcon weight="duotone" />
									)}
									Test Global Props
								</Button>
							</div>

							{/* Middleware */}
							<div className="space-y-3 rounded border p-4">
								<h3 className="font-semibold text-sm">Middleware</h3>
								<p className="text-muted-foreground text-xs">
									Test middleware transformations
								</p>
								<select
									className="h-9 w-full rounded border bg-background px-3 text-sm"
									onChange={(e) =>
										setMiddlewareAction(
											e.target.value as "enrich" | "drop" | "transform"
										)
									}
									value={middlewareAction}
								>
									<option value="enrich">Enrich (add properties)</option>
									<option value="transform">Transform (rename event)</option>
									<option value="drop">Drop (return null)</option>
								</select>
								<Button
									className="w-full"
									disabled={isLoading !== null}
									onClick={handleMiddleware}
								>
									{isLoading === "middleware" ? (
										<ArrowClockwiseIcon className="animate-spin" />
									) : (
										<CodeIcon weight="duotone" />
									)}
									Test Middleware
								</Button>
							</div>

							{/* Deduplication */}
							<div className="space-y-3 rounded border p-4">
								<h3 className="font-semibold text-sm">Deduplication</h3>
								<p className="text-muted-foreground text-xs">
									Send same eventId multiple times
								</p>
								<Input
									onChange={(e) => setDeduplicationSendCount(e.target.value)}
									placeholder="Send count"
									type="number"
									value={deduplicationSendCount}
								/>
								<Button
									className="w-full"
									disabled={isLoading !== null}
									onClick={handleDeduplication}
								>
									{isLoading === "dedup" ? (
										<ArrowClockwiseIcon className="animate-spin" />
									) : (
										<ArrowClockwiseIcon weight="duotone" />
									)}
									Test Deduplication
								</Button>
							</div>

							{/* Batching Behavior */}
							<div className="space-y-3 rounded border p-4">
								<h3 className="font-semibold text-sm">Batching Behavior</h3>
								<p className="text-muted-foreground text-xs">
									Test auto-batching with flush()
								</p>
								<Button
									className="w-full"
									disabled={isLoading !== null}
									onClick={handleBatchingBehavior}
								>
									{isLoading === "batching" ? (
										<ArrowClockwiseIcon className="animate-spin" />
									) : (
										<StackIcon weight="duotone" />
									)}
									Test Batching
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Results */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Test Results</CardTitle>
								<CardDescription>
									{results.length} result{results.length !== 1 ? "s" : ""}
								</CardDescription>
							</div>
							{results.length > 0 && (
								<Button onClick={clearResults} size="sm" variant="outline">
									Clear Results
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent>
						{results.length === 0 ? (
							<div className="py-8 text-center text-muted-foreground">
								No test results yet. Run a test above to see results here.
							</div>
						) : (
							<div className="space-y-4">
								{results.map((result) => (
									<div
										className="rounded border bg-muted/30 p-4"
										key={result.timestamp}
									>
										<div className="mb-3 flex items-center justify-between">
											<div className="flex items-center gap-2">
												{result.success ? (
													<CheckCircleIcon
														className="size-5 text-green-500"
														weight="fill"
													/>
												) : (
													<WarningCircleIcon
														className="size-5 text-red-500"
														weight="fill"
													/>
												)}
												<span className="font-medium text-sm">
													{result.success ? "Success" : "Failed"}
												</span>
											</div>
											<span className="text-muted-foreground text-xs">
												{new Date(result.timestamp).toLocaleTimeString()}
											</span>
										</div>

										{result.error && (
											<div className="mb-3 rounded bg-red-500/10 p-2 text-red-500 text-sm">
												{result.error}
											</div>
										)}

										{result.logs && result.logs.length > 0 && (
											<div className="mb-3">
												<h4 className="mb-2 font-medium text-muted-foreground text-xs uppercase">
													Logs
												</h4>
												<div className="max-h-40 overflow-auto rounded bg-black/80 p-3 font-mono text-green-400 text-xs">
													{result.logs.map((log, i) => (
														<div className="whitespace-pre-wrap" key={i}>
															{log}
														</div>
													))}
												</div>
											</div>
										)}

										{result.data !== undefined && (
											<div>
												<h4 className="mb-2 font-medium text-muted-foreground text-xs uppercase">
													Response Data
												</h4>
												<pre className="max-h-40 overflow-auto rounded bg-muted p-3 font-mono text-xs">
													{JSON.stringify(result.data, null, 2)}
												</pre>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
