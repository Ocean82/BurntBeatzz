import { type NextRequest, NextResponse } from "next/server"
import { VocalBankQueries } from "@/lib/database/vocal-bank-queries"
import { requireAdmin } from "@/lib/middleware/auth-middleware"

export async function GET(request: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const pendingSamples = await VocalBankQueries.getPendingSamples(limit)

    return NextResponse.json({
      success: true,
      samples: pendingSamples,
      total: pendingSamples.length,
    })
  } catch (error) {
    console.error("Error fetching pending samples:", error)
    return NextResponse.json({ error: "Failed to fetch pending samples" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { user } = authResult

  try {
    const { sampleId, approved } = await request.json()

    if (typeof sampleId !== "number" || typeof approved !== "boolean") {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    await VocalBankQueries.moderateSample(sampleId, approved, user.id)

    return NextResponse.json({
      success: true,
      message: approved ? "Sample approved" : "Sample rejected",
    })
  } catch (error) {
    console.error("Error moderating sample:", error)
    return NextResponse.json({ error: "Failed to moderate sample" }, { status: 500 })
  }
}
