"use client"

import { useState, useCallback } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { VoiceProcessingService } from "@/lib/services/voice-processing-service"

interface UseVoiceCloningProps {
  userId: string
}

export const useVoiceCloning = ({ userId }: UseVoiceCloningProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const { toast } = useToast()

  const voiceService = VoiceProcessingService.getInstance()

  // Get available voices
  const {
    data: voices = [],
    isLoading: isLoadingVoices,
    refetch: refetchVoices,
  } = useQuery({
    queryKey: ["voices", userId],
    queryFn: () => voiceService.getAvailableVoices(userId),
    enabled: !!userId,
  })

  // Clone voice mutation
  const cloneVoiceMutation = useMutation({
    mutationFn: async ({
      audio,
      name,
      makePublic,
    }: {
      audio: File | Blob
      name: string
      makePublic: boolean
    }) => {
      return voiceService.cloneVoice(userId, audio, name, makePublic)
    },
    onSuccess: (newVoice) => {
      toast({
        title: "🔥 Voice Cloned Successfully!",
        description: `${newVoice.name} is ready for song generation!`,
      })
      refetchVoices()
      setRecordedBlob(null)
    },
    onError: (error) => {
      toast({
        title: "Voice Cloning Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    },
  })

  // Voice analysis mutation
  const analyzeVoiceMutation = useMutation({
    mutationFn: (audioFile: File) => voiceService.analyzeVoiceCharacteristics(audioFile),
    onSuccess: (characteristics) => {
      toast({
        title: "Voice Analysis Complete",
        description: `Clarity: ${(characteristics.clarity * 100).toFixed(0)}% | Timbre: ${characteristics.timbre}`,
      })
    },
  })

  // Recording functions
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        setRecordedBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone",
        variant: "destructive",
      })
    }
  }, [toast])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
  }, [])

  const cloneVoice = useCallback(
    (audio: File | Blob, name: string, makePublic = false) => {
      cloneVoiceMutation.mutate({ audio, name, makePublic })
    },
    [cloneVoiceMutation],
  )

  const analyzeVoice = useCallback(
    (audioFile: File) => {
      analyzeVoiceMutation.mutate(audioFile)
    },
    [analyzeVoiceMutation],
  )

  return {
    // Data
    voices,
    recordedBlob,
    isRecording,

    // Loading states
    isLoadingVoices,
    isCloningVoice: cloneVoiceMutation.isPending,
    isAnalyzingVoice: analyzeVoiceMutation.isPending,

    // Actions
    startRecording,
    stopRecording,
    cloneVoice,
    analyzeVoice,
    refetchVoices,

    // Clear recorded blob
    clearRecording: () => setRecordedBlob(null),
  }
}
