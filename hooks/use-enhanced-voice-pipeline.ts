"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { useToast } from "./use-toast"

interface EnhancedVoiceRequest {
  text: string
  voiceId: string
  quality: "studio" | "high" | "medium" | "fast"
  speed?: number
  pitch?: number
  emotion?: string
  style?: string
}

interface EnhancedVoiceResponse {
  id: string
  audioUrl: string
  status: "processing" | "completed" | "failed"
  metadata: {
    duration: number
    quality: string
    fileSize: number
    adaptiveFilteringApplied?: boolean
    enhancementLevel?: string
  }
}

// Simple error handler for now
const useErrorHandler = () => ({
  handleError: (error: Error, message: string) => {
    console.error(message, error)
  },
})

const apiRequest = async (method: string, url: string, data?: any) => {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Network error" }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response
}

export const useEnhancedVoicePipeline = () => {
  const { toast } = useToast()
  const { handleError } = useErrorHandler()

  // Enhanced voice synthesis mutation
  const enhancedVoiceMutation = useMutation({
    mutationFn: async (request: EnhancedVoiceRequest): Promise<EnhancedVoiceResponse> => {
      const response = await apiRequest("POST", "/api/voice/enhanced-synthesis", request)
      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "🔥 Voice synthesis completed",
        description: "Your enhanced audio is ready to play with studio quality!",
      })
    },
    onError: (error) => {
      handleError(error as Error, "Enhanced voice synthesis failed")
      toast({
        title: "Voice Synthesis Failed",
        description: "Failed to generate enhanced voice. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Get voice processing status
  const useVoiceProcessing = (processId: string) => {
    return useQuery({
      queryKey: ["voice-processing", processId],
      queryFn: async (): Promise<EnhancedVoiceResponse> => {
        const response = await apiRequest("GET", `/api/voice/processing/${processId}`)
        return response.json()
      },
      enabled: !!processId,
      refetchInterval: (data) => {
        return data?.status === "processing" ? 2000 : false
      },
    })
  }

  // Get available voice models
  const useVoiceModels = () => {
    return useQuery({
      queryKey: ["voice-models"],
      queryFn: async () => {
        const response = await apiRequest("GET", "/api/voice/models")
        return response.json()
      },
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    })
  }

  // Voice quality analysis
  const analyzeVoiceQualityMutation = useMutation({
    mutationFn: async (audioFile: File) => {
      const formData = new FormData()
      formData.append("audio", audioFile)

      const response = await fetch("/api/voice/analyze-quality", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Quality analysis failed")
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "🎤 Voice analysis completed",
        description: `Quality score: ${data.qualityScore}% | Clarity: ${data.clarity}%`,
      })
    },
    onError: (error) => {
      handleError(error as Error, "Voice quality analysis failed")
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze voice quality. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Batch voice synthesis for multiple texts
  const batchVoiceSynthesisMutation = useMutation({
    mutationFn: async (requests: EnhancedVoiceRequest[]) => {
      const response = await apiRequest("POST", "/api/voice/batch-synthesis", { requests })
      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "🔥 Batch synthesis completed",
        description: `Successfully generated ${data.completed} voice samples!`,
      })
    },
    onError: (error) => {
      handleError(error as Error, "Batch voice synthesis failed")
    },
  })

  // Voice style transfer
  const voiceStyleTransferMutation = useMutation({
    mutationFn: async ({
      sourceVoiceId,
      targetStyle,
      text,
    }: {
      sourceVoiceId: string
      targetStyle: string
      text: string
    }) => {
      const response = await apiRequest("POST", "/api/voice/style-transfer", {
        sourceVoiceId,
        targetStyle,
        text,
      })
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "🎭 Style transfer completed",
        description: "Voice style has been successfully transferred!",
      })
    },
    onError: (error) => {
      handleError(error as Error, "Voice style transfer failed")
    },
  })

  return {
    // Enhanced voice synthesis
    enhanceVoice: enhancedVoiceMutation.mutate,
    isEnhancing: enhancedVoiceMutation.isPending,

    // Processing status tracking
    useVoiceProcessing,

    // Voice models
    useVoiceModels,

    // Quality analysis
    analyzeVoiceQuality: analyzeVoiceQualityMutation.mutate,
    isAnalyzing: analyzeVoiceQualityMutation.isPending,

    // Batch processing
    batchVoiceSynthesis: batchVoiceSynthesisMutation.mutate,
    isBatchProcessing: batchVoiceSynthesisMutation.isPending,

    // Style transfer
    voiceStyleTransfer: voiceStyleTransferMutation.mutate,
    isTransferring: voiceStyleTransferMutation.isPending,

    // Combined loading state
    isProcessing:
      enhancedVoiceMutation.isPending ||
      analyzeVoiceQualityMutation.isPending ||
      batchVoiceSynthesisMutation.isPending ||
      voiceStyleTransferMutation.isPending,
  }
}
