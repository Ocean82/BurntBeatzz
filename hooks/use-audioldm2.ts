"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface AudioGenerationRequest {
  prompt: string
  duration?: number
  guidance_scale?: number
  num_inference_steps?: number
  seed?: number
  negative_prompt?: string
  type?: "default" | "midi" | "drums" | "bass" | "ambient" | "enhance"
  midiData?: string
  style?: string
  genre?: string
  tempo?: number
  key?: string
  mood?: string
  audioUrl?: string
}

interface AudioGenerationResult {
  success: boolean
  audio_url?: string
  audio_data?: string
  error?: string
  generation_id: string
  duration: number
  sample_rate: number
  metadata: {
    prompt: string
    model: string
    timestamp: string
    parameters: any
  }
}

export function useAudioLDM2() {
  const [generating, setGenerating] = useState(false)
  const [generationHistory, setGenerationHistory] = useState<AudioGenerationResult[]>([])
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/audio/generate-audioldm2")
      const data = await response.json()

      if (data.success) {
        setConfig(data.config)
      } else {
        toast.error("Failed to load AudioLDM2 config")
      }
    } catch (error) {
      console.error("Error loading config:", error)
      toast.error("Failed to load AudioLDM2 config")
    } finally {
      setLoading(false)
    }
  }, [])

  const generateAudio = useCallback(async (request: AudioGenerationRequest): Promise<AudioGenerationResult | null> => {
    setGenerating(true)

    try {
      const response = await fetch("/api/audio/generate-audioldm2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      })

      const result = await response.json()

      if (result.success) {
        setGenerationHistory((prev) => [result, ...prev.slice(0, 9)]) // Keep last 10
        toast.success("Audio generated successfully!")
        return result
      } else {
        toast.error(`Generation failed: ${result.error}`)
        return null
      }
    } catch (error) {
      console.error("Generation error:", error)
      toast.error("Audio generation failed")
      return null
    } finally {
      setGenerating(false)
    }
  }, [])

  const generateFromMidi = useCallback(
    async (midiData: string, style?: string) => {
      return generateAudio({
        prompt: `Musical composition ${style ? `in ${style} style` : ""}, high quality`,
        type: "midi",
        midiData,
        style,
        duration: 20,
      })
    },
    [generateAudio],
  )

  const generateDrumTrack = useCallback(
    async (genre: string, tempo: number) => {
      return generateAudio({
        prompt: `${genre} drum track, ${tempo} BPM`,
        type: "drums",
        genre,
        tempo,
        duration: 15,
      })
    },
    [generateAudio],
  )

  const generateBassline = useCallback(
    async (key: string, genre: string) => {
      return generateAudio({
        prompt: `${genre} bassline in ${key}`,
        type: "bass",
        key,
        genre,
        duration: 15,
      })
    },
    [generateAudio],
  )

  const generateAmbient = useCallback(
    async (mood: string, duration = 30) => {
      return generateAudio({
        prompt: `Ambient ${mood} texture`,
        type: "ambient",
        mood,
        duration,
      })
    },
    [generateAudio],
  )

  const enhanceAudio = useCallback(
    async (audioUrl: string) => {
      return generateAudio({
        prompt: "Enhanced audio quality",
        type: "enhance",
        audioUrl,
      })
    },
    [generateAudio],
  )

  const downloadAudio = useCallback(async (result: AudioGenerationResult) => {
    if (!result.audio_url) {
      toast.error("No audio URL available")
      return
    }

    try {
      const response = await fetch(result.audio_url)
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `audioldm2_${result.generation_id}.wav`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("Download started")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Download failed")
    }
  }, [])

  const clearHistory = useCallback(() => {
    setGenerationHistory([])
    toast.success("Generation history cleared")
  }, [])

  return {
    // State
    generating,
    generationHistory,
    config,
    loading,

    // Actions
    loadConfig,
    generateAudio,
    generateFromMidi,
    generateDrumTrack,
    generateBassline,
    generateAmbient,
    enhanceAudio,
    downloadAudio,
    clearHistory,

    // Computed values
    isAvailable: config?.available || false,
    totalGenerations: generationHistory.length,
  }
}
