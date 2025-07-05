import { type NextRequest, NextResponse } from "next/server"
import { AIMusicServiceV2 } from "@/lib/services/ai-music-service-v2"
import { cloudStorage } from "@/lib/services/google-cloud-storage"
import { requireAuth } from "@/lib/auth/stack-auth"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(request)

    const { songData } = await request.json()

    if (!songData) {
      return NextResponse.json({ error: "Song data is required" }, { status: 400 })
    }

    // Generate music with real AI
    const generationResult = await AIMusicServiceV2.generateMusic({
      lyrics: songData.lyrics,
      genre: songData.genre,
      style: songData.vocalStyle,
      tempo: songData.tempo,
      duration: songData.songLength,
      voiceId: songData.voiceId,
      title: songData.title,
      userId: user.id,
      provider: songData.provider || "suno",
    })

    const songId = `song_${user.id}_${Date.now()}`

    // Upload different quality versions to Google Cloud
    const qualityVersions = await cloudStorage.uploadMultipleQualities(
      generationResult.audioBuffer,
      user.id,
      songId,
      songData.title || "untitled",
    )

    // Upload stems if available
    let stems = {}
    if (generationResult.stems) {
      stems = await cloudStorage.uploadSongStems(generationResult.stems, user.id, songId)
    }

    // Create song record
    const song = {
      id: songId,
      userId: user.id,
      title: songData.title,
      lyrics: songData.lyrics,
      genre: songData.genre,
      vocalStyle: songData.vocalStyle,
      tempo: songData.tempo,
      songLength: songData.songLength,
      voiceId: songData.voiceId,
      status: "completed",
      generatedAudioPath: qualityVersions.standard.publicUrl,
      qualityVersions,
      stems,
      metadata: generationResult.metadata,
      fileSizeMB: generationResult.audioBuffer.length / (1024 * 1024),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // TODO: Save to database
    // await saveSongToDatabase(song)

    return NextResponse.json({
      success: true,
      song,
      message: `🔥 Song generated with ${generationResult.metadata.provider}!`,
    })
  } catch (error) {
    console.error("Song generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate song",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
