import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { songId, userId, tier, includeLicense, paymentMethodId, amount } = await request.json()

    // Validate required fields
    if (!songId || !userId || !tier) {
      return NextResponse.json({ error: "Missing required fields: songId, userId, tier" }, { status: 400 })
    }

    // Validate tier
    const validTiers = ["demo", "standard", "high", "ultra"]
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }

    // Calculate pricing
    const pricing = calculatePricing(tier, includeLicense)

    if (amount && Math.abs(amount - pricing.total) > 0.01) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 })
    }

    // Process payment
    const paymentResult = await processPayment({
      amount: pricing.total,
      paymentMethodId,
      userId,
      description: `Download: ${tier} quality${includeLicense ? " + license" : ""}`,
      metadata: {
        songId,
        tier,
        includeLicense,
      },
    })

    if (!paymentResult.success) {
      return NextResponse.json(
        {
          error: "Payment failed",
          details: paymentResult.error,
        },
        { status: 402 },
      )
    }

    // Generate download token
    const downloadToken = generateDownloadToken(songId, userId, tier)

    // Store purchase record
    await storePurchaseRecord({
      userId,
      songId,
      tier,
      includeLicense,
      amount: pricing.total,
      downloadToken,
      paymentId: paymentResult.paymentId,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      purchaseId: paymentResult.paymentId,
      downloadToken,
      downloadUrl: `/api/songs/download?token=${downloadToken}`,
      amount: pricing.total,
      tier,
      includeLicense,
      message: "Purchase completed successfully!",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    })
  } catch (error) {
    console.error("Purchase error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Calculate pricing based on tier and license
function calculatePricing(tier: string, includeLicense = false) {
  const basePrices = {
    demo: 0.99,
    standard: 1.99,
    high: 4.99,
    ultra: 8.99,
  }

  const basePrice = basePrices[tier as keyof typeof basePrices] || 1.99
  const licensePrice = includeLicense ? 10.0 : 0
  const total = basePrice + licensePrice

  return {
    basePrice,
    licensePrice,
    total,
    currency: "USD",
  }
}

// Mock payment processing
async function processPayment({ amount, paymentMethodId, userId, description, metadata }: any) {
  // Simulate payment processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Simulate payment success/failure
  const success = Math.random() > 0.05 // 95% success rate

  if (success) {
    return {
      success: true,
      paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      status: "succeeded",
    }
  } else {
    return {
      success: false,
      error: "Payment declined",
      code: "card_declined",
    }
  }
}

// Generate secure download token
function generateDownloadToken(songId: string, userId: string, tier: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `dl_${songId}_${userId}_${tier}_${timestamp}_${random}`
}

// Store purchase record
async function storePurchaseRecord(record: any) {
  // In production, save to database
  console.log("Storing purchase record:", record)

  // Mock database storage
  return {
    id: `purchase_${Date.now()}`,
    ...record,
    status: "completed",
  }
}
