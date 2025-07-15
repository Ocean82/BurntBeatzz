"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

interface VocalBankSample {
  id: number
  anonymousName: string
  publicUrl: string
  duration: number
  characteristics: {
    gender: string
    style: string
    timbre: string
  }
  tags: string[]
  usageCount: number
  quality: string
}

interface UseVocalBankProps {
  filter?: string
  value?: string
  rotating?: boolean
}

export const useVocalBank = ({ filter, value, rotating = true }: UseVocalBankProps = {}) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch vocal samples from bank
  const {
    data: vocalSamples = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/vocal-bank", filter, value, rotating],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter) params.append("filter", filter)
      if (value) params.append("value", value)
      if (rotating) params.append("rotating", "true")

      const response = await fetch(`/api/vocal-bank?${params}`)
      if (!response.ok) throw new Error("Failed to fetch vocal samples")

      const data = await response.json()
      return data.samples as VocalBankSample[]
    },
    staleTime: rotating ? 5 * 60 * 1000 : 10 * 60 * 1000, // 5 min for rotating, 10 min for filtered
  })

  // Upload vocal sample to bank
  const uploadVocalSampleMutation = useMutation({
    mutationFn: async ({
      file,
      userId,
      agreedToShare,
    }: {
      file: File
      userId: string
      agreedToShare: boolean
    }) => {
      const formData = new FormData()
      formData.append("audio", file)
      formData.append("userId", userId)
      formData.append("agreedToShare", agreedToShare.toString())

      const response = await fetch("/api/vocal-bank/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "🎤 Vocal Sample Uploaded!",
        description: data.message,
      })
      queryClient.invalidateQueries({ queryKey: ["/api/vocal-bank"] })
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Get samples by genre
  const getSamplesByGenre = (genre: string) => {
    return vocalSamples.filter((sample) => sample.tags.some((tag) => tag.toLowerCase().includes(genre.toLowerCase())))
  }

  // Get samples by gender
  const getSamplesByGender = (gender: string) => {
    return vocalSamples.filter((sample) => sample.characteristics.gender === gender)
  }

  // Get samples by style
  const getSamplesByStyle = (style: string) => {
    return vocalSamples.filter((sample) => sample.characteristics.style === style)
  }

  // Get high quality samples
  const getHighQualitySamples = () => {
    return vocalSamples.filter((sample) => sample.quality === "excellent")
  }

  // Get popular samples
  const getPopularSamples = () => {
    return [...vocalSamples].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5)
  }

  return {
    // Data
    vocalSamples,
    isLoading,
    error,

    // Actions
    uploadVocalSample: uploadVocalSampleMutation.mutate,
    refetch,

    // Filters
    getSamplesByGenre,
    getSamplesByGender,
    getSamplesByStyle,
    getHighQualitySamples,
    getPopularSamples,

    // Status
    isUploading: uploadVocalSampleMutation.isPending,
  }
}
