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
    }
  }

  // Verify webhook signature
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
