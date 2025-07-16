import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { genre, mood, tempo, key, complexity, lyrics, rvcModelPath, outputFormat = "wav" } = await request.json()

    console.log("🎵 Generating complete song with RVC vocals...")

    // Step 1: Generate MIDI with music21
    const midiResult = await generateMIDI({ genre, mood, tempo, key, complexity, lyrics })

    // Step 2: Convert MIDI vocals to RVC singing
    let rvcVocalPath = null
    if (rvcModelPath && lyrics) {
      rvcVocalPath = await convertMIDIToRVCVocals(midiResult.vocal_midi_path, rvcModelPath, lyrics, tempo, key)
    }

    // Step 3: Mix everything together
    const finalSong = await mixCompleteSong(midiResult.instrumental_midi_path, rvcVocalPath, tempo, key, outputFormat)

    console.log("✅ Complete song generation finished")
    return NextResponse.json({
      success: true,
      song: finalSong,
      metadata: {
        genre,
        mood,
        tempo,
        key,
        hasVocals: !!rvcVocalPath,
        format: outputFormat,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ Complete song generation failed:", error)
    return NextResponse.json(
      { error: "Complete song generation failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

async function generateMIDI(params: any) {
  const pythonScript = path.join(process.cwd(), "backend", "melody_generator.py")

  const pythonProcess = spawn("python3", [pythonScript], {
    stdio: ["pipe", "pipe", "pipe"],
  })

  // Enhanced parameters for MIDI generation
  const midiParams = {
    ...params,
    generate_separate_tracks: true, // Generate separate instrumental and vocal MIDI
    include_harmony: true,
    include_bass: true,
    include_drums: true,
  }

  pythonProcess.stdin.write(JSON.stringify(midiParams))
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
          reject(new Error(`Failed to parse MIDI generation output: ${parseError}`))
        }
      } else {
        reject(new Error(`MIDI generation failed with code ${code}: ${error}`))
      }
    })
  })
}

async function convertMIDIToRVCVocals(
  midiVocalPath: string,
  rvcModelPath: string,
  lyrics: string,
  tempo: number,
  key: string,
) {
  const pythonScript = path.join(process.cwd(), "backend", "rvc_voice_service.py")

  const pythonProcess = spawn("python3", [pythonScript], {
    stdio: ["pipe", "pipe", "pipe"],
  })

  const inputData = {
    command: "midi-convert",
    midi_path: midiVocalPath,
    model_path: rvcModelPath,
    lyrics: lyrics,
    tempo: tempo,
    key: key,
  }

  pythonProcess.stdin.write(JSON.stringify(inputData))
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
          resolve(result.output_path)
        } catch (parseError) {
          reject(new Error(`Failed to parse RVC vocal conversion output: ${parseError}`))
        }
      } else {
        reject(new Error(`RVC vocal conversion failed with code ${code}: ${error}`))
      }
    })
  })
}

async function mixCompleteSong(
  instrumentalMidiPath: string,
  rvcVocalPath: string | null,
  tempo: number,
  key: string,
  outputFormat: string,
) {
  const pythonScript = path.join(process.cwd(), "backend", "audio_mixer.py")

  const pythonProcess = spawn("python3", [pythonScript], {
    stdio: ["pipe", "pipe", "pipe"],
  })

  const inputData = {
    command: "mix",
    midi_path: instrumentalMidiPath,
    vocal_path: rvcVocalPath,
    tempo: tempo,
    key: key,
    format: outputFormat,
  }

  pythonProcess.stdin.write(JSON.stringify(inputData))
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
          resolve({
            audioPath: result.output_path,
            duration: 0, // Would be calculated from actual audio
            format: outputFormat,
            mixingDetails: {
              hasVocals: !!rvcVocalPath,
              instrumentalSource: "MIDI + SoundFont",
              vocalSource: rvcVocalPath ? "RVC" : null,
            },
          })
        } catch (parseError) {
          reject(new Error(`Failed to parse mixing output: ${parseError}`))
        }
      } else {
        reject(new Error(`Song mixing failed with code ${code}: ${error}`))
      }
    })
  })
}
