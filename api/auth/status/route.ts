import { NextResponse } from "next/server"
import { getAuthStatus } from "@/lib/auth/stack-auth"

export async function GET() {
  try {
    const authStatus = await getAuthStatus()

    return NextResponse.json({
      success: authStatus.success,
      message: authStatus.success ? "Auth status retrieved" : "Auth status check failed",
      data: {
        ...authStatus,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Auth status check failed",
        message: "Failed to check authentication status",
      },
      { status: 500 },
    )
  }
}
