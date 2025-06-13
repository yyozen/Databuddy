import { Elysia } from "elysia";
import Stripe from 'stripe'
import { db, userStripeConfig, eq } from '@databuddy/db'
import { clickHouse } from '@databuddy/db'

/**
 * STRIPE CHECKOUT SETUP GUIDE
 * 
 * To properly track revenue analytics, you MUST include client_id and session_id 
 * in your Stripe Checkout session metadata when creating sessions server-side:
 * 
 * Example:
 * ```typescript
 * const session = await stripe.checkout.sessions.create({
 *   payment_method_types: ['card'],
 *   mode: 'payment',
 *   line_items: [{ price: 'price_abc123', quantity: 1 }],
 *   success_url: 'https://yourapp.com/success',
 *   cancel_url: 'https://yourapp.com/cancel',
 *   metadata: {
 *     client_id: 'your_website_id',        // Required: Website/client identifier
 *     session_id: 'user_session_id',       // Required: Anonymous user session ID
 *     user_id: 'user_1234',               // Optional: Your internal user ID
 *   },
 *   client_reference_id: 'user_session_id' // Alternative way to pass session_id
 * });
 * ```
 * 
 * This metadata will be available in all webhook events (payment_intent.*, charge.*, refund.*)
 * and allows proper linking between payment data and analytics events.
 */

const app = new Elysia()

interface StripeConfig {
    webhookSecret: string
    userId: string
    webhookToken: string
    isLiveMode: boolean
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const ENABLE_IP_VALIDATION = process.env.ENABLE_IP_VALIDATION === 'true' || IS_PRODUCTION
const ENABLE_RATE_LIMITING = process.env.ENABLE_RATE_LIMITING === 'true' || IS_PRODUCTION
const ENABLE_MODE_VALIDATION = process.env.ENABLE_MODE_VALIDATION === 'true' || IS_PRODUCTION

const STRIPE_WEBHOOK_IPS = [
    '3.18.12.63',
    '3.130.192.231',
    '13.235.14.237',
    '13.235.122.149',
    '18.211.135.69',
    '35.154.171.200',
    '52.15.183.38',
    '54.88.130.119',
    '54.88.130.237',
    '54.187.174.169',
    '54.187.205.235',
    '54.187.216.72'
]

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX = 100 // Max requests per window

// Secure webhook endpoint using webhook token: /stripe/webhook/{webhookToken}
app.post('/stripe/webhook/:webhookToken', async ({ params, request, set }) => {
    const clientIp = getClientIp(request)
    
    // Rate limiting (conditional)
    if (ENABLE_RATE_LIMITING && !checkRateLimit(params.webhookToken, clientIp)) {
        set.status = 429
        return { error: 'Rate limit exceeded' }
    }

    // IP validation (conditional)
    if (ENABLE_IP_VALIDATION && !isStripeIp(clientIp)) {
        logSecurityEvent('invalid_source_ip', params.webhookToken, clientIp)
        set.status = 403
        return { error: 'Request not from Stripe' }
    }

    const config = await getStripeConfigByToken(params.webhookToken)
    if (!config) {
        logSecurityEvent('invalid_webhook_token', params.webhookToken, clientIp)
        set.status = 404
        return { error: 'Webhook endpoint not found' }
    }
    
    return handleWebhook(request, set, config)
})

// Legacy global endpoint
app.post('/stripe', async ({ request, set }) => {
    const clientIp = getClientIp(request)
    
    // IP validation (conditional)
    if (ENABLE_IP_VALIDATION && !isStripeIp(clientIp)) {
        logSecurityEvent('invalid_source_ip', 'global', clientIp)
        set.status = 403
        return { error: 'Request not from Stripe' }
    }

    const config = getGlobalStripeConfig()
    if (!config) {
        set.status = 500
        return { error: 'Global Stripe configuration not found' }
    }
    
    return handleWebhook(request, set, config)
})

/**
 * Get client IP address from request
 */
function getClientIp(request: Request): string {
    return request.headers.get('cf-connecting-ip') || 
           request.headers.get('x-forwarded-for')?.split(',')[0] || 
           request.headers.get('x-real-ip') || 
           'unknown'
}

/**
 * Simple rate limiting check
 */
function checkRateLimit(identifier: string, ip: string): boolean {
    const key = `${identifier}:${ip}`
    const now = Date.now()
    const limit = rateLimitMap.get(key)

    if (!limit || now > limit.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
        return true
    }

    if (limit.count >= RATE_LIMIT_MAX) {
        return false
    }

    limit.count++
    return true
}

/**
 * Check if IP is from Stripe's official webhook IP list
 */
function isStripeIp(clientIp: string): boolean {
    // Allow localhost for development
    if (clientIp === '127.0.0.1' || clientIp === 'localhost' || clientIp === '::1') {
        return true
    }
    
    return STRIPE_WEBHOOK_IPS.includes(clientIp)
}

/**
 * Get Stripe configuration by webhook token
 */
async function getStripeConfigByToken(webhookToken: string): Promise<StripeConfig | null> {
    try {
        const userConfig = await db
            .select({
                webhookSecret: userStripeConfig.webhookSecret,
                userId: userStripeConfig.userId,
                isLiveMode: userStripeConfig.isLiveMode,
                isActive: userStripeConfig.isActive
            })
            .from(userStripeConfig)
            .where(eq(userStripeConfig.webhookToken, webhookToken))
            .limit(1)

        if (!userConfig.length || !userConfig[0].isActive) {
            return null
        }

        const config = userConfig[0]
        return {
            webhookSecret: config.webhookSecret,
            userId: config.userId,
            webhookToken: webhookToken,
            isLiveMode: config.isLiveMode
        }
    } catch (error) {
        console.error(`Error fetching Stripe config for token ${webhookToken}:`, error)
        return null
    }
}

/**
 * Get global Stripe configuration from environment
 */
function getGlobalStripeConfig(): StripeConfig | null {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
        return null
    }

