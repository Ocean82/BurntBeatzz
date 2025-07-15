"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

interface UseCloudStorageProps {
  userId: string
}

export const useCloudStorage = ({ userId }: UseCloudStorageProps) => {
  const { toast } = useToast()
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  // Upload voice sample
  const uploadVoiceSampleMutation = useMutation({
    mutationFn: async ({
      file,
      name,
      makePublic = false,
    }: {
      file: File
      name: string
      makePublic?: boolean
    }) => {
      const formData = new FormData()
      formData.append("audio", file)
      formData.append("name", name)
      formData.append("userId", userId)
      formData.append("makePublic", makePublic.toString())

      const response = await fetch("/api/voice-cloning/upload", {
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
        title: "🔥 Voice uploaded to cloud!",
        description: `${data.voiceSample.name} is now stored securely in Google Cloud.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      })
    },
  })

  // Generate song with cloud storage
  const generateSongMutation = useMutation({
    mutationFn: async (songData: any) => {
      const response = await fetch("/api/songs/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          songData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Generation failed")
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "🎵 Song generated and stored!",
        description: `"${data.song.title}" is ready for download in multiple qualities.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Generation failed",
        variant: "destructive",
      })
    },
  })

  // Download song
  const downloadSongMutation = useMutation({
    mutationFn: async ({
      songId,
      tier,
      downloadToken,
    }: {
      songId: number
      tier: string
      downloadToken: string
    }) => {
      const response = await fetch("/api/songs/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          songId,
          userId,
          tier,
          downloadToken,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Download failed")
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Trigger browser download
      window.open(data.downloadUrl, "_blank")

      toast({
        title: "⬇️ Download ready!",
        description: `Your ${data.tier} quality download is starting.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Download failed",
        variant: "destructive",
      })
    },
  })

  // Get user's files
  const {
    data: userFiles,
    isLoading: isLoadingFiles,
    refetch: refetchFiles,
  } = useQuery({
    queryKey: ["user-files", userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/files?userId=${userId}`)
      if (!response.ok) throw new Error("Failed to fetch files")
      return response.json()
    },
    enabled: !!userId,
  })

  return {
    // Upload functions
    uploadVoiceSample: uploadVoiceSampleMutation.mutate,
    isUploadingVoice: uploadVoiceSampleMutation.isPending,

    // Generation functions
    generateSong: generateSongMutation.mutate,
    isGenerating: generateSongMutation.isPending,

    // Download functions
    downloadSong: downloadSongMutation.mutate,
    isDownloading: downloadSongMutation.isPending,

    // File management
    userFiles,
    isLoadingFiles,
    refetchFiles,

    // Progress tracking
    uploadProgress,
  }
}
