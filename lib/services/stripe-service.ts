<<<<<<< HEAD
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
=======
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  clientSecret: string
}

export class StripeService {
  // Create payment intent for download purchase
  static async createDownloadPayment({
    amount,
    userId,
    songId,
    tier,
    includeLicense,
  }: {
    amount: number
    userId: string
    songId: number
    tier: string
    includeLicense: boolean
  }): Promise<PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId,
          songId: songId.toString(),
          tier,
          includeLicense: includeLicense.toString(),
          type: "download",
        },
        description: `Download: Song ${songId} (${tier} quality)`,
      })

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!,
      }
    } catch (error) {
      console.error("Stripe payment creation failed:", error)
      throw new Error("Failed to create payment")
    }
  }

  // Create payment for contest boost
  static async createBoostPayment({
    amount,
    userId,
    songId,
    boostType,
  }: {
    amount: number
    userId: string
    songId: number
    boostType: string
  }): Promise<PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        metadata: {
          userId,
          songId: songId.toString(),
          boostType,
          type: "contest_boost",
        },
        description: `Contest Boost: ${boostType} for Song ${songId}`,
      })

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!,
      }
    } catch (error) {
      console.error("Stripe boost payment creation failed:", error)
      throw new Error("Failed to create boost payment")
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
    }
  }

  // Verify webhook signature
<<<<<<< HEAD
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
=======
  static verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (error) {
      console.error("Webhook signature verification failed:", error)
      throw new Error("Invalid webhook signature")
    }
  }

  // Handle successful payment
  static async handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
    const { metadata } = paymentIntent

    if (metadata.type === "download") {
      // Generate download token
      const downloadToken = `download_${metadata.songId}_${metadata.userId}_${Date.now()}`

      // Store purchase record in database
      await this.storePurchaseRecord({
        userId: metadata.userId,
        songId: Number.parseInt(metadata.songId),
        type: "download",
        tier: metadata.tier,
        includeLicense: metadata.includeLicense === "true",
        amount: paymentIntent.amount / 100,
        downloadToken,
        paymentIntentId: paymentIntent.id,
      })

      return { downloadToken }
    }

    if (metadata.type === "contest_boost") {
      // Activate contest boost
      await this.activateContestBoost({
        songId: Number.parseInt(metadata.songId),
        userId: metadata.userId,
        boostType: metadata.boostType,
        paymentIntentId: paymentIntent.id,
      })

      return { boostActivated: true }
    }
  }

  private static async storePurchaseRecord(record: any) {
    // Store in database - implement with your DB
    console.log("Storing purchase record:", record)
  }

  private static async activateContestBoost(boost: any) {
    // Activate boost - implement with your DB
    console.log("Activating contest boost:", boost)
  }
}
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
