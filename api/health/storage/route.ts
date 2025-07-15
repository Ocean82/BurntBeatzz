import { NextResponse } from "next/server"
import { GoogleCloudStorageService } from "@/lib/services/google-cloud-storage"

export async function GET() {
  try {
    const healthData = await GoogleCloudStorageService.getStorageHealth()

    return NextResponse.json({
      success: true,
      message: "Google Cloud Storage connection successful",
      data: {
        ...healthData,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Storage connection failed",
        message: "Failed to connect to Google Cloud Storage",
      },
      { status: 500 },
    )
  }
}
