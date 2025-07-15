"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface MidiFile {
  name: string
  path: string
  downloadUrl: string
  size: number
  sizeFormatted: string
  category: string
  sha: string
}

interface SyncStats {
  totalFiles: number
  downloadedFiles: number
  categories: Record<string, number>
  totalSize: number
  lastSync: string
  syncDuration: number
}

interface UseLdrolezSyncReturn {
  files: MidiFile[]
  stats: SyncStats | null
  loading: boolean
  syncing: boolean
  error: string | null
  loadFiles: () => Promise<void>
  syncRepository: () => Promise<void>
  downloadFile: (file: MidiFile) => Promise<void>
  downloadBatch: (files: MidiFile[]) => Promise<void>
  searchFiles: (term: string) => MidiFile[]
  filterByCategory: (category: string) => MidiFile[]
}

export function useLdrolezSync(): UseLdrolezSyncReturn {
  const [files, setFiles] = useState<MidiFile[]>([])
  const [stats, setStats] = useState<SyncStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFiles = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/github/ldrolez-sync?repository=ldrolez/free-midi-chords")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load files")
      }

      if (data.success && data.files) {
        const processedFiles = data.files.map((file: any) => ({
          ...file,
          sizeFormatted: formatFileSize(file.size),
          category: getCategoryFromPath(file.path),
        }))

        setFiles(processedFiles)
        generateStats(processedFiles)
        toast.success(`Loaded ${processedFiles.length} MIDI files`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load files"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const syncRepository = useCallback(async () => {
    setSyncing(true)
    setError(null)

    try {
      const response = await fetch("/api/github/ldrolez-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syncAll: false,
          repositories: [
            {
              owner: "ldrolez",
              repo: "free-midi-chords",
              branch: "main",
              paths: ["", "chords", "progressions", "src/chords2midi", "midi", "data"],
            },
          ],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Sync failed")
      }

      if (data.success) {
        const processedFiles = data.files.map((file: any) => ({
          ...file,
          sizeFormatted: formatFileSize(file.size),
          category: getCategoryFromPath(file.path),
        }))

        setFiles(processedFiles)
        setStats(data.stats)
        toast.success(data.message || `Synced ${processedFiles.length} files`)
      } else {
        throw new Error(data.error || "Sync failed")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sync failed"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSyncing(false)
    }
  }, [])

  const downloadFile = useCallback(async (file: MidiFile) => {
    try {
      const response = await fetch("/api/github/midi-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          downloadUrl: file.downloadUrl,
          fileName: file.name,
        }),
      })

      if (!response.ok) {
        throw new Error("Download failed")
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Download failed")
      }

      // Create download link
      const binaryString = atob(result.data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const blob = new Blob([bytes], { type: "audio/midi" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Downloaded ${file.name}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Download failed"
      toast.error(`Failed to download ${file.name}: ${errorMessage}`)
      throw err
    }
  }, [])

  const downloadBatch = useCallback(
    async (filesToDownload: MidiFile[]) => {
      const maxConcurrent = 3
      const results = []

      for (let i = 0; i < filesToDownload.length; i += maxConcurrent) {
        const batch = filesToDownload.slice(i, i + maxConcurrent)
        const batchPromises = batch.map(async (file) => {
          try {
            await downloadFile(file)
            return { file, success: true }
          } catch (error) {
            return { file, success: false, error }
          }
        })

        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)

        // Small delay between batches
        if (i + maxConcurrent < filesToDownload.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      const successful = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length

      if (successful > 0) {
        toast.success(`Downloaded ${successful} files successfully`)
      }
      if (failed > 0) {
        toast.error(`Failed to download ${failed} files`)
      }

      return results
    },
    [downloadFile],
  )

  const searchFiles = useCallback(
    (term: string): MidiFile[] => {
      if (!term.trim()) return files

      const searchTerm = term.toLowerCase()
      return files.filter(
        (file) =>
          file.name.toLowerCase().includes(searchTerm) ||
          file.path.toLowerCase().includes(searchTerm) ||
          file.category.toLowerCase().includes(searchTerm),
      )
    },
    [files],
  )

  const filterByCategory = useCallback(
    (category: string): MidiFile[] => {
      if (category === "all") return files
      return files.filter((file) => file.category === category)
    },
    [files],
  )

  const generateStats = (fileList: MidiFile[]) => {
    const categories: Record<string, number> = {}
    let totalSize = 0

    fileList.forEach((file) => {
      categories[file.category] = (categories[file.category] || 0) + 1
      totalSize += file.size
    })

    setStats({
      totalFiles: fileList.length,
      downloadedFiles: fileList.length,
      categories,
      totalSize,
      lastSync: new Date().toISOString(),
      syncDuration: 0,
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const getCategoryFromPath = (path: string): string => {
    const pathLower = path.toLowerCase()
    if (pathLower.includes("chord")) return "Chords"
    if (pathLower.includes("progression")) return "Progressions"
    if (pathLower.includes("scale")) return "Scales"
    if (pathLower.includes("arpeggio")) return "Arpeggios"
    if (pathLower.includes("melody")) return "Melodies"
    if (pathLower.includes("bass")) return "Bass"
    if (pathLower.includes("drum")) return "Drums"
    if (pathLower.includes("src")) return "Source"
    return "Other"
  }

  return {
    files,
    stats,
    loading,
    syncing,
    error,
    loadFiles,
    syncRepository,
    downloadFile,
    downloadBatch,
    searchFiles,
    filterByCategory,
  }
}
