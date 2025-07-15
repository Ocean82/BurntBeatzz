import { NextResponse } from "next/server"
import { getDatabaseHealth, testDatabaseConnection } from "@/lib/database/connection"

export async function GET() {
  try {
    // Test basic connection
    const connectionTest = await testDatabaseConnection()

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          error: connectionTest.error,
          message: connectionTest.message,
        },
        { status: 500 },
      )
    }

    // Get detailed health info
    const healthData = await getDatabaseHealth()

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        ...healthData,
        connectionTest: connectionTest.message,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Database health check failed",
        message: "Failed to check database health",
      },
      { status: 500 },
    )
  }
}
