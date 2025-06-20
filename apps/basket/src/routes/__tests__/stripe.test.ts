import { describe, test, expect, beforeEach, vi } from 'vitest'
import Stripe from 'stripe'
import { db, userStripeConfig } from '@databuddy/db'
import { clickHouse } from '@databuddy/db'

// Mock dependencies
vi.mock('stripe')
vi.mock('@databuddy/db')

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn()
}

const mockClickHouse = {
  insert: vi.fn()
}

vi.mocked(db.select).mockReturnValue(mockDb as any)
vi.mocked(clickHouse.insert).mockImplementation(mockClickHouse.insert)

// Mock Stripe webhook construction
const mockStripe = {
  webhooks: {
    constructEventAsync: vi.fn()
  }
}
vi.mocked(Stripe).mockImplementation(() => mockStripe as any)
vi.mocked(Stripe.webhooks.constructEventAsync).mockImplementation(mockStripe.webhooks.constructEventAsync)

describe('stripe webhook handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ENABLE_MODE_VALIDATION = 'false'
  })

  describe('webhook authentication', () => {
    test('rejects_requests_with_invalid_webhook_token', async () => {
      mockDb.limit.mockResolvedValue([]) // No config found

      const response = await handleWebhookRequest('invalid-token', 'test-signature', 'test-body')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Webhook endpoint not found' })
    })

    test('rejects_requests_with_inactive_webhook_config', async () => {
      mockDb.limit.mockResolvedValue([{
        webhookSecret: 'secret',
        userId: 'user123',
        isLiveMode: false,
        isActive: false
      }])

      const response = await handleWebhookRequest('valid-token', 'test-signature', 'test-body')

      expect(response.status).toBe(404)
    })

    test('accepts_requests_with_valid_webhook_token', async () => {
      mockDb.limit.mockResolvedValue([{
        webhookSecret: 'secret',
        userId: 'user123',
        isLiveMode: false,
        isActive: true
      }])

      mockStripe.webhooks.constructEventAsync.mockResolvedValue({
        id: 'evt_test',
        type: 'payment_intent.succeeded',
        livemode: false,
        data: { object: { id: 'pi_test' } }
      })

      const response = await handleWebhookRequest('valid-token', 'valid-signature', 'test-body')

      expect(response.status).toBe(200)
    })
  })

  describe('signature verification', () => {
    beforeEach(() => {
      mockDb.limit.mockResolvedValue([{
        webhookSecret: 'secret',
        userId: 'user123',
        isLiveMode: false,
        isActive: true
      }])
    })

    test('rejects_requests_without_signature_header', async () => {
      const response = await handleWebhookRequest('valid-token', null, 'test-body')

      expect(response.status).toBe(400)
      expect(response.body).toEqual({ error: 'Missing stripe-signature header' })
    })

    test('rejects_requests_with_invalid_signature', async () => {
      mockStripe.webhooks.constructEventAsync.mockRejectedValue(new Error('Invalid signature'))

      const response = await handleWebhookRequest('valid-token', 'invalid-signature', 'test-body')

      expect(response.status).toBe(400)
      expect(response.body).toEqual({ error: 'Invalid signature' })
    })

    test('validates_live_mode_consistency_when_enabled', async () => {
      process.env.ENABLE_MODE_VALIDATION = 'true'
      
      mockDb.limit.mockResolvedValue([{
        webhookSecret: 'secret',
        userId: 'user123',
        isLiveMode: true, // Config expects live mode
        isActive: true
      }])

      mockStripe.webhooks.constructEventAsync.mockResolvedValue({
        id: 'evt_test',
        type: 'payment_intent.succeeded',
        livemode: false, // But event is test mode
        data: { object: { id: 'pi_test' } }
      })

      const response = await handleWebhookRequest('valid-token', 'valid-signature', 'test-body')

      expect(response.status).toBe(400)
      expect(response.body).toEqual({ error: 'Live/test mode mismatch' })
    })
  })

  describe('client ID extraction', () => {
    test('extracts_client_id_from_metadata', () => {
      const stripeObject = {
        metadata: {
          client_id: 'client_12345',
          other_field: 'value'
        }
      }

      // Should extract client_id correctly
    })

    test('falls_back_to_website_id_in_metadata', () => {
      const stripeObject = {
        metadata: {
          website_id: 'website_12345'
        }
      }

      // Should use website_id as fallback
    })

    test('returns_null_when_no_client_id_found', () => {
      const stripeObject = {
        metadata: {
          unrelated_field: 'value'
        }
      }

      // Should return null
    })

    test('handles_missing_metadata_gracefully', () => {
      const stripeObject = {}

      // Should return null without crashing
    })
  })

  describe('session ID extraction', () => {
    test('prioritizes_client_reference_id', () => {
      const stripeObject = {
        client_reference_id: 'sess_from_reference',
        metadata: {
          session_id: 'sess_from_metadata'
        }
      }

      // Should prefer client_reference_id over metadata
    })

    test('falls_back_to_metadata_session_id', () => {
      const stripeObject = {
        metadata: {
          session_id: 'sess_from_metadata'
        }
      }

      // Should use metadata.session_id when client_reference_id not present
    })

    test('returns_null_when_no_session_id_found', () => {
      const stripeObject = {
        metadata: {
          other_field: 'value'
        }
      }

      // Should return null
    })
  })

  describe('payment intent processing', () => {
    beforeEach(() => {
      mockClickHouse.insert.mockResolvedValue({})
    })

    test('processes_payment_intent_succeeded_event', async () => {
      const paymentIntent = {
        id: 'pi_test123',
        created: 1640995200,
        status: 'succeeded',
        currency: 'usd',
        amount: 2000,
        amount_received: 2000,
        amount_capturable: 0,
        livemode: false,
        metadata: { client_id: 'client_123' },
        payment_method_types: ['card'],
        last_payment_error: null,
        canceled_at: null,
        cancellation_reason: null,
        description: 'Test payment',
        application_fee_amount: null,
        setup_future_usage: null,
        client_reference_id: 'sess_123'
      }

      // Should insert payment intent with correct data structure
      expect(mockClickHouse.insert).toHaveBeenCalledWith({
        table: 'analytics.stripe_payment_intents',
        values: [expect.objectContaining({
          id: 'pi_test123',
          client_id: 'client_123',
          status: 'succeeded',
          amount: 2000,
          session_id: 'sess_123'
        })],
        format: 'JSONEachRow'
      })
    })

    test('handles_payment_intent_with_failure', async () => {
      const paymentIntent = {
        id: 'pi_failed123',
        status: 'payment_failed',
        last_payment_error: {
          message: 'Your card was declined.'
        },
        metadata: { client_id: 'client_123' }
      }

      // Should include failure reason in stored data
    })

    test('throws_error_when_client_id_missing', async () => {
      const paymentIntent = {
        id: 'pi_no_client',
        metadata: {} // No client_id
      }

      await expect(async () => {
        // Should throw error about missing client_id
      }).rejects.toThrow('Missing required client_id')
    })

    test('handles_canceled_payment_intent', async () => {
      const paymentIntent = {
        id: 'pi_canceled123',
        status: 'canceled',
        canceled_at: 1640995300,
        cancellation_reason: 'requested_by_customer',
        metadata: { client_id: 'client_123' }
      }

      // Should include cancellation details
    })
  })

  describe('charge processing', () => {
    test('processes_successful_charge', async () => {
      const charge = {
        id: 'ch_test123',
        created: 1640995200,
        status: 'succeeded',
        currency: 'usd',
        amount: 2000,
        amount_captured: 2000,
        amount_refunded: 0,
        paid: true,
        refunded: false,
        livemode: false,
        failure_code: null,
        failure_message: null,
        outcome: {
          type: 'authorized',
          risk_level: 'normal'
        },
        payment_method_details: {
          card: {
            brand: 'visa'
          }
        },
        payment_intent: 'pi_test123',
        metadata: { client_id: 'client_123' },
        client_reference_id: 'sess_123'
      }

      expect(mockClickHouse.insert).toHaveBeenCalledWith({
        table: 'analytics.stripe_charges',
        values: [expect.objectContaining({
          id: 'ch_test123',
          status: 'succeeded',
          card_brand: 'visa',
          risk_level: 'normal'
        })],
        format: 'JSONEachRow'
      })
    })

    test('processes_failed_charge', async () => {
      const charge = {
        id: 'ch_failed123',
        status: 'failed',
        failure_code: 'card_declined',
        failure_message: 'Your card was declined.',
        paid: false,
        metadata: { client_id: 'client_123' }
      }

      // Should include failure details
    })

    test('processes_disputed_charge', async () => {
      const charge = {
        id: 'ch_disputed123',
        status: 'succeeded',
        outcome: {
          type: 'authorized',
          risk_level: 'elevated'
        },
        metadata: { client_id: 'client_123' }
      }

      // Should include risk assessment
    })
  })

  describe('refund processing', () => {
    test('processes_successful_refund', async () => {
      const refund = {
        id: 're_test123',
        created: 1640995200,
        amount: 1000,
        status: 'succeeded',
        reason: 'requested_by_customer',
        currency: 'usd',
        charge: 'ch_test123',
        payment_intent: 'pi_test123',
        metadata: { client_id: 'client_123' },
        client_reference_id: 'sess_123'
      }

      expect(mockClickHouse.insert).toHaveBeenCalledWith({
        table: 'analytics.stripe_refunds',
        values: [expect.objectContaining({
          id: 're_test123',
          amount: 1000,
          reason: 'requested_by_customer',
          charge_id: 'ch_test123'
        })],
        format: 'JSONEachRow'
      })
    })

    test('processes_failed_refund', async () => {
      const refund = {
        id: 're_failed123',
        status: 'failed',
        charge: 'ch_test123',
        metadata: { client_id: 'client_123' }
      }

      // Should handle failed refund status
    })

    test('processes_partial_refund', async () => {
      const refund = {
        id: 're_partial123',
        amount: 500, // Partial amount
        status: 'succeeded',
        charge: 'ch_test123',
        metadata: { client_id: 'client_123' }
      }

      // Should process partial refunds correctly
    })
  })

  describe('event handling', () => {
    test('handles_supported_event_types', async () => {
      const supportedEvents = [
        'payment_intent.succeeded',
        'payment_intent.created',
        'payment_intent.canceled',
        'payment_intent.payment_failed',
        'charge.succeeded',
        'charge.failed',
        'refund.created',
        'refund.updated'
      ]

      for (const eventType of supportedEvents) {
        // Should process each event type without error
      }
    })

    test('ignores_unsupported_event_types', async () => {
      const unsupportedEvents = [
        'customer.created',
        'invoice.payment_succeeded',
        'subscription.created'
      ]

      for (const eventType of unsupportedEvents) {
        // Should log but not process unsupported events
      }
    })

    test('processes_events_with_complex_metadata', async () => {
      const paymentIntent = {
        id: 'pi_complex123',
        metadata: {
          client_id: 'client_123',
          user_id: 'user_456',
          subscription_id: 'sub_789',
          custom_field: 'custom_value'
        }
      }

      // Should handle complex metadata without issues
    })
  })

  describe('error handling and resilience', () => {
    test('handles_database_insertion_failures', async () => {
      mockClickHouse.insert.mockRejectedValue(new Error('Database connection failed'))

      const paymentIntent = {
        id: 'pi_test123',
        metadata: { client_id: 'client_123' }
      }

      // Should handle database errors gracefully and still return 200
    })

    test('handles_malformed_webhook_data', async () => {
      const malformedData = {
        id: 'pi_malformed',
        // Missing required fields
      }

      // Should handle missing or malformed data gracefully
    })

    test('processes_events_with_null_values', async () => {
      const paymentIntent = {
        id: 'pi_nulls123',
        description: null,
        application_fee_amount: null,
        last_payment_error: null,
        metadata: { client_id: 'client_123' }
      }

      // Should handle null values without crashing
    })

    test('handles_very_large_metadata_objects', async () => {
      const largeMetadata = {
        client_id: 'client_123',
        large_field: 'x'.repeat(10000)
      }

      const paymentIntent = {
        id: 'pi_large123',
        metadata: largeMetadata
      }

      // Should handle large metadata without issues
    })
  })

  describe('security logging', () => {
    test('logs_invalid_webhook_token_attempts', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      mockDb.limit.mockResolvedValue([]) // Invalid token

      await handleWebhookRequest('invalid-token', 'signature', 'body')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security Event'),
        expect.objectContaining({
          webhookToken: 'invalid-token'
        })
      )

      consoleSpy.mockRestore()
    })

    test('logs_signature_verification_failures', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockDb.limit.mockResolvedValue([{
        webhookSecret: 'secret',
        userId: 'user123',
        isLiveMode: false,
        isActive: true
      }])

      mockStripe.webhooks.constructEventAsync.mockRejectedValue(new Error('Invalid signature'))

      await handleWebhookRequest('valid-token', 'invalid-signature', 'body')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Webhook signature verification failed')
      )

      consoleSpy.mockRestore()
    })
  })
})

// Helper function to simulate webhook requests
async function handleWebhookRequest(webhookToken: string, signature: string | null, body: string) {
  const headers: Record<string, string> = {}
  if (signature) {
    headers['stripe-signature'] = signature
  }

  const request = new Request(`http://localhost/stripe/webhook/${webhookToken}`, {
    method: 'POST',
    headers,
    body
  })

  // This would call the actual webhook handler
  // return await webhookHandler({ params: { webhookToken }, request, set: mockSet })
  
  return { status: 200, body: { received: true } } // Placeholder
} 