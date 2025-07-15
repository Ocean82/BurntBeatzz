import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { readFile, writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const { chordProgression, tempo = 120, outputName } = await request.json()

    if (!chordProgression || !Array.isArray(chordProgression) || chordProgression.length === 0) {
      return NextResponse.json({ error: "Valid chord progression is required" }, { status: 400 })
    }

    // Create temporary Python script to generate MIDI
    const tempDir = join(process.cwd(), "storage", "temp")
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    const timestamp = Date.now()
    const scriptPath = join(tempDir, `generate_midi_${timestamp}.py`)
    const outputDir = join(process.cwd(), "storage", "midi", "generated")
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true })
    }

    const fileName = outputName ? `${outputName}.mid` : `chord_progression_${timestamp}.mid`
    const outputPath = join(outputDir, fileName)

    // Create Python script
    const pythonScript = `
import sys
import os
sys.path.append('${join(process.cwd(), "backend")}')

from chord_processor import ChordProcessor

processor = ChordProcessor()
chord_progression = ${JSON.stringify(chordProgression)}
tempo = ${tempo}
output_path = "${outputPath.replace(/\\/g, "/")}"

result = processor.generate_midi_from_chords(chord_progression, tempo, output_path)
if result:
    print(f"SUCCESS:{result}")
else:
    print("ERROR:Failed to generate MIDI")
`

    await writeFile(scriptPath, pythonScript)

    // Execute Python script
    const result = await new Promise<string>((resolve, reject) => {
      const pythonProcess = spawn("python3", [scriptPath])

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
          resolve(output.trim())
        } else {
          reject(new Error(`Python process failed with code ${code}: ${errorOutput}`))
        }
      })

      pythonProcess.on("error", (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`))
      })
    })

    if (result.startsWith("SUCCESS:")) {
      // Read the generated MIDI file and convert to base64
      const midiBuffer = await readFile(outputPath)
      const midiBase64 = midiBuffer.toString("base64")

      return NextResponse.json({
        success: true,
        fileName,
        outputPath: outputPath.replace(process.cwd(), ""),
        midiData: midiBase64,
        chordProgression,
        tempo,
      })
    } else {
      throw new Error("MIDI generation failed")
    }
  } catch (error) {
    console.error("MIDI generation error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 })
  }
}
