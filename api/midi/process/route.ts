import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { readFile, mkdir } from "fs/promises"
import path from "path"

interface ProcessingOptions {
  midiId: string
  outputFormat?: "wav" | "mp3" | "flac"
  soundfont?: string
  tempo?: number
  volume?: number
  sampleRate?: number
  bitDepth?: number
}

export async function POST(request: NextRequest) {
  try {
    const {
      midiId,
      outputFormat = "wav",
      soundfont = "default",
      tempo = 1.0,
      volume = 0.8,
      sampleRate = 44100,
      bitDepth = 16,
    }: ProcessingOptions = await request.json()

    if (!midiId) {
      return NextResponse.json({ error: "MIDI ID is required" }, { status: 400 })
    }

    console.log("🎵 Starting MIDI processing...")
    console.log("📁 MIDI ID:", midiId)
    console.log("🎛️ Format:", outputFormat)
    console.log("🎼 Soundfont:", soundfont)

    // Prepare paths
    const midiPath = path.join(process.cwd(), "public", "midi", "uploads", `${midiId}.mid`)
    const outputDir = path.join(process.cwd(), "public", "audio", "processed")
    await mkdir(outputDir, { recursive: true })

    const outputFileName = `${midiId}_processed_${Date.now()}.${outputFormat}`
    const outputPath = path.join(outputDir, outputFileName)

    // Check if MIDI file exists
    try {
      await readFile(midiPath)
    } catch (error) {
      return NextResponse.json({ error: "MIDI file not found" }, { status: 404 })
    }

    // Process MIDI to audio
    const audioFile = await processMidiToAudio({
      midiPath,
      outputPath,
      soundfont,
      tempo,
      volume,
      sampleRate,
      bitDepth,
      outputFormat,
    })

    console.log("✅ MIDI processing completed")

    return NextResponse.json({
      success: true,
      audioFile: `/audio/processed/${outputFileName}`,
      processing: {
        midiId,
        outputFormat,
        soundfont,
        tempo,
        volume,
        sampleRate,
        bitDepth,
        processedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ MIDI processing failed:", error)
    return NextResponse.json(
      {
        error: "Processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function processMidiToAudio(options: {
  midiPath: string
  outputPath: string
  soundfont: string
  tempo: number
  volume: number
  sampleRate: number
  bitDepth: number
  outputFormat: string
}): Promise<string> {
  const { midiPath, outputPath, soundfont, tempo, volume, sampleRate, bitDepth, outputFormat } = options

  return new Promise((resolve, reject) => {
    // Get soundfont path
    const soundfontPath = getSoundfontPath(soundfont)

    // FluidSynth arguments
    const fluidArgs = [
      "-ni", // No interactive mode
      "-g",
      volume.toString(), // Gain/volume
      "-r",
      sampleRate.toString(), // Sample rate
      "-T",
      outputFormat, // Output format
      "-F",
      outputPath, // Output file
      soundfontPath, // Soundfont file
      midiPath, // MIDI input file
    ]

    // Add tempo adjustment if needed
    if (tempo !== 1.0) {
      fluidArgs.splice(6, 0, "-T", tempo.toString())
    }

    console.log("🎛️ FluidSynth command:", "fluidsynth", fluidArgs.join(" "))

    const fluidsynth = spawn("fluidsynth", fluidArgs)

    let stdout = ""
    let stderr = ""

    fluidsynth.stdout.on("data", (data) => {
      stdout += data.toString()
    })

    fluidsynth.stderr.on("data", (data) => {
      stderr += data.toString()
    })

    fluidsynth.on("close", (code) => {
      if (code === 0) {
        console.log("✅ FluidSynth processing completed")

        // If output format is not WAV, convert using FFmpeg
        if (outputFormat !== "wav") {
          convertAudioFormat(outputPath, outputFormat, bitDepth)
            .then(() => resolve(outputPath))
            .catch(reject)
        } else {
          resolve(outputPath)
        }
      } else {
        console.error("❌ FluidSynth failed:", stderr)
        reject(new Error(`FluidSynth processing failed: ${stderr || "Unknown error"}`))
      }
    })

    fluidsynth.on("error", (error) => {
      console.error("❌ Failed to start FluidSynth:", error)
      reject(new Error(`Failed to start FluidSynth: ${error.message}`))
    })
  })
}

async function convertAudioFormat(inputPath: string, format: string, bitDepth: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath.replace(/\.[^.]+$/, `.${format}`)

    const ffmpegArgs = [
      "-i",
      inputPath,
      "-acodec",
      getAudioCodec(format),
      "-ar",
      "44100", // Sample rate
      "-ac",
      "2", // Stereo
    ]

    // Add format-specific options
    if (format === "mp3") {
      ffmpegArgs.push("-b:a", "320k") // High quality MP3
    } else if (format === "flac") {
      ffmpegArgs.push("-compression_level", "8") // High compression FLAC
    }

    ffmpegArgs.push(outputPath)

    console.log("🎵 FFmpeg conversion:", "ffmpeg", ffmpegArgs.join(" "))

    const ffmpeg = spawn("ffmpeg", ffmpegArgs)

    let stderr = ""

    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString()
    })

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Audio format conversion completed")
        resolve()
      } else {
        console.error("❌ FFmpeg conversion failed:", stderr)
        reject(new Error(`Audio conversion failed: ${stderr}`))
      }
    })

    ffmpeg.on("error", (error) => {
      reject(new Error(`Failed to start FFmpeg: ${error.message}`))
    })
  })
}

function getSoundfontPath(soundfont: string): string {
  const soundfontsDir = path.join(process.cwd(), "soundfonts")

  const soundfontMap: Record<string, string> = {
    default: "FluidR3_GM.sf2",
    piano: "Piano_Collection.sf2",
    orchestral: "Orchestral_Strings.sf2",
    rock: "Rock_Kit.sf2",
    electronic: "Electronic_Synths.sf2",
    strings: "String_Ensemble.sf2",
    brass: "Brass_Section.sf2",
    woodwinds: "Woodwind_Ensemble.sf2",
    percussion: "Percussion_Kit.sf2",
    vintage: "Vintage_Synths.sf2",
  }

  const soundfontFile = soundfontMap[soundfont] || soundfontMap.default
  return path.join(soundfontsDir, soundfontFile)
}

function getAudioCodec(format: string): string {
  const codecMap: Record<string, string> = {
    wav: "pcm_s16le",
    mp3: "libmp3lame",
    flac: "flac",
    ogg: "libvorbis",
    aac: "aac",
  }

  return codecMap[format] || "pcm_s16le"
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const midiId = searchParams.get("midiId")

    if (!midiId) {
      return NextResponse.json({ error: "MIDI ID is required" }, { status: 400 })
    }

    // Check processing status (in a real app, this would check a database)
    const outputDir = path.join(process.cwd(), "public", "audio", "processed")
    const processedFiles = []

    try {
      const { readdir } = await import("fs/promises")
      const files = await readdir(outputDir)

      for (const file of files) {
        if (file.startsWith(midiId)) {
          processedFiles.push({
            fileName: file,
            filePath: `/audio/processed/${file}`,
            createdAt: new Date().toISOString(), // In real app, get from file stats
          })
        }
      }
    } catch (error) {
      // Directory doesn't exist or is empty
    }

    return NextResponse.json({
      success: true,
      midiId,
      processedFiles,
      total: processedFiles.length,
    })
  } catch (error) {
    console.error("Failed to get processing status:", error)
    return NextResponse.json(
      {
        error: "Failed to get processing status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
