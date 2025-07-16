import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { branch } = await request.json()

    if (!branch) {
      return NextResponse.json({ error: "Branch name is required" }, { status: 400 })
    }

    await execAsync(`git checkout ${branch}`)

    return NextResponse.json({
      success: true,
      message: `Successfully switched to branch ${branch}`,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to switch branch",
      },
      { status: 500 },
    )
  }
}
