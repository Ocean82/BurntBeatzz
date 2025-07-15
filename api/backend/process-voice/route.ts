import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { voiceId, lyrics, melody } = await request.json()

    console.log("🎤 Processing voice model for singing...")

    // Call Python voice processing
    const pythonScript = path.join(process.cwd(), "backend", "voice_processor.py")

    const pythonProcess = spawn("python3", [pythonScript], {
      stdio: ["pipe", "pipe", "pipe"],
    })

    // Send data to Python script
    const inputData = JSON.stringify({
      action: "process_voice_for_singing",
      voice_id: voiceId,
      lyrics,
      melody_data: melody,
    })

    pythonProcess.stdin.write(inputData)
    pythonProcess.stdin.end()

    // Collect output
    let output = ""
    let error = ""

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString()
    })

    // Wait for process to complete
    const result = await new Promise((resolve, reject) => {
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const voiceResult = JSON.parse(output)
            resolve(voiceResult)
          } catch (parseError) {
            reject(new Error(`Failed to parse voice processing output: ${parseError}`))
          }
        } else {
          reject(new Error(`Voice processing failed with code ${code}: ${error}`))
        }
      })
    })

    console.log("✅ Voice processing completed")
    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Voice processing failed:", error)
    return NextResponse.json(
      { error: "Voice processing failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
