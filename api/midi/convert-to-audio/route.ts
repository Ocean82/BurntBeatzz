import { type NextRequest, NextResponse } from "next/server"
import { audioLDM2Service } from "@/lib/services/audioldm2-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { midiData, style, prompt, duration, guidance_scale, num_inference_steps } = body

    if (!midiData) {
      return NextResponse.json({ success: false, error: "MIDI data is required" }, { status: 400 })
    }

    // Generate audio from MIDI using AudioLDM2
    const result = await audioLDM2Service.generateMusicFromMidi(midiData, style)

    if (result.success) {
      // Store the generation result in database if needed
      // await storeMidiToAudioGeneration(result)

      return NextResponse.json({
        success: true,
        audioUrl: result.audio_url,
        generationId: result.generation_id,
        duration: result.duration,
        metadata: result.metadata,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Audio generation failed",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("MIDI to audio conversion error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
