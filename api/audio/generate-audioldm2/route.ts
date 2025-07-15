import { type NextRequest, NextResponse } from "next/server"
import { audioLDM2Service } from "@/lib/services/audioldm2-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, duration, guidance_scale, num_inference_steps, seed, negative_prompt, type } = body

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 })
    }

    let result

    switch (type) {
      case "midi":
        result = await audioLDM2Service.generateMusicFromMidi(body.midiData, body.style)
        break
      case "drums":
        result = await audioLDM2Service.generateDrumTrack(body.genre, body.tempo)
        break
      case "bass":
        result = await audioLDM2Service.generateBassline(body.key, body.genre)
        break
      case "ambient":
        result = await audioLDM2Service.generateAmbientTexture(body.mood, duration)
        break
      case "enhance":
        result = await audioLDM2Service.enhanceAudioQuality(body.audioUrl)
        break
      default:
        result = await audioLDM2Service.generateAudio({
          prompt,
          duration,
          guidance_scale,
          num_inference_steps,
          seed,
          negative_prompt,
        })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("AudioLDM2 API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const config = audioLDM2Service.getConfig()

    return NextResponse.json({
      success: true,
      config: {
        model: config.model,
        maxDuration: config.maxDuration,
        sampleRate: config.sampleRate,
        available: !!config.apiKey,
      },
    })
  } catch (error) {
    console.error("AudioLDM2 config error:", error)
    return NextResponse.json({ success: false, error: "Failed to get config" }, { status: 500 })
  }
}
