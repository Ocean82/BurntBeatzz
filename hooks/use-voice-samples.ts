"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import type { VoiceSample, InsertVoiceSample } from "@shared/schema"

interface UseVoiceSamplesProps {
  userId: number
  enabled?: boolean
}

// Simple error handler and API request functions
const useErrorHandler = () => ({
  handleError: (error: Error, message: string) => {
    console.error(message, error)
  },
})

const apiRequest = async (method: string, url: string, data?: any) => {
  const options: RequestInit = {
    method,
    headers: data instanceof FormData ? {} : { "Content-Type": "application/json" },
  }

  if (data) {
    options.body = data instanceof FormData ? data : JSON.stringify(data)
  }

  const response = await fetch(url, options)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Network error" }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response
}

export const useVoiceSamples = ({ userId, enabled = true }: UseVoiceSamplesProps) => {
  const { toast } = useToast()
  const { handleError } = useErrorHandler()
  const queryClient = useQueryClient()

  // Fetch all voice samples for user
  const {
    data: voiceSamples = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/voice-samples", userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/voice-samples?userId=${userId}`)
      if (!response.ok) throw new Error("Failed to fetch voice samples")
      return response.json() as Promise<VoiceSample[]>
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Create voice sample mutation
  const createVoiceSampleMutation = useMutation({
    mutationFn: async (voiceSampleData: Omit<InsertVoiceSample, "userId">) => {
      const response = await apiRequest("POST", "/api/voice-samples", {
        ...voiceSampleData,
        userId,
      })
      if (!response.ok) throw new Error("Failed to create voice sample")
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "🎤 Voice sample created",
        description: "Your voice sample has been saved successfully",
      })
      queryClient.invalidateQueries({ queryKey: ["/api/voice-samples", userId] })
    },
    onError: (error) => {
      handleError(error as Error, "Creation failed")
      toast({
        title: "Creation Failed",
        description: "Failed to create voice sample. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Upload voice sample mutation
  const uploadVoiceSampleMutation = useMutation({
    mutationFn: async ({
      file,
      name,
      metadata,
    }: {
      file: File
      name: string
      metadata?: Record<string, any>
    }) => {
      const formData = new FormData()
      formData.append("audio", file)
      formData.append("name", name)
      formData.append("userId", userId.toString())

      if (metadata) {
        formData.append("metadata", JSON.stringify(metadata))
      }

      const response = await apiRequest("POST", "/api/voice-samples/upload", formData)
      if (!response.ok) throw new Error("Failed to upload voice sample")
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "🔥 Voice sample uploaded",
        description: "Your voice sample has been uploaded successfully",
      })
      queryClient.invalidateQueries({ queryKey: ["/api/voice-samples", userId] })
    },
    onError: (error) => {
      handleError(error as Error, "Upload failed")
      toast({
        title: "Upload Failed",
        description: "Failed to upload voice sample. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Delete voice sample mutation
  const deleteVoiceSampleMutation = useMutation({
    mutationFn: async (voiceSampleId: number) => {
      const response = await apiRequest("DELETE", `/api/voice-samples/${voiceSampleId}`)
      if (!response.ok) throw new Error("Failed to delete voice sample")
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "🗑️ Voice sample deleted",
        description: "The voice sample has been removed",
      })
      queryClient.invalidateQueries({ queryKey: ["/api/voice-samples", userId] })
    },
    onError: (error) => {
      handleError(error as Error, "Delete failed")
      toast({
        title: "Delete Failed",
        description: "Failed to delete voice sample. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Update voice sample mutation
  const updateVoiceSampleMutation = useMutation({
    mutationFn: async ({
      voiceSampleId,
      updates,
    }: {
      voiceSampleId: number
      updates: Partial<VoiceSample>
    }) => {
      const response = await apiRequest("PUT", `/api/voice-samples/${voiceSampleId}`, updates)
      if (!response.ok) throw new Error("Failed to update voice sample")
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "✅ Voice sample updated",
        description: "Your changes have been saved",
      })
      queryClient.invalidateQueries({ queryKey: ["/api/voice-samples", userId] })
    },
    onError: (error) => {
      handleError(error as Error, "Update failed")
      toast({
        title: "Update Failed",
        description: "Failed to update voice sample. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Get voice sample by ID
  const getVoiceSample = async (voiceSampleId: number): Promise<VoiceSample | null> => {
    try {
      const response = await apiRequest("GET", `/api/voice-samples/${voiceSampleId}`)
      if (!response.ok) return null
      return response.json()
    } catch (error) {
      handleError(error as Error, "Failed to fetch voice sample")
      return null
    }
  }

  // Get voice samples by type
  const getVoiceSamplesByType = (type: string) => {
    return voiceSamples.filter(
      (sample) =>
        sample.metadata &&
        typeof sample.metadata === "object" &&
        "voiceType" in sample.metadata &&
        sample.metadata.voiceType === type,
    )
  }

  // Get recent voice samples
  const getRecentVoiceSamples = (limit = 5) => {
    return voiceSamples
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }

  // Get voice samples by processing status
  const getProcessedVoiceSamples = () => {
    return voiceSamples.filter((sample) => sample.isProcessed)
  }

  const getUnprocessedVoiceSamples = () => {
    return voiceSamples.filter((sample) => !sample.isProcessed)
  }

  // Get voice samples statistics
  const getVoiceSampleStats = () => {
    const total = voiceSamples.length
    const processed = getProcessedVoiceSamples().length
    const unprocessed = getUnprocessedVoiceSamples().length
    const totalDuration = voiceSamples.reduce((sum, sample) => sum + (sample.duration || 0), 0)

    return {
      total,
      processed,
      unprocessed,
      totalDuration,
      averageDuration: total > 0 ? totalDuration / total : 0,
    }
  }

  return {
    // Data
    voiceSamples,
    isLoading,
    error,

    // Actions
    createVoiceSample: createVoiceSampleMutation.mutate,
    uploadVoiceSample: uploadVoiceSampleMutation.mutate,
    deleteVoiceSample: deleteVoiceSampleMutation.mutate,
    updateVoiceSample: updateVoiceSampleMutation.mutate,
    getVoiceSample,
    refetch,

    // Derived data
    getVoiceSamplesByType,
    getRecentVoiceSamples,
    getProcessedVoiceSamples,
    getUnprocessedVoiceSamples,
    getVoiceSampleStats,

    // Status
    isCreating: createVoiceSampleMutation.isPending,
    isUploading: uploadVoiceSampleMutation.isPending,
    isDeleting: deleteVoiceSampleMutation.isPending,
    isUpdating: updateVoiceSampleMutation.isPending,
    isProcessing:
      createVoiceSampleMutation.isPending ||
      uploadVoiceSampleMutation.isPending ||
      deleteVoiceSampleMutation.isPending ||
      updateVoiceSampleMutation.isPending,
  }
}
