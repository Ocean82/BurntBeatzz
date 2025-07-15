import { type NextRequest, NextResponse } from "next/server"
import { chordProcessorService } from "@/lib/services/chord-processor-service"

export async function GET() {
  try {
    const status = await chordProcessorService.checkSystemStatus()

    const isReady =
      status.pythonAvailable && status.dependenciesInstalled && status.scriptsExist && status.directoriesWritable

    return NextResponse.json({
      success: true,
      status: isReady ? "ready" : "error",
      details: status,
      message: isReady ? "System is ready for chord processing" : "System has configuration issues",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to check system status",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.runTest) {
      const testResults = await chordProcessorService.runSystemTest()

      return NextResponse.json({
        success: testResults.success,
        testResults: testResults.testResults,
        errors: testResults.errors,
        message: testResults.success ? "All system tests passed" : "Some system tests failed",
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid request",
      },
      { status: 400 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to run system test",
      },
      { status: 500 },
    )
  }
}
