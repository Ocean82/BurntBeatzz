import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { branch, remote = "origin" } = await request.json()

    if (!branch) {
      return NextResponse.json({ error: "Branch name is required" }, { status: 400 })
    }

    await execAsync(`git push ${remote} ${branch}`)

    return NextResponse.json({
      success: true,
      message: `Successfully pushed ${branch} to ${remote}`,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to push changes",
      },
      { status: 500 },
    )
  }
}
