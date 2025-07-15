import { NextResponse } from "next/server"
import { StripeService } from "@/lib/services/stripe-service"

export async function GET() {
  try {
    const healthData = await StripeService.getStripeHealth()

    return NextResponse.json({
      success: healthData.success,
      message: healthData.success ? "Stripe connection successful" : "Stripe connection failed",
      data: {
        ...healthData,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Stripe health check failed",
        message: "Failed to check Stripe connection",
      },
      { status: 500 },
    )
  }
}
