import { type NextRequest, NextResponse } from "next/server"
import { LicenseGenerator, type LicenseData } from "@/lib/services/license-generator"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { songTitle, userName, userEmail, fileSize, songDuration, genre, format, paymentIntentId } = body

    // Validate required fields
    if (!songTitle || !userName || !userEmail || !paymentIntentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate license data
    const licenseData: LicenseData = {
      songTitle,
      userName,
      userEmail,
      fileSize,
      purchaseDate: new Date(),
      licenseId: LicenseGenerator.generateLicenseId(),
      songDuration,
      genre,
      format,
    }

    // Generate license hash for verification
    const licenseHash = LicenseGenerator.calculateLicenseHash(licenseData)

    // In production, save to database
    const licenseRecord = {
      id: licenseData.licenseId,
      songTitle: licenseData.songTitle,
      userName: licenseData.userName,
      userEmail: licenseData.userEmail,
      fileSize: licenseData.fileSize,
      songDuration: licenseData.songDuration,
      genre: licenseData.genre,
      format: licenseData.format,
      purchaseDate: licenseData.purchaseDate,
      licenseHash,
      paymentIntentId,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("License created:", licenseRecord)

    // Generate the license document
    const licenseDocument = LicenseGenerator.generateLicenseDocument(licenseData)

    return NextResponse.json({
      success: true,
      license: {
        id: licenseData.licenseId,
        hash: licenseHash,
        document: licenseDocument,
        downloadUrl: `/api/license/download/${licenseData.licenseId}`,
        verificationUrl: `/verify/${licenseData.licenseId}`,
      },
      message: "Commercial license generated successfully",
    })
  } catch (error) {
    console.error("License generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate license",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const licenseId = searchParams.get("licenseId")

  if (!licenseId) {
    return NextResponse.json({ error: "License ID required" }, { status: 400 })
  }

  try {
    // In production, query database for license
    // For now, return mock data
    const mockLicense = {
      id: licenseId,
      songTitle: "Generated Song",
      userName: "User Name",
      userEmail: "user@example.com",
      status: "active",
      purchaseDate: new Date().toISOString(),
      verificationHash: "ABC123DEF456",
    }

    return NextResponse.json(mockLicense)
  } catch (error) {
    console.error("License retrieval error:", error)
    return NextResponse.json({ error: "Failed to retrieve license" }, { status: 500 })
  }
}
