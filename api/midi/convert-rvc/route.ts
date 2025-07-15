import { type NextRequest, NextResponse } from "next/server"
import { rvcService } from "@/lib/services/rvc-integration-service"
import path from "path"
import { mkdir } from "fs/promises"

export async function POST(request: NextRequest) {
  try {
    const {
      midiId,
      rvcModelPath,
      pitchShift = 0,
      soundfont = "default",
      tempo = 1.0,
      lyrics,
      outputFormat = "wav",
      useScaleSample = false,
      scaleKey = "C",
      scaleType = "major_pentatonic",
    } = await request.json()

    if (!midiId || !rvcModelPath) {
      return NextResponse.json({ error: "MIDI ID and RVC model path are required" }, { status: 400 })
    }

    console.log("🎵 Starting MIDI to RVC conversion...")
    console.log("📁 MIDI ID:", midiId)
    console.log("🎤 RVC Model:", rvcModelPath)
    console.log("🎼 Scale Sample:", useScaleSample ? `${scaleKey} ${scaleType}` : "None")

    // Initialize RVC service
    await rvcService.initialize()

    // Prepare paths
    const midiPath = path.join(process.cwd(), "public", "midi", "uploads", `${midiId}.mid`)
    const outputDir = path.join(process.cwd(), "public", "audio", "rvc-converted")
    await mkdir(outputDir, { recursive: true })

    const outputFileName = `${midiId}_rvc_${Date.now()}.${outputFormat}`
    const outputPath = path.join(outputDir, outputFileName)

    // Optional: Use scale sample as reference
    let scaleSamplePath = null
    if (useScaleSample) {
      scaleSamplePath = getScaleSamplePath(scaleKey, scaleType)
      console.log("🎼 Using scale sample:", scaleSamplePath)
    }

    // Convert MIDI to RVC vocals
    const result = await rvcService.convertMidiToRVC({
      midiPath,
      rvcModelPath,
      outputPath,
      soundfont,
      tempo,
      pitchShift,
      lyrics,
      scaleSamplePath,
    })

    console.log("✅ MIDI to RVC conversion completed")

    return NextResponse.json({
      success: true,
      audioFile: `/audio/rvc-converted/${outputFileName}`,
      conversion: {
        midiId,
        rvcModel: rvcModelPath,
        pitchShift,
        soundfont,
        tempo,
        hasLyrics: !!lyrics,
        useScaleSample,
        scaleKey: useScaleSample ? scaleKey : null,
        scaleType: useScaleSample ? scaleType : null,
        format: outputFormat,
        convertedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ MIDI to RVC conversion failed:", error)
    return NextResponse.json(
      {
        error: "RVC conversion failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function getScaleSamplePath(key: string, scaleType: string): string {
  // Map scale types to MPC sample paths
  const scaleTypeMap: Record<string, string> = {
    major_pentatonic: "Major/Major_Pentatonic",
    minor_pentatonic: "Minor/Minor_Pentatonic",
    major: "Major/Major_Scale",
    minor: "Minor/Minor_Scale",
    blues: "Blues/Blues_Scale",
    chromatic: "Chromatic/Chromatic_Scale",
  }

  const scalePath = scaleTypeMap[scaleType] || "Major/Major_Pentatonic"
  const keyFormatted = key.replace("#", "_Sharp").replace("b", "_Flat")

  return path.join(
    process.cwd(),
    "public",
    "audio",
    "samples",
    "MPC_SCALES_FULL_v1.0",
    "-1",
    scalePath,
    keyFormatted,
    "_.WAV",
  )
}
