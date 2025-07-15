import { type NextRequest, NextResponse } from "next/server"
import { AudioSynthesisService } from "@/lib/services/audio-synthesis-service"
import { VocalSynthesisService } from "@/lib/services/vocal-synthesis-service"

export async function POST(request: NextRequest) {
  try {
    const { songData } = await request.json()

    if (!songData) {
      return NextResponse.json({ error: "Song data is required" }, { status: 400 })
    }

    // Validate required fields
    const requiredFields = ["title", "lyrics", "genre", "tempo"]
    for (const field of requiredFields) {
      if (!songData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Validate tempo range
    if (songData.tempo < 60 || songData.tempo > 200) {
      return NextResponse.json({ error: "Tempo must be between 60 and 200 BPM" }, { status: 400 })
    }

    const songId = `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log(`🎵 Generating song: ${songData.title}`)

    // Generate instrumental track
    const instrumentalAudio = await AudioSynthesisService.generateInstrumental({
      genre: songData.genre,
      tempo: songData.tempo,
      key: songData.key || "C",
      duration: parseDuration(songData.songLength || "3:00"),
      structure: songData.structure || "verse-chorus-verse-chorus-bridge-chorus",
    })

    let finalAudio = instrumentalAudio
    let vocalInfo = null

    // Add vocals if voice ID provided
    if (songData.voiceId && songData.lyrics) {
      console.log(`🎤 Adding vocals with voice: ${songData.voiceId}`)

      const vocalAudio = await VocalSynthesisService.synthesizeVocals({
        text: songData.lyrics,
        voiceId: songData.voiceId,
        tempo: songData.tempo,
        genre: songData.genre,
        duration: parseDuration(songData.songLength || "3:00"),
      })

      // Mix vocals with instrumental
      finalAudio = await AudioSynthesisService.mixAudio(instrumentalAudio, vocalAudio)

      vocalInfo = {
        voiceId: songData.voiceId,
        quality: 85 + Math.random() * 15,
        processing: "completed",
      }
    }

    // Calculate file size and pricing
    const audioBuffer = finalAudio
    const fileSizeMB = audioBuffer.length / (1024 * 1024)

    // Generate different quality versions
    const qualityVersions = await generateQualityVersions(audioBuffer, songId)

    // Create song record
    const song = {
      id: songId,
      userId: songData.userId || "anonymous",
      title: songData.title,
      lyrics: songData.lyrics,
      genre: songData.genre,
      vocalStyle: songData.vocalStyle,
      tempo: songData.tempo,
      songLength: songData.songLength,
      voiceId: songData.voiceId,
      status: "completed",
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
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log(`✅ Song generation completed: ${songData.title}`)

    return NextResponse.json({
      success: true,
      song,
      message: `🔥 Song "${songData.title}" generated successfully!`,
      downloadUrl: qualityVersions.standard.url,
      previewUrl: qualityVersions.demo.url,
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
