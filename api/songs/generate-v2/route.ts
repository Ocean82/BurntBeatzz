import { AIMusicServiceV2 } from "@/lib/services/ai-music-service-v2"
import { cloudStorage } from "@/lib/services/google-cloud-storage"
import { requireAuth } from "@/lib/auth/stack-auth"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(request)

=======
import { AIMusicServiceV2 } from "@/lib/services/ai-music-service-v2"
import { cloudStorage } from "@/lib/services/google-cloud-storage"
import { requireAuth } from "@/lib/auth/stack-auth"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(request)

>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
    const { songData } = await request.json()

    if (!songData) {
      return NextResponse.json({ error: "Song data is required" }, { status: 400 })
    }

<<<<<<< HEAD
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
=======
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
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
      title: songData.title,
      lyrics: songData.lyrics,
      genre: songData.genre,
      vocalStyle: songData.vocalStyle,
      tempo: songData.tempo,
      songLength: songData.songLength,
      voiceId: songData.voiceId,
      status: "completed",
<<<<<<< HEAD
      audioUrl: qualityVersions.standard.url,
      qualityVersions,
      vocalInfo,
      metadata: {
        duration: parseDuration(songData.songLength || "3:00"),
        sampleRate: 44100,
        bitRate: "320kbps",
        format: "mp3",
        provider: "burnt-beats-ai",
        generatedAt: new Date().toISOString(),
      },
      fileSizeMB,
=======
      generatedAudioPath: qualityVersions.standard.publicUrl,
      qualityVersions,
      stems,
      metadata: generationResult.metadata,
      fileSizeMB: generationResult.audioBuffer.length / (1024 * 1024),
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
      createdAt: new Date(),
      updatedAt: new Date(),
    }

<<<<<<< HEAD
    console.log(`✅ Song generation completed: ${songData.title}`)
=======
    // TODO: Save to database
    // await saveSongToDatabase(song)
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd

    return NextResponse.json({
      success: true,
      song,
<<<<<<< HEAD
      message: `🔥 Song "${songData.title}" generated successfully!`,
      downloadUrl: qualityVersions.standard.url,
      previewUrl: qualityVersions.demo.url,
=======
      message: `🔥 Song generated with ${generationResult.metadata.provider}!`,
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
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
<<<<<<< HEAD

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const songId = searchParams.get("songId")
    const userId = searchParams.get("userId")

    if (!songId) {
      return NextResponse.json({ error: "Song ID required" }, { status: 400 })
    }

    // Mock song retrieval - in production, query database
    const song = {
      id: songId,
      title: "Generated Song",
      status: "completed",
      audioUrl: `/api/songs/${songId}/audio`,
      createdAt: new Date().toISOString(),
      metadata: {
        duration: 180,
        genre: "pop",
        tempo: 120,
      },
    }

    return NextResponse.json(song)
  } catch (error) {
    console.error("Failed to retrieve song:", error)
    return NextResponse.json({ error: "Failed to retrieve song" }, { status: 500 })
  }
}

// Helper functions
function parseDuration(duration: string): number {
  const [minutes, seconds] = duration.split(":").map(Number)
  return minutes * 60 + (seconds || 0)
}

async function generateQualityVersions(audioBuffer: Buffer, songId: string) {
  // Simulate different quality versions
  const baseUrl = `/api/songs/${songId}/download`

  return {
    demo: {
      quality: "demo",
      format: "mp3",
      bitrate: "128kbps",
      size: Math.round(audioBuffer.length * 0.3),
      url: `${baseUrl}?quality=demo`,
      hasWatermark: true,
    },
    standard: {
      quality: "standard",
      format: "mp3",
      bitrate: "320kbps",
      size: audioBuffer.length,
      url: `${baseUrl}?quality=standard`,
      hasWatermark: false,
    },
    high: {
      quality: "high",
      format: "wav",
      bitrate: "1411kbps",
      size: Math.round(audioBuffer.length * 4.5),
      url: `${baseUrl}?quality=high`,
      hasWatermark: false,
    },
    ultra: {
      quality: "ultra",
      format: "flac",
      bitrate: "lossless",
      size: Math.round(audioBuffer.length * 2.8),
      url: `${baseUrl}?quality=ultra`,
      hasWatermark: false,
    },
  }
}
=======
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
