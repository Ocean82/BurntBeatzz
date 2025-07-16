import { type NextRequest, NextResponse } from "next/server"
<<<<<<< HEAD

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
=======
import { PricingServiceV2 } from "@/lib/services/pricing-service-v2"

export async function POST(request: NextRequest) {
  try {
    const { songId, userId, tier, includeLicense, boostType, paymentMethodId } = await request.json()

    // Validate required fields
    if (!songId || !userId) {
      return NextResponse.json({ error: "Song ID and User ID are required" }, { status: 400 })
    }

    let totalAmount = 0
    let purchaseType = ""
    let purchaseDetails = {}

    // Handle download purchase
    if (tier) {
      const song = await getSongById(songId) // Mock function
      if (!song) {
        return NextResponse.json({ error: "Song not found" }, { status: 404 })
      }

      const pricing = PricingServiceV2.calculateTotalPrice(song.fileSizeMB, includeLicense)
      totalAmount = pricing.totalPrice
      purchaseType = "download"
      purchaseDetails = {
        tier,
        includeLicense,
        downloadPrice: pricing.downloadPrice,
        licensePrice: pricing.licensePrice,
      }
    }

    // Handle contest boost purchase
    if (boostType) {
      const boosts = PricingServiceV2.getContestBoosts()
      const boost = boosts[boostType as keyof typeof boosts]

      if (!boost) {
        return NextResponse.json({ error: "Invalid boost type" }, { status: 400 })
      }

      totalAmount += boost.price
      purchaseType = purchaseType ? "combo" : "boost"
      purchaseDetails = {
        ...purchaseDetails,
        boostType,
        boostPrice: boost.price,
      }
    }

    // Process payment (mock implementation)
    const paymentResult = await processPayment({
      amount: totalAmount,
      paymentMethodId,
      userId,
      description: `${purchaseType} purchase for song ${songId}`,
    })

    if (!paymentResult.success) {
      return NextResponse.json({ error: "Payment failed", details: paymentResult.error }, { status: 402 })
    }

    // Generate download token if applicable
    let downloadToken = null
    if (tier) {
      downloadToken = PricingServiceV2.generateDownloadToken(songId, userId, tier)

      // Store purchase record
      await storePurchaseRecord({
        userId,
        songId,
        purchaseType: "download",
        tier,
        includeLicense,
        amount: totalAmount,
        downloadToken,
        paymentId: paymentResult.paymentId,
      })
    }

    // Activate contest boost if applicable
    if (boostType) {
      await activateContestBoost({
        songId,
        boostType,
        userId,
        paymentId: paymentResult.paymentId,
      })
    }
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd

    return NextResponse.json({
      success: true,
      purchaseId: paymentResult.paymentId,
      downloadToken,
<<<<<<< HEAD
      downloadUrl: `/api/songs/download?token=${downloadToken}`,
      amount: pricing.total,
      tier,
      includeLicense,
      message: "Purchase completed successfully!",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
=======
      totalAmount,
      purchaseDetails,
      message: "Purchase completed successfully!",
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
    })
  } catch (error) {
    console.error("Purchase error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

<<<<<<< HEAD
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
=======
// Mock functions - implement with your actual database/payment service
async function getSongById(songId: number) {
  return {
    id: songId,
    title: "Mock Song",
    fileSizeMB: 4.5,
    userId: "user123",
  }
}

async function processPayment({ amount, paymentMethodId, userId, description }: any) {
  // Integrate with Stripe or your payment processor
  return {
    success: true,
    paymentId: `payment_${Date.now()}`,
    amount,
  }
}

async function storePurchaseRecord(record: any) {
  // Store in your database
  console.log("Storing purchase record:", record)
}

async function activateContestBoost({ songId, boostType, userId, paymentId }: any) {
  // Activate the contest boost
  console.log("Activating contest boost:", { songId, boostType, userId, paymentId })
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
}
