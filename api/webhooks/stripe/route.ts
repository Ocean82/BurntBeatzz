import { type NextRequest, NextResponse } from "next/server"
import { StripeService } from "@/lib/services/stripe-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    // Verify webhook signature
    const event = StripeService.verifyWebhookSignature(body, signature)

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object
        await StripeService.handleSuccessfulPayment(paymentIntent)
        break

      case "payment_intent.payment_failed":
        console.log("Payment failed:", event.data.object.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 })
  }
}
