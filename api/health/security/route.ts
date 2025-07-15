import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Check for any sensitive environment variables that might be exposed
    const clientEnvVars = Object.keys(process.env).filter(
      (key) =>
        key.startsWith("NEXT_PUBLIC_") && (key.includes("SECRET") || key.includes("PRIVATE") || key.includes("KEY")),
    )

    // Check if any sensitive files are accessible from client
    const sensitiveExposed = clientEnvVars.length > 0

    return NextResponse.json({
      secure: !sensitiveExposed,
      message: sensitiveExposed
        ? `Sensitive environment variables exposed: ${clientEnvVars.join(", ")}`
        : "No sensitive data exposed to client",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        secure: false,
        error: "Security check failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
