import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { sourceBranch, targetBranch } = await request.json()

    if (!sourceBranch || !targetBranch) {
      return NextResponse.json({ error: "Source and target branches are required" }, { status: 400 })
    }

    // First checkout target branch
    await execAsync(`git checkout ${targetBranch}`)

    // Then merge source branch
    await execAsync(`git merge ${sourceBranch}`)

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${sourceBranch} into ${targetBranch}`,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to merge branches",
      },
      { status: 500 },
    )
  }
}