    return {
        webhookSecret,
        userId: 'global',
        webhookToken: 'global',
        isLiveMode: false
    }
}

/**
 * Webhook handler with conditional security
 */
async function handleWebhook(request: Request, set: any, config: StripeConfig) {
    const sig = request.headers.get('stripe-signature')
    const body = await request.text()

    if (!sig) {
        set.status = 400
        return { error: 'Missing stripe-signature header' }
    }

    try {
        const event = await Stripe.webhooks.constructEventAsync(body, sig, config.webhookSecret)

        // Validate live/test mode consistency (conditional)
        if (ENABLE_MODE_VALIDATION && event.livemode !== config.isLiveMode) {
            logSecurityEvent('livemode_mismatch', config.webhookToken, getClientIp(request), {
                eventLivemode: event.livemode,
                configLivemode: config.isLiveMode,
                eventType: event.type
            })
            set.status = 400
            return { error: 'Live/test mode mismatch' }
        }

        console.log(`📦 Stripe webhook received for user ${config.userId}:`, {
            type: event.type,
            id: event.id,
            livemode: event.livemode
        })

        // Process the event with error handling
        try {
            await processWebhookEvent(event, config)
            // updateWebhookSuccess(config.webhookToken) // Commented out - no DB fields yet
            console.log(`✅ Successfully processed ${event.type}`)
        } catch (processingError) {
            console.error(`❌ Error processing webhook event:`, processingError)
            // updateWebhookFailure(config.webhookToken) // Commented out - no DB fields yet
            // Still return 200 to prevent Stripe retries
        }

        set.status = 200
        return { received: true, eventType: event.type }

    } catch (err) {
        console.error(`⚠️ Webhook signature verification failed:`, err)
        logSecurityEvent('signature_verification_failed', config.webhookToken, getClientIp(request))
        // updateWebhookFailure(config.webhookToken) // Commented out - no DB fields yet
        
        set.status = 400
        return { error: 'Invalid signature' }
    }
}

/**
 * Process webhook events and store data
 */
