import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { genre, mood, tempo, key, complexity, lyrics, voiceModelId } = await request.json()

    console.log("🎵 Generating song with Python backend...")

    // Step 1: Generate melody with music21
    const melodyResult = await generateMelody({ genre, mood, tempo, key, complexity, lyrics })

    // Step 2: If voice model is specified, create vocal track
    let vocalTrack = null
    if (voiceModelId && lyrics) {
      vocalTrack = await generateVocalTrack(voiceModelId, lyrics, melodyResult.melody)
    }

    // Step 3: Combine melody and vocals into final song
    const finalSong = await combineMelodyAndVocals(melodyResult, vocalTrack)

    console.log("✅ Song generation completed")
    return NextResponse.json(finalSong)
  } catch (error) {
    console.error("❌ Song generation failed:", error)
    return NextResponse.json(
      { error: "Song generation failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

async function generateMelody(params: any) {
  const pythonScript = path.join(process.cwd(), "backend", "melody_generator.py")

  const pythonProcess = spawn("python3", [pythonScript], {
    stdio: ["pipe", "pipe", "pipe"],
  })

  pythonProcess.stdin.write(JSON.stringify(params))
  pythonProcess.stdin.end()

  let output = ""
  let error = ""

  pythonProcess.stdout.on("data", (data) => {
    output += data.toString()
  })

  pythonProcess.stderr.on("data", (data) => {
    error += data.toString()
  })

  return new Promise((resolve, reject) => {
    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output)
          resolve(result)
        } catch (parseError) {
          reject(new Error(`Failed to parse melody output: ${parseError}`))
        }
      } else {
        reject(new Error(`Melody generation failed with code ${code}: ${error}`))
      }
    })
  })
}

async function generateVocalTrack(voiceModelId: string, lyrics: string, melody: any) {
  // This would use the voice model to generate vocals
  // For now, return placeholder
  return {
    voiceModelId,
    lyrics,
    audioPath: `/api/vocals/${voiceModelId}/generated.wav`,
    duration: melody.duration,
  }
}

async function combineMelodyAndVocals(melodyResult: any, vocalTrack: any) {
  // Combine melody and vocals into final song
  return {
    id: `song_${Date.now()}`,
    title: "Generated Song",
    genre: melodyResult.metadata.genre,
    mood: melodyResult.metadata.mood,
    tempo: melodyResult.metadata.tempo,
    key: melodyResult.metadata.key,
    duration: melodyResult.melody.duration,
    audioUrl: `/api/songs/generated_${Date.now()}.wav`,
    melody: melodyResult.melody,
    harmony: melodyResult.harmony,
    structure: melodyResult.structure,
    vocals: vocalTrack,
    metadata: melodyResult.metadata,
    createdAt: new Date().toISOString(),
  }
}
