import { NextResponse } from "next/server"
import { githubConfig } from "@/lib/config/github-config"

export async function GET() {
  try {
    if (!githubConfig.token) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub token not configured",
          message: "GITHUB_TOKEN environment variable is missing",
        },
        { status: 500 },
      )
    }

    if (!githubConfig.isValidToken()) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid GitHub token format",
          message: "GitHub token does not match expected format",
        },
        { status: 400 },
      )
    }

    // Test token by making a request to GitHub API
    const response = await fetch(`${githubConfig.baseUrl}/user`, {
      headers: githubConfig.getHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        {
          success: false,
          error: `GitHub API error: ${response.status}`,
          message: errorData.message || "Failed to validate GitHub token",
          details: errorData,
        },
        { status: response.status },
      )
    }

    const userData = await response.json()

    // Get rate limit info
    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining")
    const rateLimitReset = response.headers.get("x-ratelimit-reset")

    return NextResponse.json({
      success: true,
      message: "GitHub token is valid",
      data: {
        user: {
          login: userData.login,
          id: userData.id,
          type: userData.type,
        },
        rateLimit: {
          remaining: rateLimitRemaining ? Number.parseInt(rateLimitRemaining) : null,
          resetTime: rateLimitReset ? new Date(Number.parseInt(rateLimitReset) * 1000).toISOString() : null,
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "GitHub validation failed",
        message: "Failed to validate GitHub token",
      },
      { status: 500 },
    )
  }
}
