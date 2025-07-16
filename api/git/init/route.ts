import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { remoteUrl, branch = "main" } = await request.json()

    if (!remoteUrl) {
      return NextResponse.json({ error: "Remote URL is required" }, { status: 400 })
    }

    // Initialize git repository
    await execAsync("git init")

    // Add remote origin
    await execAsync(`git remote add origin ${remoteUrl}`)

    // Set default branch
    await execAsync(`git branch -M ${branch}`)

    return NextResponse.json({
      success: true,
      message: "Repository initialized successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to initialize repository",
      },
      { status: 500 },
    )
  }
}
