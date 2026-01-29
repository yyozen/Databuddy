import { createHmac, timingSafeEqual } from "node:crypto";
import { clickHouse, db, eq, revenueConfig } from "@databuddy/db";
import { logger } from "@databuddy/shared/logger";
import { Elysia } from "elysia";

const DATE_REGEX = /\.\d{3}Z$/;
const SIGNATURE_TOLERANCE_SECONDS = 300;

interface WebhookConfig {
	ownerId: string;
	websiteId: string | null;
	stripeWebhookSecret: string;
}

interface WebhookPaymentIntent {
	id: string;
	amount: number;
	amount_received?: number;
	currency: string;
	created: number;
	description?: string | null;
	invoice?: string | { id: string } | null;
	customer?: string | { id: string } | null;
	metadata?: Record<string, string>;
}

interface WebhookCharge {
	id: string;
	amount_refunded: number;
	currency: string;
	customer?: string | { id: string } | null;
	metadata?: Record<string, string>;
	refunds?: {
		data: Array<{
			id: string;
			amount: number;
			created: number;
		}>;
	};
}

interface WebhookEvent {
	id: string;
	type: string;
	data: {
		object: WebhookPaymentIntent | WebhookCharge;
	};
}

function verifyStripeSignature(
	payload: string,
	header: string,
	secret: string
): { valid: true; event: WebhookEvent } | { valid: false; error: string } {
	const parts: Record<string, string[]> = {};

	for (const item of header.split(",")) {
		const [key, value] = item.split("=");
		if (key && value) {
			if (!parts[key]) {
				parts[key] = [];
			}
			parts[key].push(value);
		}
	}

	const timestamp = parts.t?.[0];
	const signatures = parts.v1 || [];

	if (!timestamp) {
		return { valid: false, error: "Missing timestamp in signature header" };
	}

	if (signatures.length === 0) {
		return { valid: false, error: "No v1 signatures found in header" };
	}

	const timestampNum = Number.parseInt(timestamp, 10);
	const now = Math.floor(Date.now() / 1000);

	if (Math.abs(now - timestampNum) > SIGNATURE_TOLERANCE_SECONDS) {
		return { valid: false, error: "Timestamp outside tolerance zone" };
	}

	const signedPayload = `${timestamp}.${payload}`;
	const expectedSignature = createHmac("sha256", secret)
		.update(signedPayload, "utf8")
		.digest("hex");

	const signatureMatch = signatures.some((sig) => {
		try {
			return timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(sig));
		} catch {
			return false;
		}
	});

	if (!signatureMatch) {
		return { valid: false, error: "Signature mismatch" };
	}

	try {
		const event = JSON.parse(payload) as WebhookEvent;
		return { valid: true, event };
	} catch {
		return { valid: false, error: "Invalid JSON payload" };
	}
}

interface AnalyticsMetadata {
	anonymous_id?: string;
	session_id?: string;
	client_id?: string;
}

function extractAnalyticsMetadata(
	metadata: Record<string, string> | undefined
): AnalyticsMetadata {
	if (!metadata) {
		return {};
	}
	return {
		anonymous_id: metadata.databuddy_anonymous_id,
		session_id: metadata.databuddy_session_id,
		client_id: metadata.databuddy_client_id,
	};
}

function extractCustomerId(
	customer: string | { id: string } | null | undefined
): string | undefined {
	if (!customer) {
		return undefined;
	}
	return typeof customer === "string" ? customer : customer.id;
}

function formatDate(date: Date): string {
	return date.toISOString().replace("T", " ").replace(DATE_REGEX, "");
}

async function getConfig(
	hash: string
): Promise<WebhookConfig | { error: string }> {
	const config = await db.query.revenueConfig.findFirst({
		where: eq(revenueConfig.webhookHash, hash),
		columns: {
			ownerId: true,
			websiteId: true,
			stripeWebhookSecret: true,
		},
	});

	if (!config) {
		return { error: "not_found" };
	}

	if (!config.stripeWebhookSecret) {
		return { error: "stripe_not_configured" };
	}

	return {
		ownerId: config.ownerId,
		websiteId: config.websiteId,
		stripeWebhookSecret: config.stripeWebhookSecret,
	};
}

async function handlePaymentIntent(
	pi: WebhookPaymentIntent,
	config: WebhookConfig
): Promise<void> {
	const metadata = extractAnalyticsMetadata(pi.metadata);
	const customerId = extractCustomerId(pi.customer);

	const type: "sale" | "subscription" = pi.invoice ? "subscription" : "sale";

	const amount = (pi.amount_received ?? pi.amount) / 100;
	const currency = pi.currency.toUpperCase();

	await clickHouse.insert({
		table: "analytics.revenue",
		values: [
			{
				owner_id: config.ownerId,
				website_id: metadata.client_id || config.websiteId || undefined,
				transaction_id: pi.id,
				provider: "stripe",
				type,
				status: "completed",
				amount,
				original_amount: amount,
				original_currency: currency,
				currency,
				anonymous_id: metadata.anonymous_id || undefined,
				session_id: metadata.session_id || undefined,
				customer_id: customerId,
				product_name: pi.description || undefined,
				metadata: JSON.stringify(metadata),
				created: formatDate(new Date(pi.created * 1000)),
				synced_at: formatDate(new Date()),
			},
		],
		format: "JSONEachRow",
	});

	logger.info({ type, amount, currency, customerId }, "Revenue: payment");
}

