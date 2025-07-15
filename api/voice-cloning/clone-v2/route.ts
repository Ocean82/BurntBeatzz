import { type NextRequest, NextResponse } from "next/server"
import { AIMusicServiceV2 } from "@/lib/services/ai-music-service-v2"
import { cloudStorage } from "@/lib/services/google-cloud-storage"
import { requireAuth } from "@/lib/auth/stack-auth"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(request)

    const formData = await request.formData()
    const audio = formData.get("audio") as File
    const name = formData.get("name") as string

    if (!audio || !name) {
      return NextResponse.json({ error: "Audio file and name are required" }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await audio.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    // Clone voice with ElevenLabs
    const voiceId = await AIMusicServiceV2.cloneVoice(audioBuffer, name)

    // Upload original sample to Google Cloud
    const uploadResult = await cloudStorage.uploadVoiceSample(audioBuffer, user.id, audio.name, {
      originalName: name,
      voiceId,
      provider: "elevenlabs",
      fileSize: audio.size,
      mimeType: audio.type,
    })

    // Create voice sample record
    const voiceSample = {
      id: voiceId,
      userId: user.id,
      name,
      audioUrl: uploadResult.publicUrl,
      voiceId,
      provider: "elevenlabs",
      filePath: uploadResult.fileName,
      gsUrl: uploadResult.gsUrl,
      characteristics: {
        provider: "elevenlabs",
        quality: "high",
        language: "multilingual",
      },
      createdAt: new Date(),
    }

    // TODO: Save to database
    // await saveVoiceSampleToDatabase(voiceSample)

    return NextResponse.json({
      success: true,
      voiceSample,
      message: "🔥 Voice cloned successfully with ElevenLabs!",
    })
  } catch (error) {
    console.error("Voice cloning error:", error)
    return NextResponse.json(
      {
        error: "Failed to clone voice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
