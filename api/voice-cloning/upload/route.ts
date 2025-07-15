import { type NextRequest, NextResponse } from "next/server"
import { cloudStorage } from "@/lib/services/google-cloud-storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audio = formData.get("audio") as File
    const name = formData.get("name") as string
    const userId = formData.get("userId") as string
    const makePublic = formData.get("makePublic") === "true"

    if (!audio || !name || !userId) {
      return NextResponse.json(
        {
          error: "Audio file, name, and user ID are required",
        },
        { status: 400 },
      )
    }

    // Convert file to buffer
    const arrayBuffer = await audio.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Google Cloud Storage
    const uploadResult = await cloudStorage.uploadVoiceSample(buffer, userId, audio.name, {
      originalName: name,
      fileSize: audio.size,
      mimeType: audio.type,
      isPublic: makePublic,
    })

    // Create voice sample record in database
    const voiceSample = {
      id: `voice_${userId}_${Date.now()}`,
      userId,
      name,
      audioUrl: uploadResult.publicUrl,
      isPublic: makePublic,
      filePath: uploadResult.fileName,
      gsUrl: uploadResult.gsUrl,
      characteristics: {
        pitchRange: [180 + Math.random() * 100, 280 + Math.random() * 100] as [number, number],
        timbre: ["warm", "bright", "deep", "light"][Math.floor(Math.random() * 4)],
        clarity: 0.7 + Math.random() * 0.3,
        stability: 0.8 + Math.random() * 0.2,
        genreSuitability: {
          pop: 0.8 + Math.random() * 0.2,
          rock: 0.7 + Math.random() * 0.3,
          jazz: 0.6 + Math.random() * 0.4,
          classical: 0.5 + Math.random() * 0.5,
        },
      },
      createdAt: new Date(),
    }

    // In production, save to your database here
    // await saveVoiceSampleToDatabase(voiceSample)

    return NextResponse.json({
      success: true,
      voiceSample,
      message: "Voice sample uploaded successfully to Google Cloud Storage!",
    })
  } catch (error) {
    console.error("Voice sample upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to upload voice sample",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
