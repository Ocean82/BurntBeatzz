import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json()

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: "Files array is required" }, { status: 400 })
    }

    const filesArg = files.join(" ")
    await execAsync(`git add ${filesArg}`)

    return NextResponse.json({
      success: true,
      message: `Added ${files.length} file(s) to staging area`,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to stage files",
      },
      { status: 500 },
    )
  }
}
