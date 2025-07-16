import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs/promises"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { melody, harmony, tempo = 120, key = "C", outputFormat = "wav", duration = 30 } = body

    // Validate required parameters
    if (!melody) {
      return NextResponse.json({ error: "Melody data is required" }, { status: 400 })
    }

    // Create temporary directory for processing
    const tempDir = path.join(process.cwd(), "temp", `synthesis_${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })

    // Write melody data to temporary file
    const melodyFile = path.join(tempDir, "melody.json")
    await fs.writeFile(
      melodyFile,
      JSON.stringify({
        melody,
        harmony,
        tempo,
        key,
        duration,
      }),
    )

    // Path to Python synthesizer script
    const pythonScript = path.join(process.cwd(), "backend", "audio_synthesizer.py")
    const outputFile = path.join(tempDir, `output.${outputFormat}`)

    // Execute Python synthesizer
    const result = await new Promise<{ success: boolean; error?: string; outputPath?: string }>((resolve) => {
      const pythonProcess = spawn("python3", [
        pythonScript,
        "--input",
        melodyFile,
        "--output",
        outputFile,
        "--format",
        outputFormat,
        "--tempo",
        tempo.toString(),
        "--key",
        key,
      ])

      let stdout = ""
      let stderr = ""

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString()
      })

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString()
      })

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          resolve({ success: true, outputPath: outputFile })
        } else {
          resolve({
            success: false,
            error: stderr || `Python process exited with code ${code}`,
          })
        }
      })

      pythonProcess.on("error", (error) => {
        resolve({
          success: false,
          error: `Failed to start Python process: ${error.message}`,
        })
      })

      // Set timeout for long-running processes
      setTimeout(() => {
        pythonProcess.kill()
        resolve({
          success: false,
          error: "Audio synthesis timed out",
        })
      }, 60000) // 60 second timeout
    })

    if (!result.success) {
      // Cleanup temp directory
      await fs.rm(tempDir, { recursive: true, force: true })

      return NextResponse.json({ error: result.error || "Audio synthesis failed" }, { status: 500 })
    }

    // Read the generated audio file
    const audioBuffer = await fs.readFile(result.outputPath!)

    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true })

    // Return audio file
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": outputFormat === "wav" ? "audio/wav" : "audio/mpeg",
        "Content-Disposition": `attachment; filename="synthesized_audio.${outputFormat}"`,
        "Content-Length": audioBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Audio synthesis error:", error)

    return NextResponse.json(
      {
        error: "Internal server error during audio synthesis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Audio synthesis endpoint",
    methods: ["POST"],
    parameters: {
      melody: "required - melody data object",
      harmony: "optional - harmony data object",
      tempo: "optional - tempo in BPM (default: 120)",
      key: "optional - musical key (default: C)",
      outputFormat: "optional - wav or mp3 (default: wav)",
      duration: "optional - duration in seconds (default: 30)",
    },
  })
}
