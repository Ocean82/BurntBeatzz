import { type NextRequest, NextResponse } from "next/server"
import { stripeService } from "@/lib/services/stripe-integration-service"

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, customerId, metadata } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 })
    }

    console.log(`💳 Creating payment intent for amount: $${amount}`)

    const result = await stripeService.createPaymentIntent(amount, currency, customerId, metadata)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      paymentIntent: result.paymentIntent,
      message: "Payment intent created successfully",
    })
  } catch (error) {
    console.error("❌ Error creating payment intent:", error)
    return NextResponse.json(
      {
        error: "Failed to create payment intent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get("paymentIntentId")

    if (!paymentIntentId) {
      return NextResponse.json({ error: "Payment Intent ID is required" }, { status: 400 })
    }

    console.log(`💳 Retrieving payment intent: ${paymentIntentId}`)

    const result = await stripeService.getPaymentIntent(paymentIntentId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      paymentIntent: result.paymentIntent,
    })
  } catch (error) {
    console.error("❌ Error retrieving payment intent:", error)
    return NextResponse.json(
      {
        error: "Failed to retrieve payment intent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { paymentIntentId, paymentMethodId } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json({ error: "Payment Intent ID is required" }, { status: 400 })
    }

    console.log(`💳 Confirming payment intent: ${paymentIntentId}`)

    const result = await stripeService.confirmPaymentIntent(paymentIntentId, paymentMethodId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      paymentIntent: result.paymentIntent,
      message: "Payment intent confirmed successfully",
    })
  } catch (error) {
    console.error("❌ Error confirming payment intent:", error)
    return NextResponse.json(
      {
        error: "Failed to confirm payment intent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
