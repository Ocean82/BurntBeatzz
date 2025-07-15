"use client"

import { useState, useCallback } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

export interface VoiceSample {
  id: string
  userId: string
  name: string
  audioUrl: string
  anthemUrl?: string
  isPublic: boolean
  characteristics?: {
    pitchRange: [number, number]
    timbre: string
    clarity: number
    stability?: number
    genreSuitability?: {
      pop: number
      rock: number
      jazz: number
      classical: number
    }
  }
  createdAt: Date
}

interface UseVoiceCloningProps {
  userId: string
}

export const useVoiceCloningEnhanced = ({ userId }: UseVoiceCloningProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const { toast } = useToast()

  // Fetch available voices with better error handling
  const {
    data: voices = [],
    isLoading: isLoadingVoices,
    refetch: refetchVoices,
    error: voicesError,
  } = useQuery<VoiceSample[]>({
    queryKey: ["voices", userId],
    queryFn: async () => {
      const response = await fetch(`/api/voice-cloning?userId=${userId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || "Failed to fetch voices")
      }

      return response.json()
    },
    enabled: !!userId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Enhanced voice cloning mutation
  const cloneVoiceMutation = useMutation({
    mutationFn: async ({
      audio,
      name,
      makePublic,
      sampleText,
    }: {
      audio: Blob | string
      name: string
      makePublic: boolean
      sampleText?: string
    }) => {
      const formData = new FormData()

      if (audio instanceof Blob) {
        formData.append("audio", audio, "voice_sample.webm")
      } else {
        formData.append("audioUrl", audio)
      }

      formData.append("name", name)
      formData.append("makePublic", makePublic.toString())
      formData.append("userId", userId)
      formData.append("sampleText", sampleText || "Oh say can you see, by the dawn's early light...")

      const response = await fetch("/api/voice-cloning", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || "Voice cloning failed")
      }

      const result = await response.json()
      return result as VoiceSample
    },
    onSuccess: (voiceData) => {
      toast({
        title: "🔥 Voice Cloned Successfully!",
        description: `${voiceData.name} is ready for song generation! Both sample and anthem created.`,
      })
      refetchVoices()
      setRecordedBlob(null)
    },
    onError: (error) => {
      toast({
        title: "Voice Cloning Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    },
  })

  // Enhanced recording functions with better error handling
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      })

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      })

      const chunks: BlobPart[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType })
          setRecordedBlob(blob)
          toast({
            title: "Recording Complete",
            description: "Voice sample recorded successfully!",
          })
        } catch (error) {
          toast({
            title: "Recording Processing Failed",
            description: "Could not process the recording",
            variant: "destructive",
          })
        } finally {
          stream.getTracks().forEach((track) => track.stop())
          setIsRecording(false)
          setMediaRecorder(null)
        }
      }

      recorder.onerror = (event) => {
        console.error("Recording error:", event)
        toast({
          title: "Recording Error",
          description: "An error occurred during recording",
          variant: "destructive",
        })
        setIsRecording(false)
        setMediaRecorder(null)
      }

      recorder.start(100) // Collect data every 100ms
      setMediaRecorder(recorder)
      setIsRecording(true)

      toast({
        title: "🎤 Recording Started",
        description: "Speak clearly for 10-30 seconds for best results",
      })
    } catch (error) {
      console.error("Failed to start recording:", error)
      toast({
        title: "Recording Failed",
        description: "Microphone access denied or unavailable",
        variant: "destructive",
      })
    }
  }, [toast])

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop()
    }
  }, [mediaRecorder])

  // Voice analysis function
  const analyzeVoice = useCallback(async (audioBlob: Blob): Promise<VoiceSample["characteristics"]> => {
    // Simulate voice analysis - in production this would call actual analysis API
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return {
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
    }
  }, [])

  // Clone voice function
  const cloneVoice = useCallback(
    (audio: Blob | string, name: string, makePublic = false, sampleText?: string) => {
      cloneVoiceMutation.mutate({ audio, name, makePublic, sampleText })
    },
    [cloneVoiceMutation],
  )

  // Get voice by ID
  const getVoiceById = useCallback(
    (voiceId: string) => {
      return voices.find((voice) => voice.id === voiceId)
    },
    [voices],
  )

  // Filter voices by type
  const getPublicVoices = useCallback(() => {
    return voices.filter((voice) => voice.isPublic)
  }, [voices])

  const getUserVoices = useCallback(() => {
    return voices.filter((voice) => voice.userId === userId && !voice.isPublic)
  }, [voices, userId])

  return {
    // Data
    voices,
    recordedBlob,
    isRecording,
    mediaRecorder,

    // Loading states
    isLoadingVoices,
    isCloningVoice: cloneVoiceMutation.isPending,
    voicesError,

    // Actions
    startRecording,
    stopRecording,
    cloneVoice,
    analyzeVoice,
    refetchVoices,
    getVoiceById,
    getPublicVoices,
    getUserVoices,

    // Utilities
    clearRecording: () => setRecordedBlob(null),
    hasRecording: !!recordedBlob,
    recordingDuration: recordedBlob ? "Unknown" : "0:00", // Could be enhanced with actual duration tracking
  }
}
