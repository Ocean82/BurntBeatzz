import { type NextRequest, NextResponse } from "next/server"
import { AdvancedAIMusicService, type AdvancedMusicRequest } from "@/lib/services/advanced-ai-music-service"
import { GoogleCloudStorageService } from "@/lib/services/google-cloud-storage"
import { PricingServiceV2 } from "@/lib/services/pricing-service-v2"

export async function POST(request: NextRequest) {
  try {
    console.log("🎵 Advanced AI Music Generation Request Received")

    const body = await request.json()
    const {
      title,
      lyrics,
      genre = "pop",
      style = "modern",
      tempo = 120,
      key = "C",
      timeSignature = "4/4",
      mood = "upbeat",
      complexity = "moderate",
      voiceId,
      userId,
      includeStems = false,
      commercialRights = true,
      qualityLevel = "high",
    } = body

    if (!title || !lyrics || !userId) {
      return NextResponse.json({ error: "Missing required fields: title, lyrics, userId" }, { status: 400 })
    }

    // Create advanced music request
    const musicRequest: AdvancedMusicRequest = {
      title,
      lyrics,
      genre,
      style,
      tempo,
      key,
      timeSignature,
      mood,
      complexity,
      voiceId,
      userId,
      includeStems,
      commercialRights,
      qualityLevel,
    }

    console.log(`🎼 Generating: "${title}" | Genre: ${genre} | Quality: ${qualityLevel}`)

    // Generate advanced AI music
    const result = await AdvancedAIMusicService.generateAdvancedMusic(musicRequest)

    console.log(`✅ Generation completed with ${result.qualityMetrics.overallScore}% quality`)

    // Upload to Google Cloud Storage
    const uploadPromises = []

    // Upload main audio file
    const mainFileName = `songs/${userId}/${result.songId}/main.wav`
    uploadPromises.push(GoogleCloudStorageService.uploadBuffer(result.audioBuffer, mainFileName, "audio/wav"))

    // Upload stems if requested
    const stemUrls: Record<string, string> = {}
    if (includeStems && Object.keys(result.stems).length > 0) {
      for (const [stemType, stemBuffer] of Object.entries(result.stems)) {
        const stemFileName = `songs/${userId}/${result.songId}/stems/${stemType}.wav`
        uploadPromises.push(
          GoogleCloudStorageService.uploadBuffer(stemBuffer, stemFileName, "audio/wav").then((url) => {
            stemUrls[stemType] = url
          }),
        )
      }
    }

    // Wait for all uploads
    const [mainAudioUrl] = await Promise.all(uploadPromises)

    // Calculate pricing
    const pricing = PricingServiceV2.calculateSongPricing({
      qualityLevel,
      includeStems,
      commercialRights,
      duration: result.metadata.duration,
      hasVoiceCloning: !!voiceId,
    })

    // Prepare response
    const response = {
      success: true,
      songId: result.songId,
      title,
      genre,
      audioUrl: mainAudioUrl,
      stemUrls,
      composition: {
        structure: result.composition,
        qualityMetrics: result.qualityMetrics,
        metadata: result.metadata,
      },
      voiceCloning: result.voiceModel
        ? {
            voiceId: result.voiceModel.voiceId,
            characteristics: result.voiceModel.characteristics,
            qualityScore: result.voiceModel.qualityMetrics.overallScore,
          }
        : null,
      pricing,
      commercialRights: {
        ownership: result.metadata.ownership,
        commercialUse: commercialRights,
        royaltyFree: true,
        exclusiveRights: true,
      },
      downloadOptions: [
        {
          quality: "standard",
          format: "MP3 320kbps",
          price: pricing.standardDownload,
          description: "High quality MP3 for streaming and casual listening",
        },
        {
          quality: "high",
          format: "WAV 44.1kHz/16-bit",
          price: pricing.highQualityDownload,
          description: "CD quality WAV for professional use",
        },
        {
          quality: "premium",
          format: "WAV 96kHz/24-bit + Stems",
          price: pricing.premiumDownload,
          description: "Studio quality with individual stems for mixing",
        },
      ],
    }

    console.log(`💰 Pricing calculated: Standard $${pricing.standardDownload}, Premium $${pricing.premiumDownload}`)

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Advanced music generation failed:", error)

    return NextResponse.json(
      {
        error: "Music generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const songId = searchParams.get("songId")
  const userId = searchParams.get("userId")

  if (!songId || !userId) {
    return NextResponse.json({ error: "Missing songId or userId" }, { status: 400 })
  }

  try {
    // In production, retrieve from database
    // For now, return mock data
    const songData = {
      songId,
      title: "Generated Song",
      status: "completed",
      audioUrl: `https://storage.googleapis.com/burnt_beats_bucket/songs/${userId}/${songId}/main.wav`,
      createdAt: new Date().toISOString(),
      qualityMetrics: {
        overallScore: 85,
        melodicCoherence: 88,
        harmonicRichness: 82,
        productionQuality: 87,
      },
    }

    return NextResponse.json(songData)
  } catch (error) {
    console.error("Failed to retrieve song:", error)
    return NextResponse.json({ error: "Failed to retrieve song" }, { status: 500 })
  }
}
