"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface ExportOptions {
  format: "json" | "csv" | "xml" | "zip" | "individual"
  repositories?: string[]
  fileTypes?: string[]
  includeMetadata?: boolean
  customFilter?: string
  maxFiles?: number
  sortBy?: "name" | "size" | "date" | "repository"
  sortOrder?: "asc" | "desc"
}

interface ExportPreview {
  totalFiles: number
  totalSize: number
  repositories: Record<string, number>
  fileTypes: Record<string, number>
  estimatedTime: number
  sampleFiles: string[]
}

interface ExportResult {
  success: boolean
  downloadUrl?: string
  filename?: string
  error?: string
  exportId: string
  timestamp: string
  options: ExportOptions
  stats: {
    filesProcessed: number
    totalSize: number
    duration: number
  }
}

export function useMidiExport() {
  const [exporting, setExporting] = useState(false)
  const [exportHistory, setExportHistory] = useState<ExportResult[]>([])
  const [preview, setPreview] = useState<ExportPreview | null>(null)
  const [loading, setLoading] = useState(false)

  const generatePreview = useCallback(async (options: ExportOptions): Promise<ExportPreview | null> => {
    setLoading(true)
    try {
      const response = await fetch("/api/midi/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...options, preview: true }),
      })

      const data = await response.json()

      if (data.success) {
        setPreview(data.preview)
        return data.preview
      } else {
        toast.error(`Preview failed: ${data.error}`)
        return null
      }
    } catch (error) {
      console.error("Preview error:", error)
      toast.error("Failed to generate preview")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const exportMidi = useCallback(async (options: ExportOptions): Promise<ExportResult | null> => {
    setExporting(true)

    try {
      const response = await fetch("/api/midi/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...options, preview: false }),
      })

      const result = await response.json()

      if (result.success) {
        setExportHistory((prev) => [result, ...prev.slice(0, 9)]) // Keep last 10
        toast.success(`Export completed! ${result.stats.filesProcessed} files processed`)
        return result
      } else {
        toast.error(`Export failed: ${result.error}`)
        return null
      }
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Export failed")
      return null
    } finally {
      setExporting(false)
    }
  }, [])

  const downloadExport = useCallback(async (result: ExportResult) => {
    if (!result.downloadUrl) {
      toast.error("No download URL available")
      return
    }

    try {
      const response = await fetch(result.downloadUrl)
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = result.filename || `midi_export_${result.exportId}.zip`
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

  const validateOptions = useCallback((options: ExportOptions): string[] => {
    const errors: string[] = []

    if (!options.format) {
      errors.push("Export format is required")
    }

    if (options.maxFiles && options.maxFiles < 1) {
      errors.push("Max files must be greater than 0")
    }

    if (options.repositories && options.repositories.length === 0) {
      errors.push("At least one repository must be selected")
    }

    return errors
  }, [])

  const clearHistory = useCallback(() => {
    setExportHistory([])
    toast.success("Export history cleared")
  }, [])

  const getExportStats = useCallback(() => {
    const totalExports = exportHistory.length
    const successfulExports = exportHistory.filter((e) => e.success).length
    const totalFilesProcessed = exportHistory.reduce((sum, e) => sum + e.stats.filesProcessed, 0)
    const totalSizeProcessed = exportHistory.reduce((sum, e) => sum + e.stats.totalSize, 0)

    return {
      totalExports,
      successfulExports,
      successRate: totalExports > 0 ? (successfulExports / totalExports) * 100 : 0,
      totalFilesProcessed,
      totalSizeProcessed,
      averageFilesPerExport: totalExports > 0 ? totalFilesProcessed / totalExports : 0,
    }
  }, [exportHistory])

  return {
    // State
    exporting,
    exportHistory,
    preview,
    loading,

    // Actions
    generatePreview,
    exportMidi,
    downloadExport,
    validateOptions,
    clearHistory,

    // Computed values
    stats: getExportStats(),
    hasHistory: exportHistory.length > 0,
  }
}
