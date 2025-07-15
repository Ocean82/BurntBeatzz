import { type NextRequest, NextResponse } from "next/server"
import { VocalBankQueries } from "@/lib/database/vocal-bank-queries"
import { VocalBankService } from "@/lib/services/vocal-bank-service"

// Mock database operations - replace with real database calls
const mockVocalBank = [
  {
    id: 1,
    anonymousName: "Midnight Echo",
    publicUrl: "/placeholder.mp3?voice=midnight",
    duration: 15,
    characteristics: { gender: "female", style: "smooth", timbre: "warm" },
    tags: ["female", "smooth", "warm", "pop", "r&b"],
    usageCount: 45,
    quality: "excellent",
  },
  {
    id: 2,
    anonymousName: "Golden Thunder",
    publicUrl: "/placeholder.mp3?voice=golden",
    duration: 12,
    characteristics: { gender: "male", style: "powerful", timbre: "bright" },
    tags: ["male", "powerful", "bright", "rock", "metal"],
    usageCount: 32,
    quality: "good",
  },
  {
    id: 3,
    anonymousName: "Crystal Whisper",
    publicUrl: "/placeholder.mp3?voice=crystal",
    duration: 18,
    characteristics: { gender: "female", style: "gentle", timbre: "light" },
    tags: ["female", "gentle", "light", "pop", "folk"],
    usageCount: 28,
    quality: "excellent",
  },
  {
    id: 4,
    anonymousName: "Deep Storm",
    publicUrl: "/placeholder.mp3?voice=storm",
    duration: 20,
    characteristics: { gender: "male", style: "emotional", timbre: "deep" },
    tags: ["male", "emotional", "deep", "blues", "jazz"],
    usageCount: 51,
    quality: "good",
  },
  {
    id: 5,
    anonymousName: "Silver Dream",
    publicUrl: "/placeholder.mp3?voice=silver",
    duration: 14,
    characteristics: { gender: "female", style: "clear", timbre: "bright" },
    tags: ["female", "clear", "bright", "pop", "electronic"],
    usageCount: 39,
    quality: "excellent",
  },
  {
    id: 6,
    anonymousName: "Velvet Fire",
    publicUrl: "/placeholder.mp3?voice=velvet",
    duration: 16,
    characteristics: { gender: "male", style: "smooth", timbre: "warm" },
    tags: ["male", "smooth", "warm", "r&b", "soul"],
    usageCount: 42,
    quality: "good",
  },
  {
    id: 7,
    anonymousName: "Neon Pulse",
    publicUrl: "/placeholder.mp3?voice=neon",
    duration: 13,
    characteristics: { gender: "female", style: "electric", timbre: "sharp" },
    tags: ["female", "electric", "sharp", "electronic", "dance"],
    usageCount: 35,
    quality: "excellent",
  },
  {
    id: 8,
    anonymousName: "Cosmic Wave",
    publicUrl: "/placeholder.mp3?voice=cosmic",
    duration: 19,
    characteristics: { gender: "male", style: "ethereal", timbre: "airy" },
    tags: ["male", "ethereal", "airy", "ambient", "electronic"],
    usageCount: 24,
    quality: "good",
  },
  {
    id: 9,
    anonymousName: "Wild Roar",
    publicUrl: "/placeholder.mp3?voice=wild",
    duration: 17,
    characteristics: { gender: "male", style: "raspy", timbre: "rough" },
    tags: ["male", "raspy", "rough", "rock", "grunge"],
    usageCount: 38,
    quality: "good",
  },
  {
    id: 10,
    anonymousName: "Gentle Breeze",
    publicUrl: "/placeholder.mp3?voice=breeze",
    duration: 21,
    characteristics: { gender: "female", style: "soft", timbre: "light" },
    tags: ["female", "soft", "light", "folk", "acoustic"],
    usageCount: 29,
    quality: "excellent",
  },
]

export async function GET(request: NextRequest) {
  try {
    // Authentication not required for reading public vocal bank
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter")
    const value = searchParams.get("value")
    const rotating = searchParams.get("rotating") === "true"
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let samples

    if (filter && value) {
      samples = await VocalBankQueries.getSamplesByFilter(filter, value, limit)
    } else {
      samples = await VocalBankQueries.getApprovedSamples(limit, offset)
    }

    // Apply rotation if requested
    if (rotating && samples.length > 7) {
      samples = VocalBankService.getRotatingSelection(samples)
    }

    return NextResponse.json({
      success: true,
      samples,
      total: samples.length,
      message: rotating ? "Daily rotating vocal selection" : "Vocal samples retrieved",
    })
  } catch (error) {
    console.error("Vocal bank fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch vocal samples" }, { status: 500 })
  }
}
