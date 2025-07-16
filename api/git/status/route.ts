import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Get current branch
    const { stdout: branchOutput } = await execAsync("git branch --show-current")
    const currentBranch = branchOutput.trim()

    // Get status
    const { stdout: statusOutput } = await execAsync("git status --porcelain")
    const statusLines = statusOutput
      .trim()
      .split("\n")
      .filter((line) => line.length > 0)

    const staged: string[] = []
    const modified: string[] = []
    const untracked: string[] = []

    statusLines.forEach((line) => {
      const status = line.substring(0, 2)
      const file = line.substring(3)

      if (status[0] !== " " && status[0] !== "?") {
        staged.push(file)
      }
      if (status[1] === "M") {
        modified.push(file)
      }
      if (status === "??") {
        untracked.push(file)
      }
    })

    // Get ahead/behind info
    let ahead = 0
    let behind = 0
    try {
      const { stdout: aheadBehind } = await execAsync(
        `git rev-list --left-right --count origin/${currentBranch}...HEAD`,
      )
      const [behindCount, aheadCount] = aheadBehind.trim().split("\t")
      ahead = Number.parseInt(aheadCount) || 0
      behind = Number.parseInt(behindCount) || 0
    } catch {
      // Remote branch might not exist
    }

    return NextResponse.json({
      success: true,
      status: {
        branch: currentBranch,
        ahead,
        behind,
        staged,
        modified,
        untracked,
        clean: statusLines.length === 0,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get git status",
      },
      { status: 500 },
    )
  }
}
