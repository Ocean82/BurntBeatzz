import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Commit message is required" }, { status: 400 })
    }

    const { stdout } = await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`)

    // Extract commit hash from output
    const hashMatch = stdout.match(/\[.+?\s([a-f0-9]+)\]/)
    const hash = hashMatch ? hashMatch[1] : "unknown"

    return NextResponse.json({
      success: true,
      hash,
      message: "Changes committed successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to commit changes",
      },
      { status: 500 },
    )
  }
}
