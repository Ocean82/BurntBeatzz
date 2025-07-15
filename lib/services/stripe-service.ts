import "server-only"
import Stripe from "stripe"
import { env } from "../config/env"

// Validate Stripe configuration
if (!env.STRIPE_SECRET_KEY && env.isProduction()) {
  console.warn("STRIPE_SECRET_KEY not configured - payment features will be disabled")
}

// Initialize Stripe (only if key is available)
export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      typescript: true,
    })
  : null

export class StripeService {
  // Create payment intent
  static async createPaymentIntent(amount: number, currency = "usd", metadata?: Record<string, string>) {
    if (!stripe) {
      throw new Error("Stripe not configured")
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      })

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Create customer
  static async createCustomer(email: string, name?: string, metadata?: Record<string, string>) {
    if (!stripe) {
      throw new Error("Stripe not configured")
    }

    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: metadata || {},
      })

      return {
        success: true,
        customerId: customer.id,
        customer,
      }
    } catch (error) {
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Get customer
  static async getCustomer(customerId: string) {
    if (!stripe) {
      throw new Error("Stripe not configured")
    }

    try {
      const customer = await stripe.customers.retrieve(customerId)
      return {
        success: true,
        customer,
      }
    } catch (error) {
      throw new Error(`Failed to get customer: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Verify webhook signature
  static verifyWebhookSignature(payload: string, signature: string) {
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("Stripe webhook not configured")
    }

    try {
      const event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET)
      return event
    } catch (error) {
      throw new Error(
        `Webhook signature verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  // Get Stripe health status
  static async getStripeHealth() {
    if (!stripe) {
      return {
        success: false,
        message: "Stripe not configured",
        configured: false,
      }
    }

    try {
      // Test API connection by retrieving account info
      const account = await stripe.accounts.retrieve()
      return {
        success: true,
        configured: true,
        accountId: account.id,
        country: account.country,
        currency: account.default_currency,
        businessType: account.business_type,
      }
    } catch (error) {
      return {
        success: false,
        configured: true,
        error: error instanceof Error ? error.message : "Stripe health check failed",
      }
    }
  }

  static async handleSuccessfulPayment(paymentIntent: any) {
    console.log("Processing successful payment:", paymentIntent.id)
    // Add your payment success logic here
  }
}

export default StripeService
