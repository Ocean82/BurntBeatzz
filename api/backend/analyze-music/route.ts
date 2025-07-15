import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { lyrics, genre, tempo, key, mood } = await request.json()

    console.log("🎼 Starting music analysis with music21...")

    // Call Python backend for music21 analysis
    const pythonScript = path.join(process.cwd(), "backend", "analyze_music.py")

    const pythonProcess = spawn("python3", [pythonScript], {
      stdio: ["pipe", "pipe", "pipe"],
    })

    // Send data to Python script
    const inputData = JSON.stringify({
      lyrics,
      genre,
      tempo,
      key,
      mood,
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
            const analysisResult = JSON.parse(output)
            resolve(analysisResult)
          } catch (parseError) {
            reject(new Error(`Failed to parse Python output: ${parseError}`))
          }
        } else {
          reject(new Error(`Python script failed with code ${code}: ${error}`))
        }
      })
    })

    console.log("✅ Music analysis completed")
    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Music analysis failed:", error)
    return NextResponse.json(
      { error: "Music analysis failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
