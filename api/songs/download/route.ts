import { type NextRequest, NextResponse } from "next/server"
import { AudioSynthesisService } from "@/lib/services/audio-synthesis-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const songId = searchParams.get("songId")
    const quality = searchParams.get("quality") || "standard"

    if (!token && !songId) {
      return NextResponse.json({ error: "Download token or song ID required" }, { status: 400 })
    }

    // Validate download token if provided
    if (token) {
      const isValid = await validateDownloadToken(token)
      if (!isValid) {
        return NextResponse.json({ error: "Invalid or expired download token" }, { status: 403 })
      }
    }

    // Get song data
    const songData = await getSongData(songId || extractSongIdFromToken(token!))
    if (!songData) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 })
    }

    // Generate audio based on quality
    const audioBuffer = await generateAudioForQuality(songData, quality)

    // Set appropriate headers for download
    const headers = new Headers()
    headers.set("Content-Type", getContentType(quality))
    headers.set(
      "Content-Disposition",
      `attachment; filename="${songData.title}-${quality}.${getFileExtension(quality)}"`,
    )
    headers.set("Content-Length", audioBuffer.length.toString())
    headers.set("Cache-Control", "private, no-cache")

    return new NextResponse(audioBuffer, { headers })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}

// Validate download token
async function validateDownloadToken(token: string): Promise<boolean> {
  // Parse token format: dl_songId_userId_tier_timestamp_random
  const parts = token.split("_")
  if (parts.length !== 6 || parts[0] !== "dl") {
    return false
  }

  const timestamp = Number.parseInt(parts[4])
  const now = Date.now()
  const twentyFourHours = 24 * 60 * 60 * 1000

  // Check if token is expired (24 hours)
  if (now - timestamp > twentyFourHours) {
    return false
  }

  // In production, check against database records
  return true
}

// Extract song ID from token
function extractSongIdFromToken(token: string): string {
  const parts = token.split("_")
  return parts[1] || ""
}

// Get song data
async function getSongData(songId: string) {
  // In production, query database
  // For now, return mock data
  return {
    id: songId,
    title: "Generated Song",
    genre: "pop",
    tempo: 120,
    lyrics: "This is a generated song with AI vocals",
    duration: 180,
    voiceId: "voice_public_1",
  }
}

// Generate audio for specific quality
async function generateAudioForQuality(songData: any, quality: string): Promise<Buffer> {
  console.log(`🎵 Generating ${quality} quality audio for: ${songData.title}`)

  // Generate base audio
  const audioBuffer = await AudioSynthesisService.generateInstrumental({
    genre: songData.genre,
    tempo: songData.tempo,
    key: "C",
    duration: songData.duration,
    structure: "verse-chorus-verse-chorus-bridge-chorus",
  })

  // Apply quality-specific processing
  switch (quality) {
    case "demo":
      return await AudioSynthesisService.applyWatermark(audioBuffer)
    case "standard":
      return await AudioSynthesisService.compressToMP3(audioBuffer, 320)
    case "high":
      return audioBuffer // WAV format
    case "ultra":
      return await AudioSynthesisService.compressToFLAC(audioBuffer)
    default:
      return audioBuffer
  }
}

// Get content type for quality
function getContentType(quality: string): string {
  switch (quality) {
    case "demo":
    case "standard":
      return "audio/mpeg"
    case "high":
      return "audio/wav"
    case "ultra":
      return "audio/flac"
    default:
      return "audio/mpeg"
  }
}

// Get file extension for quality
function getFileExtension(quality: string): string {
  switch (quality) {
    case "demo":
    case "standard":
      return "mp3"
    case "high":
      return "wav"
    case "ultra":
      return "flac"
    default:
      return "mp3"
  }
}