async function handleFailedPayment(
	pi: WebhookPaymentIntent,
	config: WebhookConfig,
	status: "failed" | "canceled"
): Promise<void> {
	const metadata = extractAnalyticsMetadata(pi.metadata);
	const customerId = extractCustomerId(pi.customer);
	const amount = (pi.amount_received ?? pi.amount) / 100;
	const currency = pi.currency.toUpperCase();

	await clickHouse.insert({
		table: "analytics.revenue",
		values: [
			{
				owner_id: config.ownerId,
				website_id: metadata.client_id || config.websiteId || undefined,
				transaction_id: pi.id,
				provider: "stripe",
				type: "sale",
				status,
				amount,
				original_amount: amount,
				original_currency: currency,
				currency,
				anonymous_id: metadata.anonymous_id || undefined,
				session_id: metadata.session_id || undefined,
				customer_id: customerId,
				product_name: pi.description || undefined,
				metadata: JSON.stringify(metadata),
				created: formatDate(new Date(pi.created * 1000)),
				synced_at: formatDate(new Date()),
			},
		],
		format: "JSONEachRow",
	});

	logger.info(
		{ status, amount, currency, customerId },
		`Revenue: payment ${status}`
	);
}

async function handleRefund(
	charge: WebhookCharge,
	config: WebhookConfig
): Promise<void> {
	const metadata = extractAnalyticsMetadata(charge.metadata);
	const customerId = extractCustomerId(charge.customer);
	const currency = charge.currency.toUpperCase();
	const refunds = charge.refunds?.data || [];

	for (const refund of refunds) {
		const amount = refund.amount / 100;

		await clickHouse.insert({
			table: "analytics.revenue",
			values: [
				{
					owner_id: config.ownerId,
					website_id: metadata.client_id || config.websiteId || undefined,
					transaction_id: refund.id,
					provider: "stripe",
					type: "refund",
					status: "refunded",
					amount: -amount,
					original_amount: -amount,
					original_currency: currency,
					currency,
					anonymous_id: metadata.anonymous_id || undefined,
					session_id: metadata.session_id || undefined,
					customer_id: customerId,
					product_name: "Refund",
					metadata: JSON.stringify(metadata),
					created: formatDate(new Date(refund.created * 1000)),
					synced_at: formatDate(new Date()),
				},
			],
			format: "JSONEachRow",
		});

		logger.info({ amount, currency, customerId }, "Revenue: refund");
	}
}

export const stripeWebhook = new Elysia().post(
	"/webhooks/stripe/:hash",
	async ({ params, request, set }) => {
		const result = await getConfig(params.hash);

		if ("error" in result) {
			if (result.error === "not_found") {
				set.status = 404;
				return { error: "Webhook endpoint not found" };
			}
			set.status = 400;
			return { error: "Stripe webhook not configured for this account" };
		}

		const signature = request.headers.get("stripe-signature");
		if (!signature) {
			set.status = 400;
			return { error: "Missing stripe-signature header" };
		}

		const body = await request.text();

		const verification = verifyStripeSignature(
			body,
			signature,
			result.stripeWebhookSecret
		);

		if (!verification.valid) {
			logger.warn(
				{ error: verification.error },
				"Stripe signature verification failed"
			);
			set.status = 401;
			return { error: "Invalid webhook signature" };
		}

		const event = verification.event;

		logger.info({ type: event.type, id: event.id }, "Stripe webhook received");

		try {
			switch (event.type) {
				case "payment_intent.succeeded": {
					await handlePaymentIntent(
						event.data.object as WebhookPaymentIntent,
						result
					);
					break;
				}
				case "payment_intent.payment_failed": {
					await handleFailedPayment(
						event.data.object as WebhookPaymentIntent,
						result,
						"failed"
					);
					break;
				}
				case "payment_intent.canceled": {
					await handleFailedPayment(
						event.data.object as WebhookPaymentIntent,
						result,
						"canceled"
					);
					break;
				}
				case "charge.refunded": {
					await handleRefund(event.data.object as WebhookCharge, result);
					break;
				}
				default: {
					logger.debug({ type: event.type }, "Unhandled Stripe event type");
				}
			}

			return { received: true, type: event.type };
		} catch (error) {
			logger.error({ error, type: event.type }, "Failed to process webhook");
			set.status = 500;
			return { error: "Failed to process webhook event" };
		}
	},
	{ parse: "none" }
);
