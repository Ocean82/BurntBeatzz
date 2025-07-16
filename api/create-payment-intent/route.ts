import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, songId, songTitle, tier, includeLicense, email, name } = body

    // Validate required fields
    if (!amount || !songId || !songTitle || !tier || !email || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate amount (convert from dollars to cents)
    const amountInCents = Math.round(amount * 100)
    if (amountInCents < 50) {
      // Stripe minimum is $0.50
      return NextResponse.json({ error: "Amount too small" }, { status: 400 })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        songId,
        songTitle,
        tier,
        includeLicense: includeLicense.toString(),
        customerEmail: email,
        customerName: name,
        service: "burnt-beats-song-upload",
      },
      description: `Burnt Beats - ${tier} - ${songTitle}${includeLicense ? " + Full License" : ""}`,
      receipt_email: email,
    })

    // Log the payment intent creation
    console.log(`Payment intent created: ${paymentIntent.id} for ${email} - ${songTitle}`)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Payment intent creation failed:", error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 })
  }
}

// Handle payment confirmation webhook
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentIntentId } = body

    if (!paymentIntentId) {
      return NextResponse.json({ error: "Payment intent ID required" }, { status: 400 })
    }

    // Retrieve payment intent to confirm it succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }

    // TODO: Update database with successful payment
    // const purchase = await db.purchases.create({
    //   stripePaymentIntentId: paymentIntent.id,
    //   amount: paymentIntent.amount / 100,
    //   songId: paymentIntent.metadata.songId,
    //   userId: paymentIntent.metadata.userId,
    //   status: 'completed',
    //   metadata: paymentIntent.metadata
    // })

    console.log(`Payment confirmed: ${paymentIntent.id}`)

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        metadata: paymentIntent.metadata,
      },
    })
  } catch (error) {
    console.error("Payment confirmation failed:", error)
    return NextResponse.json({ error: "Payment confirmation failed" }, { status: 500 })
  }
}
