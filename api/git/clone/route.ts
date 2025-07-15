import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { url, directory = "." } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
    }

    // Clone the repository
    const command = directory === "." ? `git clone ${url} .` : `git clone ${url} ${directory}`

    const { stdout, stderr } = await execAsync(command)

    return NextResponse.json({
      success: true,
      message: "Repository cloned successfully",
      output: stdout,
      errors: stderr,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to clone repository",
      },
      { status: 500 },
    )
  }
}