async function processWebhookEvent(event: Stripe.Event, config: StripeConfig) {
    const handlers: Record<string, (data: any) => Promise<void>> = {
        'payment_intent.succeeded': (pi: Stripe.PaymentIntent) => insertPaymentIntent(pi, config),
        'payment_intent.created': (pi: Stripe.PaymentIntent) => insertPaymentIntent(pi, config),
        'payment_intent.canceled': (pi: Stripe.PaymentIntent) => insertPaymentIntent(pi, config),
        'payment_intent.payment_failed': (pi: Stripe.PaymentIntent) => insertPaymentIntent(pi, config),
        'payment_intent.requires_action': (pi: Stripe.PaymentIntent) => insertPaymentIntent(pi, config),
        'charge.succeeded': (charge: Stripe.Charge) => insertCharge(charge, config),
        'charge.failed': (charge: Stripe.Charge) => insertCharge(charge, config),
        'charge.captured': (charge: Stripe.Charge) => insertCharge(charge, config),
        'charge.dispute.created': (charge: Stripe.Charge) => insertCharge(charge, config),
        'refund.created': (refund: Stripe.Refund) => insertRefund(refund, config),
        'refund.updated': (refund: Stripe.Refund) => insertRefund(refund, config),
        'refund.failed': (refund: Stripe.Refund) => insertRefund(refund, config),
    }

    const handler = handlers[event.type]
    if (handler) {
        await handler(event.data.object as any)
    } else {
        console.log(`🔄 Unhandled event type: ${event.type}`)
    }
}

/**
 * Extract client ID from Stripe metadata
 */
function extractClientId(stripeObject: any): string | null {
    try {
        // Try metadata first (recommended approach)
        if (stripeObject.metadata?.client_id) {
            return stripeObject.metadata.client_id
        }
        
        // Fallback to other possible fields
        if (stripeObject.metadata?.website_id) {
            return stripeObject.metadata.website_id
        }
    } catch (error) {
        console.warn('Error extracting client ID:', error)
    }
    
    return null
}

/**
 * Extract session ID from Stripe metadata or client_reference_id
 */
function extractSessionId(stripeObject: any): string | null {
    try {
        // Try client_reference_id first (recommended approach)
        if (stripeObject.client_reference_id) {
            return stripeObject.client_reference_id
        }
        
        // Fallback to metadata
        if (stripeObject.metadata?.session_id) {
            return stripeObject.metadata.session_id
        }
        
        // Also try anonymous_user_id in metadata
        if (stripeObject.metadata?.anonymous_user_id) {
            return stripeObject.metadata.anonymous_user_id
        }
    } catch (error) {
        console.warn('Error extracting session ID:', error)
    }
    
    return null
}

/**
 * Insert Payment Intent data
 */
async function insertPaymentIntent(pi: Stripe.PaymentIntent, config: StripeConfig) {
    try {
        const clientId = extractClientId(pi)
        const sessionId = extractSessionId(pi)
        
        if (!clientId) {
            console.warn('No client_id found in PaymentIntent metadata:', pi.id)
            // You might want to skip insertion or use a default value
            return
        }

        await clickHouse.insert({
            table: 'analytics.stripe_payment_intents',
            values: [{
                id: pi.id,
                client_id: clientId,
                created: new Date(pi.created * 1000).toISOString().replace('T', ' ').replace('Z', ''),
                status: pi.status,
                currency: pi.currency,
                amount: pi.amount,
                amount_received: pi.amount_received,
                amount_capturable: pi.amount_capturable,
                customer_id: pi.customer as string || null,
                livemode: pi.livemode ? 1 : 0,
                metadata: pi.metadata,
                payment_method_types: pi.payment_method_types,
                failure_reason: pi.last_payment_error?.message || null,
                canceled_at: pi.canceled_at ? new Date(pi.canceled_at * 1000).toISOString().replace('T', ' ').replace('Z', '') : null,
                cancellation_reason: pi.cancellation_reason,
                description: pi.description,
                application_fee_amount: pi.application_fee_amount,
                setup_future_usage: pi.setup_future_usage,
                anonymized_user_id: sessionId, // This is the session_id from analytics events
                session_id: sessionId // Keep both for compatibility
            }],
            format: 'JSONEachRow'
        })
        
        console.log(`✅ Inserted PaymentIntent ${pi.id} for client ${clientId} with session ${sessionId}`)
    } catch (error) {
        console.error('Error inserting payment intent:', error)
        throw error
    }
}

/**
 * Insert Charge data
 */
