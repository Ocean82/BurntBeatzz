import { type NextRequest, NextResponse } from "next/server"
import { cloudStorage } from "@/lib/services/google-cloud-storage"
import { PricingServiceV2 } from "@/lib/services/pricing-service-v2"

export async function POST(request: NextRequest) {
  try {
    const { songId, userId, tier, downloadToken } = await request.json()

    if (!songId || !userId || !tier || !downloadToken) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
        },
        { status: 400 },
      )
    }

    // Validate download token
    const isValidToken = PricingServiceV2.validatePurchase(songId, userId, tier)
    if (!isValidToken) {
      return NextResponse.json(
        {
          error: "Invalid or expired download token",
        },
        { status: 403 },
      )
    }

    // Get song file path based on tier
    const filePath = `songs/${userId}/${songId}/${tier}/song-${tier}.${getFileExtension(tier)}`

    // Generate signed URL for secure download
    const signedUrl = await cloudStorage.getSignedUrl(filePath, 15) // 15 minutes expiry

    // Log download for analytics
    await logDownload(songId, userId, tier)

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl,
      expiresIn: 15 * 60 * 1000, // 15 minutes in milliseconds
      tier,
      message: "Download link generated successfully!",
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate download link",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function getFileExtension(tier: string): string {
  const extensions: Record<string, string> = {
    bonus: "mp3",
    base: "mp3",
    premium: "wav",
    ultra: "flac",
  }
  return extensions[tier] || "mp3"
}

async function logDownload(songId: number, userId: string, tier: string) {
  // Log download for analytics and tracking
  console.log(`Download: Song ${songId}, User ${userId}, Tier ${tier}`)
  // In production, save to analytics database
}
=======
import { cloudStorage } from "@/lib/services/google-cloud-storage"
import { PricingServiceV2 } from "@/lib/services/pricing-service-v2"

export async function POST(request: NextRequest) {
  try {
    const { songId, userId, tier, downloadToken } = await request.json()

    if (!songId || !userId || !tier || !downloadToken) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
        },
        { status: 400 },
      )
    }

    // Validate download token
    const isValidToken = PricingServiceV2.validatePurchase(songId, userId, tier)
    if (!isValidToken) {
      return NextResponse.json(
        {
          error: "Invalid or expired download token",
        },
        { status: 403 },
      )
    }

    // Get song file path based on tier
    const filePath = `songs/${userId}/${songId}/${tier}/song-${tier}.${getFileExtension(tier)}`

    // Generate signed URL for secure download
    const signedUrl = await cloudStorage.getSignedUrl(filePath, 15) // 15 minutes expiry

    // Log download for analytics
    await logDownload(songId, userId, tier)

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl,
      expiresIn: 15 * 60 * 1000, // 15 minutes in milliseconds
      tier,
      message: "Download link generated successfully!",
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate download link",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function getFileExtension(tier: string): string {
  const extensions: Record<string, string> = {
    bonus: "mp3",
    base: "mp3",
    premium: "wav",
    ultra: "flac",
  }
  return extensions[tier] || "mp3"
}

async function logDownload(songId: number, userId: string, tier: string) {
  // Log download for analytics and tracking
  console.log(`Download: Song ${songId}, User ${userId}, Tier ${tier}`)
  // In production, save to analytics database
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
}
