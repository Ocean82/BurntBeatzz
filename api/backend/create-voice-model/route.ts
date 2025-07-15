import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import { writeFile } from "fs/promises"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const voiceName = formData.get("name") as string
    const makePublic = formData.get("makePublic") === "true"

    if (!audioFile || !voiceName) {
      return NextResponse.json({ error: "Audio file and name are required" }, { status: 400 })
    }

    console.log("🎤 Creating voice model:", voiceName)

    // Save uploaded audio file temporarily
    const audioBuffer = await audioFile.arrayBuffer()
    const tempAudioPath = path.join(process.cwd(), "temp", `${Date.now()}_${audioFile.name}`)
    await writeFile(tempAudioPath, Buffer.from(audioBuffer))

    // Call Python voice cloning service
    const pythonScript = path.join(process.cwd(), "backend", "voice_cloning_service.py")

    const pythonProcess = spawn("python3", [pythonScript], {
      stdio: ["pipe", "pipe", "pipe"],
    })

    // Send data to Python script
    const inputData = JSON.stringify({
      audio_file_path: tempAudioPath,
      voice_name: voiceName,
      make_public: makePublic,
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
            const voiceModel = JSON.parse(output)
            resolve(voiceModel)
          } catch (parseError) {
            reject(new Error(`Failed to parse voice model output: ${parseError}`))
          }
        } else {
          reject(new Error(`Voice model creation failed with code ${code}: ${error}`))
        }
      })
    })

    console.log("✅ Voice model created successfully")
    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Voice model creation failed:", error)
    return NextResponse.json(
      { error: "Voice model creation failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
