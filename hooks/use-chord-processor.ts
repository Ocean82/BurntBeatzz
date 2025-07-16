"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface ChordProcessorState {
  isProcessing: boolean
  isGenerating: boolean
  isUploading: boolean
  processedData: any | null
  generatedMidi: string | null
  error: string | null
  progress: number
}

interface ChordProcessorOptions {
  tempo: number
  velocity: number
  duration: number
  octave: number
  voicing: string
  rhythm: string
}

export function useChordProcessor() {
  const [state, setState] = useState<ChordProcessorState>({
    isProcessing: false,
    isGenerating: false,
    isUploading: false,
    processedData: null,
    generatedMidi: null,
    error: null,
    progress: 0,
  })

  const updateState = useCallback((updates: Partial<ChordProcessorState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const processZipFile = useCallback(
    async (file: File) => {
      updateState({ isProcessing: true, error: null, progress: 0 })

      try {
        const formData = new FormData()
        formData.append("file", file)

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          updateState((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
          }))
        }, 500)

        const response = await fetch("/api/chords/process-zip", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)

        if (!response.ok) {
          throw new Error(`Processing failed: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Processing failed")
        }

        updateState({
          isProcessing: false,
          processedData: result.data,
          progress: 100,
        })

        toast.success(`Processed ${result.data.totalChords} chords from ${result.data.chordSets.length} sets`)

        return result.data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        updateState({
          isProcessing: false,
          error: errorMessage,
          progress: 0,
        })
        toast.error(errorMessage)
        throw error
      }
    },
    [updateState],
  )

  const generateMidi = useCallback(
    async (chords: string[], options: ChordProcessorOptions) => {
      updateState({ isGenerating: true, error: null })

      try {
        const response = await fetch("/api/chords/generate-midi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chords, options }),
        })

        if (!response.ok) {
          throw new Error(`Generation failed: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "MIDI generation failed")
        }

        updateState({
          isGenerating: false,
          generatedMidi: result.midiData,
        })

        toast.success("MIDI generated successfully")

        return result.midiData
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        updateState({
          isGenerating: false,
          error: errorMessage,
        })
        toast.error(errorMessage)
        throw error
      }
    },
    [updateState],
  )

  const processSets = useCallback(
    async (chordSets: any[], options: any) => {
      updateState({ isProcessing: true, error: null })

      try {
        const response = await fetch("/api/chords/process-sets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chordSets, options }),
        })

        if (!response.ok) {
          throw new Error(`Set processing failed: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Set processing failed")
        }

        updateState({
          isProcessing: false,
          processedData: result.data,
        })

        toast.success(`Processed ${result.data.length} chord sets`)

        return result.data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        updateState({
          isProcessing: false,
          error: errorMessage,
        })
        toast.error(errorMessage)
        throw error
      }
    },
    [updateState],
  )

  const checkSystemStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/system/chord-processor-status")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "System check failed")
      }

      return result.details
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      updateState({ error: errorMessage })
      toast.error(`System check failed: ${errorMessage}`)
      throw error
    }
  }, [updateState])

  const runSystemTest = useCallback(async () => {
    try {
      const response = await fetch("/api/system/chord-processor-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runTest: true }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.errors?.join(", ") || "System test failed")
      }

      toast.success("All system tests passed")
      return result.testResults
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      updateState({ error: errorMessage })
      toast.error(`System test failed: ${errorMessage}`)
      throw error
    }
  }, [updateState])

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      isGenerating: false,
      isUploading: false,
      processedData: null,
      generatedMidi: null,
      error: null,
      progress: 0,
    })
  }, [])

  return {
    ...state,
    processZipFile,
    generateMidi,
    processSets,
    checkSystemStatus,
    runSystemTest,
    reset,
  }
}
