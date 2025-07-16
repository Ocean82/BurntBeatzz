import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith(".zip")) {
      return NextResponse.json({ error: "Only ZIP files are allowed" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "storage", "uploads", "chord-sets")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save uploaded file
    const fileName = `${Date.now()}-${file.name}`
    const filePath = join(uploadsDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Process the ZIP file using Python script
    const result = await new Promise<any>((resolve, reject) => {
      const pythonProcess = spawn("python3", [
        join(process.cwd(), "backend", "chord_processor.py"),
        "--process-zip",
        filePath,
      ])

      let output = ""
      let errorOutput = ""

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output)
            resolve(result)
          } catch (e) {
            reject(new Error(`Failed to parse Python output: ${output}`))
          }
        } else {
          reject(new Error(`Python process failed with code ${code}: ${errorOutput}`))
        }
      })

      pythonProcess.on("error", (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`))
      })
    })

    return NextResponse.json({
      success: true,
      originalName: file.name,
      fileName,
      result,
    })
  } catch (error) {
    console.error("Chord ZIP processing error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Processing failed" }, { status: 500 })
  }
}
