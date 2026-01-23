import { and, db, eq, gt, usageAlertLog, user } from "@databuddy/db";
import { UsageLimitEmail } from "@databuddy/email";
import { logger } from "@databuddy/shared/logger";
import { createId } from "@databuddy/shared/utils/ids";
import { Elysia, t } from "elysia";
import { Resend } from "resend";
import { Webhook } from "svix";
import { record, setAttributes } from "../../lib/tracing";

const resend = new Resend(process.env.RESEND_API_KEY);
const SVIX_WEBHOOK_SECRET = process.env.AUTUMN_WEBHOOK_SECRET;

const ALERT_COOLDOWN_DAYS = 7;

interface AutumnCustomer {
	id: string;
	email: string | null;
	name: string | null;
	env: string;
	features: Record<
		string,
		{
			id: string;
			name: string;
			balance: number;
			usage: number;
			included_usage: number;
			unlimited: boolean;
			interval: string | null;
		}
	>;
}

interface AutumnFeature {
	id: string;
	name: string;
	type: string;
}

interface ThresholdReachedPayload {
	type: "customer.threshold_reached";
	data: {
		customer: AutumnCustomer;
		feature: AutumnFeature;
		threshold_type: "limit_reached" | "allowance_used";
	};
}

interface ProductsUpdatedPayload {
	type: "customer.products.updated";
	data: {
		scenario:
		| "new"
		| "upgrade"
		| "downgrade"
		| "renew"
		| "cancel"
		| "expired"
		| "past_due"
		| "scheduled";
		customer: AutumnCustomer;
		updated_product: {
			id: string;
			name: string;
		};
	};
}

type AutumnWebhookPayload = ThresholdReachedPayload | ProductsUpdatedPayload;

async function getUserEmail(customerId: string): Promise<string | null> {
	const dbUser = await db.query.user.findFirst({
		where: eq(user.id, customerId),
		columns: {
			email: true,
		},
	});

	return dbUser?.email ?? null;
}

function formatFeatureName(featureId: string, featureName: string): string {
	if (featureName) {
		return featureName;
	}
	return featureId
		.replace(/_/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatNumber(num: number): string {
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(1)}M`;
	}
	if (num >= 1000) {
		return `${(num / 1000).toFixed(1)}K`;
	}
	return num.toLocaleString();
}

async function wasAlertSentRecently(
	userId: string,
	featureId: string
): Promise<boolean> {
	const cooldownDate = new Date();
	cooldownDate.setDate(cooldownDate.getDate() - ALERT_COOLDOWN_DAYS);

	const recentAlert = await db.query.usageAlertLog.findFirst({
		where: and(
			eq(usageAlertLog.userId, userId),
			eq(usageAlertLog.featureId, featureId),
			gt(usageAlertLog.createdAt, cooldownDate)
		),
		columns: {
			id: true,
		},
	});

	return Boolean(recentAlert);
}

async function logAlertSent(
	userId: string,
	featureId: string,
	alertType: string,
	emailSentTo: string
): Promise<void> {
	await db.insert(usageAlertLog).values({
		id: createId(),
		userId,
		featureId,
		alertType,
		emailSentTo,
	});
}

async function handleThresholdReached(
	payload: ThresholdReachedPayload["data"]
): Promise<{ success: boolean; message: string }> {
	const { customer, feature, threshold_type } = payload;

	// Skip sandbox events in production
	if (process.env.NODE_ENV === "production" && customer.env === "sandbox") {
		logger.info(
			{ customerId: customer.id, feature: feature.id },
			"Skipping sandbox threshold event in production"
		);
		return { success: true, message: "Skipped sandbox event" };
	}

	// Check if alert was sent recently
	const recentlySent = await wasAlertSentRecently(customer.id, feature.id);
	if (recentlySent) {
		logger.info(
			{ customerId: customer.id, feature: feature.id },
			"Skipping alert - already sent within cooldown period"
		);
		return {
			success: true,
			message: `Alert already sent within ${ALERT_COOLDOWN_DAYS} days`,
		};
	}

	// Get user email from database if not in payload
	const email = customer.email ?? (await getUserEmail(customer.id));

	if (!email) {
		logger.warn(
			{ customerId: customer.id, feature: feature.id },
			"No email found for customer, cannot send usage alert"
		);
		return { success: false, message: "No email found for customer" };
	}

	const featureData = customer.features[feature.id];
	const usageAmount = featureData?.usage ?? 0;
	const limitAmount = featureData?.included_usage ?? 0;
	const featureName = formatFeatureName(feature.id, feature.name);

	setAttributes({
		customer_id: customer.id,
		feature_id: feature.id,
		threshold_type,
		usage: usageAmount,
		limit: limitAmount,
	});

	const result = await resend.emails.send({
		from: "Databuddy <alerts@databuddy.cc>",
		to: email,
		subject: `You've reached your ${featureName} limit`,
		react: UsageLimitEmail({
			featureName,
			usageAmount: formatNumber(usageAmount),
			limitAmount: formatNumber(limitAmount),
			userName: customer.name ?? undefined,
			thresholdType: threshold_type,
		}),
	});

	if (result.error) {
		logger.error(
			{ error: result.error, customerId: customer.id },
			"Failed to send usage limit email"
		);
		return { success: false, message: result.error.message };
	}

	// Log the alert to prevent duplicates
	await logAlertSent(customer.id, feature.id, threshold_type, email);

	logger.info(
		{ customerId: customer.id, feature: feature.id, emailId: result.data?.id },
		"Sent usage limit alert email"
	);

	return { success: true, message: "Email sent successfully" };
}

