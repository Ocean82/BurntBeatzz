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

    totalAmount,
      purchaseDetails,
      message: "Purchase completed successfully!",
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
