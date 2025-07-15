"use client"

import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface MidiFile {
  id: string
  originalName: string
  fileName: string
  size: number
  uploadedAt: string
  midiInfo?: {
    format: number
    tracks: number
    division: number
    estimatedDuration: number
  }
}

interface MidiAnalysis {
  format: number
  tracks: number
  duration: number
  tempo: number
  time_signature: number[]
  key_signature: string
  instruments: number[]
  note_range: { min: number; max: number }
  complexity_score: number
  genre_hints: string[]
  track_info: Array<{
    index: number
    name: string
    instrument: number | null
    notes: number
    is_drum: boolean
  }>
}

interface UploadProgress {
  progress: number
  stage: string
  message: string
}

export function useMidiUpload() {
  const [files, setFiles] = useState<MidiFile[]>([])
  const [selectedFile, setSelectedFile] = useState<MidiFile | null>(null)
  const [analysis, setAnalysis] = useState<MidiAnalysis | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    stage: "idle",
    message: "",
  })
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".mid") && !file.name.toLowerCase().endsWith(".midi")) {
        setError("Please select a MIDI file (.mid or .midi)")
        return null
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("File too large. Maximum size is 5MB")
        return null
      }

      setIsUploading(true)
      setError(null)
      setUploadProgress({
        progress: 0,
        stage: "uploading",
        message: "Preparing upload...",
      })

      try {
        const formData = new FormData()
        formData.append("file", file)

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
            message: "Uploading file...",
          }))
        }, 200)

        const response = await fetch("/api/midi/upload", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Upload failed")
        }

        const result = await response.json()

        setUploadProgress({
          progress: 100,
          stage: "complete",
          message: "Upload completed successfully",
        })

        // Add to files list
        setFiles((prev) => [result.file, ...prev])
        setSelectedFile(result.file)

        // Reset progress after delay
        setTimeout(() => {
          setUploadProgress({
            progress: 0,
            stage: "idle",
            message: "",
          })
        }, 2000)

        return result.file
      } catch (error) {
        setError(error instanceof Error ? error.message : "Upload failed")
        setUploadProgress({
          progress: 0,
          stage: "error",
          message: "Upload failed",
        })
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [toast],
  )

  const analyzeFile = useCallback(
    async (file: MidiFile) => {
      setIsAnalyzing(true)
      setError(null)

      try {
        const response = await fetch("/api/midi/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ midiId: file.id }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Analysis failed")
        }

        const result = await response.json()
        setAnalysis(result.analysis)
        toast({
          title: "Analysis Complete",
          description: "MIDI file has been analyzed successfully",
        })
        return result.analysis
      } catch (error) {
        setError(error instanceof Error ? error.message : "Analysis failed")
        toast({
          title: "Analysis Failed",
          description: error instanceof Error ? error.message : "Analysis failed",
          variant: "destructive",
        })
        return null
      } finally {
        setIsAnalyzing(false)
      }
    },
    [toast],
  )

  const processFile = useCallback(
    async (
      file: MidiFile,
      options: {
        outputFormat?: string
        soundfont?: string
        tempo?: number
        volume?: number
      } = {},
    ) => {
      setIsProcessing(true)
      setError(null)

      try {
        const response = await fetch("/api/midi/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            midiId: file.id,
            ...options,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Processing failed")
        }

        const result = await response.json()
        toast({
          title: "Processing Complete",
          description: "Your MIDI has been processed successfully",
        })
        return result.audioFile
      } catch (error) {
        setError(error instanceof Error ? error.message : "Processing failed")
        toast({
          title: "Processing Failed",
          description: error instanceof Error ? error.message : "Processing failed",
          variant: "destructive",
        })
        return null
      } finally {
        setIsProcessing(false)
      }
    },
    [toast],
  )

  const convertToRVC = useCallback(
    async (
      file: MidiFile,
      options: {
        rvcModelPath: string
        pitchShift?: number
        lyrics?: string
        outputFormat?: string
      },
    ) => {
      setIsProcessing(true)
      setError(null)

      try {
        const response = await fetch("/api/midi/convert-rvc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            midiId: file.id,
            ...options,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "RVC conversion failed")
        }

        const result = await response.json()
        toast({
          title: "RVC Conversion Complete",
          description: "Your MIDI has been converted to vocals successfully",
        })
        return result.audioFile
      } catch (error) {
        setError(error instanceof Error ? error.message : "RVC conversion failed")
        toast({
          title: "RVC Conversion Failed",
          description: error instanceof Error ? error.message : "RVC conversion failed",
          variant: "destructive",
        })
        return null
      } finally {
        setIsProcessing(false)
      }
    },
    [toast],
  )

  const loadFiles = useCallback(async () => {
    try {
      const response = await fetch("/api/midi/upload")
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error("Failed to load files:", error)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    files,
    selectedFile,
    analysis,
    isUploading,
    isAnalyzing,
    isProcessing,
    uploadProgress,
    error,
    uploadFile,
    analyzeFile,
    processFile,
    convertToRVC,
    loadFiles,
    setSelectedFile,
    clearError,
  }
}