function handleProductsUpdated(payload: ProductsUpdatedPayload["data"]): {
	success: boolean;
	message: string;
} {
	const { scenario, customer, updated_product } = payload;

	logger.info(
		{
			customerId: customer.id,
			scenario,
			product: updated_product.id,
		},
		"Received products updated webhook"
	);

	// Future: Handle different scenarios (upgrade emails, cancellation surveys, etc.)
	return { success: true, message: `Processed ${scenario} event` };
}

function verifyWebhookSignature(
	payload: string,
	headers: Record<string, string | null>
): boolean {
	if (!SVIX_WEBHOOK_SECRET) {
		logger.warn("AUTUMN_WEBHOOK_SECRET not configured, skipping verification");
		return true;
	}

	const svixId = headers["svix-id"];
	const svixTimestamp = headers["svix-timestamp"];
	const svixSignature = headers["svix-signature"];

	if (!(svixId && svixTimestamp && svixSignature)) {
		logger.error("Missing Svix headers for webhook verification");
		return false;
	}

	try {
		const wh = new Webhook(SVIX_WEBHOOK_SECRET);
		wh.verify(payload, {
			"svix-id": svixId,
			"svix-timestamp": svixTimestamp,
			"svix-signature": svixSignature,
		});
		return true;
	} catch (error) {
		logger.error({ error }, "Failed to verify webhook signature");
		return false;
	}
}

export const autumnWebhook = new Elysia().post(
	"/autumn",
	({ body, headers }) => {
		// Get raw body for signature verification
		const rawBody = JSON.stringify(body);

		// Verify webhook signature
		const isValid = verifyWebhookSignature(rawBody, {
			"svix-id": headers["svix-id"] ?? null,
			"svix-timestamp": headers["svix-timestamp"] ?? null,
			"svix-signature": headers["svix-signature"] ?? null,
		});

		if (!isValid) {
			return new Response(
				JSON.stringify({ success: false, message: "Invalid signature" }),
				{ status: 401, headers: { "Content-Type": "application/json" } }
			);
		}

		return record("autumnWebhook", async () => {
			const webhookPayload = body as AutumnWebhookPayload;

			setAttributes({
				webhook_type: webhookPayload.type,
				svix_id: headers["svix-id"] ?? "unknown",
			});

			logger.info({ type: webhookPayload.type }, "Received Autumn webhook");

			switch (webhookPayload.type) {
				case "customer.threshold_reached":
					return await handleThresholdReached(webhookPayload.data);

				case "customer.products.updated":
					return handleProductsUpdated(webhookPayload.data);

				default:
					logger.warn(
						{ type: (webhookPayload as { type: string }).type },
						"Unknown webhook type received"
					);
					return { success: true, message: "Unknown event type, ignored" };
			}
		});
	},
	{
		body: t.Object({
			type: t.String(),
			data: t.Object({
				customer: t.Object({
					id: t.String(),
					email: t.Nullable(t.String()),
					name: t.Nullable(t.String()),
					env: t.String(),
					features: t.Record(
						t.String(),
						t.Object({
							id: t.String(),
							name: t.String(),
							balance: t.Number(),
							usage: t.Number(),
							included_usage: t.Number(),
							unlimited: t.Boolean(),
							interval: t.Nullable(t.String()),
						})
					),
				}),
				feature: t.Optional(
					t.Object({
						id: t.String(),
						name: t.String(),
						type: t.String(),
					})
				),
				threshold_type: t.Optional(t.String()),
				scenario: t.Optional(t.String()),
				updated_product: t.Optional(
					t.Object({
						id: t.String(),
						name: t.String(),
					})
				),
			}),
		}),
	}
);
