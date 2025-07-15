export interface StripeCustomer {
  id: string
  email: string
  name?: string
  phone?: string
  metadata?: Record<string, string>
}

export interface StripePaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  client_secret: string
  metadata?: Record<string, string>
}

export interface StripeSubscription {
  id: string
  customer: string
  status: string
  current_period_start: number
  current_period_end: number
  items: Array<{
    id: string
    price: {
      id: string
      unit_amount: number
      currency: string
      recurring?: {
        interval: string
        interval_count: number
      }
    }
  }>
}

export class StripeIntegrationService {
  private stripe: any
  private webhookSecret: string

  constructor() {
    // Initialize Stripe with your secret key
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required")
    }

    // Dynamic import to avoid issues in browser environment
    this.initializeStripe(stripeSecretKey)
  }

  private async initializeStripe(secretKey: string) {
    try {
      const Stripe = (await import("stripe")).default
      this.stripe = new Stripe(secretKey, {
        apiVersion: "2023-10-16",
        typescript: true,
      })
      console.log("✅ Stripe initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize Stripe:", error)
      throw error
    }
  }

  // Customer Management
  async createCustomer(email: string, name?: string, metadata?: Record<string, string>) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      })

      return {
        success: true,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          metadata: customer.metadata,
        } as StripeCustomer,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create customer",
      }
    }
  }

  async getCustomer(customerId: string) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId)

      return {
        success: true,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          metadata: customer.metadata,
        } as StripeCustomer,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve customer",
      }
    }
  }

  async updateCustomer(customerId: string, updates: Partial<StripeCustomer>) {
    try {
      const customer = await this.stripe.customers.update(customerId, updates)

      return {
        success: true,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          metadata: customer.metadata,
        } as StripeCustomer,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update customer",
      }
    }
  }

  // Payment Intent Management
  async createPaymentIntent(amount: number, currency = "usd", customerId?: string, metadata?: Record<string, string>) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      })

      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
          metadata: paymentIntent.metadata,
        } as StripePaymentIntent,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create payment intent",
      }
    }
  }

  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      })

      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
          metadata: paymentIntent.metadata,
        } as StripePaymentIntent,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to confirm payment intent",
      }
    }
  }

  async getPaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId)

      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
          metadata: paymentIntent.metadata,
        } as StripePaymentIntent,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve payment intent",
      }
    }
  }

  // Subscription Management
  async createSubscription(customerId: string, priceId: string, metadata?: Record<string, string>) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      })

      return {
        success: true,
        subscription: {
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          items: subscription.items.data.map((item) => ({
            id: item.id,
            price: {
              id: item.price.id,
              unit_amount: item.price.unit_amount,
              currency: item.price.currency,
              recurring: item.price.recurring,
            },
          })),
        } as StripeSubscription,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create subscription",
      }
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)

      return {
        success: true,
        subscription: {
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          items: subscription.items.data.map((item) => ({
            id: item.id,
            price: {
              id: item.price.id,
              unit_amount: item.price.unit_amount,
              currency: item.price.currency,
              recurring: item.price.recurring,
            },
          })),
        } as StripeSubscription,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve subscription",
      }
    }
  }

  async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId)

      return {
        success: true,
        subscription: {
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          items: subscription.items.data.map((item) => ({
            id: item.id,
            price: {
              id: item.price.id,
              unit_amount: item.price.unit_amount,
              currency: item.price.currency,
              recurring: item.price.recurring,
            },
          })),
        } as StripeSubscription,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cancel subscription",
      }
    }
  }

  // Webhook Handling
  async constructWebhookEvent(payload: string | Buffer, signature: string) {
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret)
      return {
        success: true,
        event,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to construct webhook event",
      }
    }
  }

  // Price Management
  async createPrice(
    productId: string,
    unitAmount: number,
    currency = "usd",
    recurring?: { interval: "month" | "year"; interval_count?: number },
  ) {
    try {
      const price = await this.stripe.prices.create({
        product: productId,
        unit_amount: Math.round(unitAmount * 100),
        currency,
        recurring,
      })

      return {
        success: true,
        price: {
          id: price.id,
          product: price.product,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create price",
      }
    }
  }

  // Product Management
  async createProduct(name: string, description?: string, metadata?: Record<string, string>) {
    try {
      const product = await this.stripe.products.create({
        name,
        description,
        metadata,
      })

      return {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          metadata: product.metadata,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create product",
      }
    }
  }
}

export const stripeService = new StripeIntegrationService()
