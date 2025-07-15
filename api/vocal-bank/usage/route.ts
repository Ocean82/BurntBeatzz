import { type NextRequest, NextResponse } from "next/server"
import { VocalBankQueries } from "@/lib/database/vocal-bank-queries"
import { requireAuth } from "@/lib/middleware/auth-middleware"

export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { sampleId } = await request.json()

    if (typeof sampleId !== "number") {
      return NextResponse.json({ error: "Invalid sample ID" }, { status: 400 })
    }

    // Increment usage count
    await VocalBankQueries.incrementUsageCount(sampleId)

    return NextResponse.json({
      success: true,
      message: "Usage recorded",
    })
  } catch (error) {
    console.error("Error recording usage:", error)
    return NextResponse.json({ error: "Failed to record usage" }, { status: 500 })
  }
}
