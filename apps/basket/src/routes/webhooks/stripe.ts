import { clickHouse, db, eq, revenueConfig } from "@databuddy/db";
import { logger } from "@databuddy/shared/logger";
import { Elysia } from "elysia";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const DATE_REGEX = /\.\d{3}Z$/;

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
	metadata?: Record<string, string>;
}

interface WebhookCharge {
	id: string;
	amount_refunded: number;
	currency: string;
	metadata?: Record<string, string>;
	refunds?: {
		data: Array<{
			id: string;
			amount: number;
			created: number;
		}>;
	};
}

function extractAnalyticsMetadata(metadata: Record<string, string> | undefined): Record<string, string> {
	if (!metadata) {
		return {};
	}
	const result: Record<string, string> = {};
	if (metadata.anonymous_id) {
		result.anonymous_id = metadata.anonymous_id;
	}
	if (metadata.session_id) {
		result.session_id = metadata.session_id;
	}
	if (metadata.website_id) {
		result.website_id = metadata.website_id;
	}
	return result;
}

interface WebhookInvoice {
	id: string;
	payment_intent?: string | { id: string } | null;
}

interface WebhookEvent {
	id: string;
	type: string;
	data: {
		object: WebhookPaymentIntent | WebhookCharge | WebhookInvoice;
	};
}

function formatDate(date: Date): string {
	return date.toISOString().replace("T", " ").replace(DATE_REGEX, "");
}

function extractId(value: string | { id: string } | null | undefined): string | undefined {
	if (!value) {
		return undefined;
	}
	if (typeof value === "string") {
		return value;
	}
	return value.id;
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
	let type: "sale" | "subscription" = "sale";
	let productName: string | undefined;

	const invoiceId = extractId(pi.invoice);

	if (invoiceId) {
		const invoice = await stripe.invoices
			.retrieve(invoiceId, { expand: ["subscription", "lines"] })
			.catch(() => null);

		if (invoice?.subscription) {
			type = "subscription";
		}
		const firstLine = invoice?.lines?.data?.[0];
		if (firstLine?.description) {
			productName = firstLine.description;
		}
	}

	const amount = (pi.amount_received ?? pi.amount) / 100;
	const currency = pi.currency.toUpperCase();

	await clickHouse.insert({
		table: "analytics.revenue",
		values: [
			{
				owner_id: config.ownerId,
				website_id: metadata.website_id || config.websiteId || undefined,
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
				product_name: productName || pi.description || undefined,
				metadata: JSON.stringify(metadata),
				created: formatDate(new Date(pi.created * 1000)),
				synced_at: formatDate(new Date()),
			},
		],
		format: "JSONEachRow",
	});

	logger.info({ type, amount, currency }, "Revenue: payment");
}

async function handleRefund(
	charge: WebhookCharge,
	config: WebhookConfig
): Promise<void> {
	const metadata = extractAnalyticsMetadata(charge.metadata);
	const currency = charge.currency.toUpperCase();
	const refunds = charge.refunds?.data || [];

	for (const refund of refunds) {
		const amount = refund.amount / 100;

		await clickHouse.insert({
			table: "analytics.revenue",
			values: [
				{
					owner_id: config.ownerId,
					website_id: metadata.website_id || config.websiteId || undefined,
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
					product_name: "Refund",
					metadata: JSON.stringify(metadata),
					created: formatDate(new Date(refund.created * 1000)),
					synced_at: formatDate(new Date()),
				},
			],
			format: "JSONEachRow",
		});

		logger.info({ amount, currency }, "Revenue: refund");
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

		let event: WebhookEvent;
		try {
			event = (await stripe.webhooks.constructEventAsync(
				body,
				signature,
				result.stripeWebhookSecret
			)) as unknown as WebhookEvent;
		} catch (error) {
			logger.warn({ error }, "Stripe signature verification failed");
			set.status = 401;
			return { error: "Invalid webhook signature" };
		}

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
				case "charge.refunded": {
					await handleRefund(event.data.object as WebhookCharge, result);
					break;
				}
				case "invoice.payment_succeeded": {
					const invoice = event.data.object as WebhookInvoice;
					const paymentIntentId = extractId(invoice.payment_intent);

					if (paymentIntentId) {
						const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
						await handlePaymentIntent(
							{
								id: pi.id,
								amount: pi.amount,
								amount_received: pi.amount_received,
								currency: pi.currency,
								created: pi.created,
								description: pi.description,
								invoice: extractId(pi.invoice as string | { id: string } | null),
								metadata: pi.metadata as Record<string, string>,
							},
							result
						);
					}
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
