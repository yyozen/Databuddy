import { opentelemetry } from "@elysiajs/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { Elysia } from "elysia";
import { disconnectProducer } from "./lib/producer";
import { expiredRoute } from "./routes/expired";
import { redirectRoute } from "./routes/redirect";

const exporter = new OTLPTraceExporter({
	url: "https://api.axiom.co/v1/traces",
	headers: {
		Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
		"X-Axiom-Dataset": process.env.AXIOM_DATASET ?? "links",
	},
});

const batchSpanProcessor = new BatchSpanProcessor(exporter);

const app = new Elysia()
	.use(
		opentelemetry({
			spanProcessor: batchSpanProcessor,
			serviceName: "links",
		})
	)
	.get("/", () => ({ status: "ok" }))
	.get("/health", () => ({ status: "ok" }))
	.use(expiredRoute)
	.use(redirectRoute);

process.on("SIGTERM", async () => {
	console.log("SIGTERM received, shutting down gracefully...");
	await disconnectProducer();
	process.exit(0);
});

process.on("SIGINT", async () => {
	console.log("SIGINT received, shutting down gracefully...");
	await disconnectProducer();
	process.exit(0);
});

export default {
	port: 2500,
	fetch: app.fetch,
};
