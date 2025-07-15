import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { genre, mood, tempo, key, complexity } = await request.json()

    console.log("🎵 Generating melody with music21...")

    // Call Python melody generator
    const pythonScript = path.join(process.cwd(), "backend", "melody_generator.py")

    const pythonProcess = spawn("python3", [pythonScript], {
      stdio: ["pipe", "pipe", "pipe"],
    })

    // Send data to Python script
    const inputData = JSON.stringify({
      action: "generate_melody",
      genre,
      mood,
      tempo,
      key,
      complexity,
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
            const melodyResult = JSON.parse(output)
            resolve(melodyResult)
          } catch (parseError) {
            reject(new Error(`Failed to parse melody output: ${parseError}`))
          }
        } else {
          reject(new Error(`Melody generation failed with code ${code}: ${error}`))
        }
      })
    })

    console.log("✅ Melody generation completed")
    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Melody generation failed:", error)
    return NextResponse.json(
      { error: "Melody generation failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
