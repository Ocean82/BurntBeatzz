"use client"

import { useState, useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

export interface SongGenerationRequest {
  title: string
  lyrics: string
  genre: string
  style?: string
  tempo?: number
  key?: string
  timeSignature?: string
  mood?: string
  complexity?: "simple" | "moderate" | "complex"
  voiceId?: string
  includeStems?: boolean
  commercialRights?: boolean
  qualityLevel?: "standard" | "high" | "premium"
}

export interface GeneratedSong {
  songId: string
  title: string
  genre: string
  audioUrl: string
  stemUrls?: Record<string, string>
  composition: {
    structure: any
    qualityMetrics: {
      overallScore: number
      melodicCoherence: number
      harmonicRichness: number
      rhythmicConsistency: number
      structuralBalance: number
      productionQuality: number
      commercialReadiness: number
    }
    metadata: {
      duration: number
      sampleRate: number
      bitRate: string
      format: string
      fileSize: number
      commercialRights: boolean
      ownership: string
    }
  }
  voiceCloning?: {
    voiceId: string
    characteristics: any
    qualityScore: number
  }
  pricing: {
    standardDownload: number
    highQualityDownload: number
    premiumDownload: number
  }
  commercialRights: {
    ownership: string
    commercialUse: boolean
    royaltyFree: boolean
    exclusiveRights: boolean
  }
  downloadOptions: Array<{
    quality: string
    format: string
    price: number
    description: string
  }>
}

export interface GenerationProgress {
  stage: string
  progress: number
  message: string
  estimatedTimeRemaining?: number
}

export const useSongGeneration = ({ onGenerationComplete }: { onGenerationComplete: (song: any) => void }) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<GenerationProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generatedSong, setGeneratedSong] = useState<any | null>(null)
  const { toast } = useToast()

  const generateSongMutation = useMutation({
    mutationFn: async (songData: any) => {
      setIsGenerating(true)
      setError(null)
      setProgress(null)
      setGeneratedSong(null)

      console.log("🎵 Starting song generation:", songData.title)

      // Stage 1: Initialize
      setProgress({
        stage: "initializing",
        progress: 5,
        message: "Initializing Python music21 backend...",
        estimatedTimeRemaining: 45,
      })

      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Stage 2: Music Theory Analysis
      setProgress({
        stage: "analyzing",
        progress: 15,
        message: "Analyzing lyrics and musical structure with music21...",
        estimatedTimeRemaining: 40,
      })

      // Call Python backend for music21 analysis
      const analysisResponse = await fetch("/api/backend/analyze-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lyrics: songData.lyrics,
          genre: songData.genre,
          tempo: songData.tempo,
          key: songData.key,
          mood: songData.mood,
        }),
      })

      if (!analysisResponse.ok) {
        throw new Error("Music analysis failed")
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Stage 3: Melody Generation with music21
      setProgress({
        stage: "composing",
        progress: 30,
        message: "Generating melody and harmony with music21...",
        estimatedTimeRemaining: 35,
      })

      const melodyResponse = await fetch("/api/backend/generate-melody", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre: songData.genre,
          mood: songData.mood,
          tempo: songData.tempo,
          key: songData.key,
          complexity: songData.complexity,
        }),
      })

      if (!melodyResponse.ok) {
        throw new Error("Melody generation failed")
      }

      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Stage 4: Voice Processing (if applicable)
      if (songData.voiceId) {
        setProgress({
          stage: "voice_processing",
          progress: 50,
          message: "Processing voice model for singing...",
          estimatedTimeRemaining: 25,
        })

        const voiceResponse = await fetch("/api/backend/process-voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            voiceId: songData.voiceId,
            lyrics: songData.lyrics,
            melody: "melody_data", // From previous step
          }),
        })

        if (!voiceResponse.ok) {
          throw new Error("Voice processing failed")
        }

        await new Promise((resolve) => setTimeout(resolve, 4000))
      }

      // Stage 5: Audio Synthesis
      setProgress({
        stage: "synthesizing",
        progress: 70,
        message: "Synthesizing final audio track...",
        estimatedTimeRemaining: 15,
      })

      const synthesisResponse = await fetch("/api/backend/synthesize-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songId: `song_${Date.now()}`,
          includeStems: songData.includeStems,
          qualityLevel: songData.qualityLevel,
        }),
      })

      if (!synthesisResponse.ok) {
        throw new Error("Audio synthesis failed")
      }

      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Stage 6: Mastering
      setProgress({
        stage: "mastering",
        progress: 85,
        message: "Applying professional mastering...",
        estimatedTimeRemaining: 8,
      })

      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Stage 7: Upload and Finalize
      setProgress({
        stage: "finalizing",
        progress: 95,
        message: "Uploading to cloud storage...",
        estimatedTimeRemaining: 3,
      })

      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Call Python backend for real music generation
      const response = await fetch("/api/backend/generate-song", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(songData),
      })

      if (!response.ok) {
        throw new Error("Song generation failed")
      }

      const song = await response.json()

      // Stage 8: Complete
      setProgress({
        stage: "complete",
        progress: 100,
        message: "Song generation completed successfully!",
        estimatedTimeRemaining: 0,
      })

      console.log("✅ Song generation completed:", song.songId)
      setGeneratedSong(song)
      return song
    },
    onMutate: (songData) => {
      setGeneratingSong(songData)
    },
    onSuccess: (song) => {
      onGenerationComplete(song)
      toast({
        title: "🎵 Song Generated Successfully!",
        description: "Your AI-generated song is ready to play.",
      })
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate song. Please try again.",
        variant: "destructive",
      })
    },
    onSettled: () => {
      setGeneratingSong(null)
      setIsGenerating(false)
      setTimeout(() => setProgress(null), 3000)
    },
  })

  const generateSong = useCallback(
    (songData: any) => {
      generateSongMutation.mutate(songData)
    },
    [generateSongMutation],
  )

  const getSongById = useCallback(async (songId: string): Promise<any | null> => {
    try {
      const response = await fetch(`/api/songs/generate?songId=${songId}&userId=current-user-id`)

      if (!response.ok) {
        throw new Error("Failed to retrieve song")
      }

      return await response.json()
    } catch (err) {
      console.error("Failed to get song:", err)
      return null
    }
  }, [])

  const downloadSong = useCallback(async (songId: string, quality: string): Promise<string> => {
    try {
      const response = await fetch("/api/songs/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          songId,
          quality,
          userId: "current-user-id",
        }),
      })

      if (!response.ok) {
        throw new Error("Download failed")
      }

      const result = await response.json()
      return result.downloadUrl
    } catch (err) {
      console.error("Download failed:", err)
      throw err
    }
  }, [])

  const getQualityDescription = useCallback((score: number): string => {
    if (score >= 90) return "Exceptional - Studio quality"
    if (score >= 80) return "Excellent - Professional quality"
    if (score >= 70) return "Good - High quality"
    if (score >= 60) return "Fair - Acceptable quality"
    return "Needs improvement"
  }, [])

  const getCommercialReadinessDescription = useCallback((score: number): string => {
    if (score >= 85) return "Ready for commercial release"
    if (score >= 70) return "Suitable for most commercial uses"
    if (score >= 55) return "Good for personal/demo use"
    return "Recommended for practice/experimentation"
  }, [])

  const [generatingSong, setGeneratingSong] = useState<any | null>(null)

  return {
    generatingSong,
    generateSong,
    isGenerating: generateSongMutation.isPending,
    progress,
    error,
    generatedSong,
    getSongById,
    downloadSong,
    getQualityDescription,
    getCommercialReadinessDescription,
    clearError: () => setError(null),
    clearSong: () => setGeneratedSong(null),
  }
}
