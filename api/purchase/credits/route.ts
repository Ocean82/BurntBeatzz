import { type NextRequest, NextResponse } from "next/server"
import { CreditIntegrationService } from "@/lib/services/credit-integration-service"

export async function POST(request: NextRequest) {
  try {
    const { songId, tier, includeLicense, userId, creditCost } = await request.json()

    // Validate required fields
    if (!songId || !tier || !userId || !creditCost) {
      return NextResponse.json(
        {
          error: "Missing required fields: songId, tier, userId, creditCost",
        },
        { status: 400 },
      )
    }

    // Validate credit cost is positive
    if (creditCost <= 0) {
      return NextResponse.json(
        {
          error: "Credit cost must be positive",
        },
        { status: 400 },
      )
    }

    // Process the credit purchase for download
    const result = await CreditIntegrationService.useCreditsForDownload(
      userId,
      Number.parseInt(songId),
      tier,
      includeLicense || false,
    )

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Transaction failed",
        },
        { status: 402 }, // Payment Required
      )
    }

    // Log successful purchase for analytics
    console.log(`💰 Credit download purchase: User ${userId} spent ${creditCost} credits for ${tier} download`)

    // Return success response with download token
    return NextResponse.json({
      success: true,
      downloadToken: result.downloadToken,
      transactionId: result.transactionId,
      remainingCredits: result.remainingCredits,
      message: `Successfully purchased ${tier} download for ${creditCost} credits`,
      purchaseDetails: {
        songId: Number.parseInt(songId),
        tier,
        includeLicense: includeLicense || false,
        creditCost,
        purchaseDate: new Date().toISOString(),
        transactionId: result.transactionId,
      },
    })
  } catch (error) {
    console.error("Credit purchase error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}

// Get user's credit balance and download options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        {
          error: "userId parameter is required",
        },
        { status: 400 },
      )
    }

    // Get credit balance
    const balance = await CreditIntegrationService.getCreditBalance(userId)

    // Get credit settings
    const settings = CreditIntegrationService.getCreditSettings()

    // Get download options (credits can only be used for downloads)
    const downloadOptions = CreditIntegrationService.getCreditSpendingOptions()

    return NextResponse.json({
      balance,
      settings,
      downloadOptions,
      creditValue: {
        ratio: settings.creditToCashRatio,
        description: `${settings.creditToCashRatio} credits = $1.00 USD`,
      },
      businessModel: {
        type: "pay-per-download",
        description: "All features are free to use. You only pay when downloading songs.",
        demoAvailable: true,
        watermarkDemo: "Demo versions include audio watermark overlay",
      },
    })
  } catch (error) {
    console.error("Error fetching credit data:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
