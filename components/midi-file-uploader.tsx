"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileMusic, X, Music, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface MidiFileInfo {
  file: File
  id: string
  status: "pending" | "analyzing" | "completed" | "error"
  analysis?: {
    format: number
    tracks: number
    division: number
    estimatedDuration: number
    tempo?: number
    key?: string
    instruments?: string[]
  }
  error?: string
}

interface MidiFileUploaderProps {
  onFilesLoaded: (files: File[]) => void
  maxFiles?: number
  maxFileSize?: number // in MB
}

export function MidiFileUploader({ onFilesLoaded, maxFiles = 50, maxFileSize = 10 }: MidiFileUploaderProps) {
  const [files, setFiles] = useState<MidiFileInfo[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const analyzeFile = useCallback(async (file: File): Promise<MidiFileInfo["analysis"]> => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/midi/analyze", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const result = await response.json()
      return result.analysis
    } catch (error) {
      console.error("MIDI analysis error:", error)
      throw error
    }
  }, [])

  const processFiles = useCallback(
    async (newFiles: File[]) => {
      if (files.length + newFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`)
        return
      }

      const oversizedFiles = newFiles.filter((file) => file.size > maxFileSize * 1024 * 1024)
      if (oversizedFiles.length > 0) {
        toast.error(`Files must be smaller than ${maxFileSize}MB`)
        return
      }

      const midiFiles = newFiles.filter((file) => {
        const name = file.name.toLowerCase()
        return name.endsWith(".mid") || name.endsWith(".midi")
      })

      if (midiFiles.length === 0) {
        toast.error("Please select MIDI files (.mid or .midi)")
        return
      }

      if (midiFiles.length !== newFiles.length) {
        toast.warning(`${newFiles.length - midiFiles.length} non-MIDI files were ignored`)
      }

      const fileInfos: MidiFileInfo[] = midiFiles.map((file) => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: "pending",
      }))

      setFiles((prev) => [...prev, ...fileInfos])
      setIsAnalyzing(true)

      // Analyze files sequentially to avoid overwhelming the server
      for (const fileInfo of fileInfos) {
        setFiles((prev) => prev.map((f) => (f.id === fileInfo.id ? { ...f, status: "analyzing" } : f)))

        try {
          const analysis = await analyzeFile(fileInfo.file)
          setFiles((prev) => prev.map((f) => (f.id === fileInfo.id ? { ...f, status: "completed", analysis } : f)))
        } catch (error) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileInfo.id
                ? {
                    ...f,
                    status: "error",
                    error: error instanceof Error ? error.message : "Analysis failed",
                  }
                : f,
            ),
          )
        }

        // Small delay between analyses
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      setIsAnalyzing(false)
      onFilesLoaded(midiFiles)
      toast.success(`Added ${midiFiles.length} MIDI files`)
    },
    [files.length, maxFiles, maxFileSize, analyzeFile, onFilesLoaded],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      processFiles(droppedFiles)
    },
    [processFiles],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      processFiles(selectedFiles)
      // Reset input value to allow selecting the same files again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [processFiles],
  )

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== id))
      const remainingFiles = files.filter((f) => f.id !== id).map((f) => f.file)
      onFilesLoaded(remainingFiles)
    },
    [files, onFilesLoaded],
  )

  const clearAllFiles = useCallback(() => {
    setFiles([])
    onFilesLoaded([])
    toast.info("All files cleared")
  }, [onFilesLoaded])

  const getStatusIcon = (status: MidiFileInfo["status"]) => {
    switch (status) {
      case "pending":
        return <FileMusic className="h-4 w-4 text-gray-500" />
      case "analyzing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: MidiFileInfo["status"]) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "analyzing":
        return "default"
      case "completed":
        return "default"
      case "error":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const completedFiles = files.filter((f) => f.status === "completed").length
  const errorFiles = files.filter((f) => f.status === "error").length

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            MIDI File Uploader
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Drop MIDI files here</h3>
            <p className="text-muted-foreground mb-4">
              Or click to select files • Max {maxFiles} files • {maxFileSize}MB per file
            </p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
              <Upload className="h-4 w-4 mr-2" />
              Select Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".mid,.midi"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {files.length} files • {completedFiles} analyzed • {errorFiles} errors
              </div>
              <Button variant="outline" size="sm" onClick={clearAllFiles} disabled={isAnalyzing}>
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full">
              <div className="space-y-2">
                {files.map((fileInfo) => (
                  <div key={fileInfo.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(fileInfo.status)}
                      <div className="flex-1">
                        <div className="font-medium">{fileInfo.file.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatFileSize(fileInfo.file.size)}
                          {fileInfo.analysis && (
                            <>
                              {" • "}
                              {fileInfo.analysis.tracks} tracks
                              {" • "}
                              {formatDuration(fileInfo.analysis.estimatedDuration)}
                              {fileInfo.analysis.tempo && ` • ${fileInfo.analysis.tempo} BPM`}
                              {fileInfo.analysis.key && ` • Key: ${fileInfo.analysis.key}`}
                            </>
                          )}
                        </div>
                        {fileInfo.error && <div className="text-sm text-red-600">Error: {fileInfo.error}</div>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(fileInfo.status)}>{fileInfo.status}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => removeFile(fileInfo.id)} disabled={isAnalyzing}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {isAnalyzing && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing MIDI files...
                </div>
                <Progress value={(completedFiles / files.length) * 100} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {files.length === 0 && (
        <Alert>
          <FileMusic className="h-4 w-4" />
          <AlertDescription>
            Upload MIDI files to get started. Files will be analyzed to extract tempo, key, and track information for
            optimal RVC processing.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