async function insertCharge(charge: Stripe.Charge, config: StripeConfig) {
    try {
        const clientId = extractClientId(charge)
        const sessionId = extractSessionId(charge)
        const card = charge.payment_method_details?.card

        if (!clientId) {
            console.warn('No client_id found in Charge metadata:', charge.id)
            // You might want to skip insertion or use a default value
            return
        }

        await clickHouse.insert({
            table: 'analytics.stripe_charges',
            values: [{
                id: charge.id,
                client_id: clientId,
                created: new Date(charge.created * 1000).toISOString().replace('T', ' ').replace('Z', ''),
                status: charge.status,
                currency: charge.currency,
                amount: charge.amount,
                amount_captured: charge.amount_captured,
                amount_refunded: charge.amount_refunded,
                paid: charge.paid ? 1 : 0,
                refunded: charge.refunded ? 1 : 0,
                failure_code: charge.failure_code,
                failure_message: charge.failure_message,
                outcome_type: charge.outcome?.type || null,
                risk_level: charge.outcome?.risk_level || null,
                card_brand: card?.brand || null,
                payment_intent_id: charge.payment_intent as string || null,
                customer_id: charge.customer as string || null,
                anonymized_user_id: sessionId, // This is the session_id from analytics events
                session_id: sessionId // Keep both for compatibility
            }],
            format: 'JSONEachRow'
        })
        
        console.log(`✅ Inserted Charge ${charge.id} for client ${clientId} with session ${sessionId}`)
    } catch (error) {
        console.error('Error inserting charge:', error)
        throw error
    }
}

/**
 * Insert Refund data
 */
async function insertRefund(refund: Stripe.Refund, config: StripeConfig) {
    try {
        const clientId = extractClientId(refund)
        const sessionId = extractSessionId(refund)
        
        if (!clientId) {
            console.warn('No client_id found in Refund metadata:', refund.id)
            // You might want to skip insertion or use a default value
            return
        }

        await clickHouse.insert({
            table: 'analytics.stripe_refunds',
            values: [{
                id: refund.id,
                client_id: clientId,
                created: new Date(refund.created * 1000).toISOString().replace('T', ' ').replace('Z', ''),
                amount: refund.amount,
                status: refund.status,
                reason: refund.reason,
                currency: refund.currency,
                charge_id: refund.charge as string,
                payment_intent_id: refund.payment_intent as string || null,
                metadata: refund.metadata,
                anonymized_user_id: sessionId, // This is the session_id from analytics events
                session_id: sessionId // Keep both for compatibility
            }],
            format: 'JSONEachRow'
        })
        
        console.log(`✅ Inserted Refund ${refund.id} for client ${clientId} with session ${sessionId}`)
    } catch (error) {
        console.error('Error inserting refund:', error)
        throw error
    }
}

/**
 * Log security events for monitoring
 */
function logSecurityEvent(eventType: string, webhookToken: string, ip: string, metadata?: any) {
    if (IS_PRODUCTION) {
        console.warn(`🚨 Security Event: ${eventType}`, {
            webhookToken,
            ip,
            timestamp: new Date().toISOString(),
            metadata
        })
        // In production, send to your security monitoring system
        // await securityLogger.warn(eventType, { webhookToken, ip, metadata })
    } else {
        console.log(`🔍 Security Event (disabled): ${eventType}`, { webhookToken, ip })
    }
}

// Commented out until DB fields are added
// /**
//  * Update webhook success tracking
//  */
// async function updateWebhookSuccess(webhookToken: string) {
//     if (webhookToken === 'global') return
//     
//     try {
//         await db
//             .update(userStripeConfig)
//             .set({
//                 lastWebhookAt: new Date().toISOString(),
//                 webhookFailureCount: 0,
//                 updatedAt: new Date().toISOString()
//             })
//             .where(eq(userStripeConfig.webhookToken, webhookToken))
//     } catch (error) {
//         console.error('Error updating webhook success:', error)
//     }
// }

// /**
//  * Update webhook failure tracking
//  */
// async function updateWebhookFailure(webhookToken: string) {
//     if (webhookToken === 'global') return
//     
//     try {
//         await db
//             .update(userStripeConfig)
//             .set({
//                 webhookFailureCount: sql`${userStripeConfig.webhookFailureCount} + 1`,
//                 updatedAt: new Date().toISOString()
//             })
//             .where(eq(userStripeConfig.webhookToken, webhookToken))
//     } catch (error) {
//         console.error('Error updating webhook failure:', error)
//     }
// }

export default app;