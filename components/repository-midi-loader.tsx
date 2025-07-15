"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, Download, FolderOpen, FileMusic, Loader2, Music } from "lucide-react"
import { toast } from "sonner"

interface Repository {
  owner: string
  repo: string
  description: string
  currentPath: string
}

interface MidiFile {
  name: string
  path: string
  downloadUrl: string
  size: number
  sizeFormatted: string
}

interface Directory {
  name: string
  path: string
  type: "directory"
}

interface RepositoryData {
  success: boolean
  repository: Repository
  directories: Directory[]
  midiFiles: MidiFile[]
  stats: {
    totalDirectories: number
    totalMidiFiles: number
    totalSize: number
  }
}

interface RepositoryMidiLoaderProps {
  onFilesLoaded: (files: File[]) => void
}

export function RepositoryMidiLoader({ onFilesLoaded }: RepositoryMidiLoaderProps) {
  const [selectedRepo, setSelectedRepo] = useState("0")
  const [currentPath, setCurrentPath] = useState("")
  const [data, setData] = useState<RepositoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<string[]>([])
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({})

  const repositories = [
    { index: "0", name: "Burnt Beats Collection", description: "Main MIDI collection" },
    { index: "1", name: "Free MIDI Samples", description: "Community contributed samples" },
    { index: "2", name: "Professional Loops", description: "High-quality MIDI patterns" },
  ]

  const loadRepository = async (repoIndex: string, path = "") => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        repo: repoIndex,
        path,
      })

      const response = await fetch(`/api/github/load-midi-repository?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to load repository")
      }

      setData(result)
      setCurrentPath(path)
      toast.success(`Loaded ${result.midiFiles.length} MIDI files`)
    } catch (error) {
      console.error("Repository load error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load repository")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (file: MidiFile) => {
    const fileId = `${file.name}-${Date.now()}`
    setDownloading((prev) => [...prev, fileId])
    setDownloadProgress((prev) => ({ ...prev, [fileId]: 0 }))

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
        const error = await response.json()
        throw new Error(error.error || "Download failed")
      }

      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        setDownloadProgress((prev) => ({ ...prev, [fileId]: i }))
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      const result = await response.json()

      // Convert base64 to File
      const binaryString = atob(result.data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const midiFile = new File([bytes], result.fileName, { type: "audio/midi" })
      onFilesLoaded([midiFile])

      toast.success(`Downloaded ${file.name}`)
    } catch (error) {
      console.error("Download error:", error)
      toast.error(error instanceof Error ? error.message : "Download failed")
    } finally {
      setDownloading((prev) => prev.filter((id) => id !== fileId))
      setDownloadProgress((prev) => {
        const newProgress = { ...prev }
        delete newProgress[fileId]
        return newProgress
      })
    }
  }

  const downloadAllFiles = async () => {
    if (!data || data.midiFiles.length === 0) return

    const filesToDownload = data.midiFiles.slice(0, 10) // Limit to 10 files at once

    toast.info(`Starting batch download of ${filesToDownload.length} files...`)

    for (const file of filesToDownload) {
      await downloadFile(file)
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    toast.success(`Completed batch download of ${filesToDownload.length} files`)
  }

  const navigateToDirectory = (dirPath: string) => {
    loadRepository(selectedRepo, dirPath)
  }

  const navigateUp = () => {
    if (!currentPath) return
    const pathParts = currentPath.split("/").filter(Boolean)
    pathParts.pop()
    const parentPath = pathParts.join("/")
    loadRepository(selectedRepo, parentPath)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  useEffect(() => {
    loadRepository(selectedRepo)
  }, [selectedRepo])

  return (
    <div className="space-y-6">
      {/* Repository Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            MIDI Repository Loader
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Repository</label>
            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {repositories.map((repo) => (
                  <SelectItem key={repo.index} value={repo.index}>
                    <div>
                      <div className="font-medium">{repo.name}</div>
                      <div className="text-xs text-muted-foreground">{repo.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading repository contents...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repository Contents */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                {data.repository.owner}/{data.repository.repo}
                {currentPath && ` / ${currentPath}`}
              </div>
              <div className="flex items-center gap-2">
                {currentPath && (
                  <Button variant="outline" size="sm" onClick={navigateUp}>
                    ← Back
                  </Button>
                )}
                {data.midiFiles.length > 0 && (
                  <Button size="sm" onClick={downloadAllFiles}>
                    <Download className="h-4 w-4 mr-2" />
                    Download All ({Math.min(data.midiFiles.length, 10)})
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{data.stats.totalDirectories}</div>
                <div className="text-sm text-muted-foreground">Directories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data.stats.totalMidiFiles}</div>
                <div className="text-sm text-muted-foreground">MIDI Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatFileSize(data.stats.totalSize)}</div>
                <div className="text-sm text-muted-foreground">Total Size</div>
              </div>
            </div>

            {/* File Browser */}
            <ScrollArea className="h-96 w-full border rounded-md">
              <div className="p-4 space-y-2">
                {/* Directories */}
                {data.directories.map((dir) => (
                  <div
                    key={dir.path}
                    className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer"
                    onClick={() => navigateToDirectory(dir.path)}
                  >
                    <FolderOpen className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">{dir.name}</span>
                    <Badge variant="secondary">Directory</Badge>
                  </div>
                ))}

                {/* MIDI Files */}
                {data.midiFiles.map((file) => {
                  const fileId = `${file.name}-${Date.now()}`
                  const isDownloading = downloading.some((id) => id.includes(file.name))
                  const progress = Object.entries(downloadProgress).find(([id]) => id.includes(file.name))?.[1] || 0

                  return (
                    <div key={file.path} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileMusic className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-muted-foreground">{file.sizeFormatted}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline">MIDI</Badge>
                        <Button size="sm" variant="outline" onClick={() => downloadFile(file)} disabled={isDownloading}>
                          {isDownloading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {Math.round(progress)}%
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>

                      {isDownloading && (
                        <div className="absolute bottom-0 left-0 right-0">
                          <Progress value={progress} className="h-1" />
                        </div>
                      )}
                    </div>
                  )
                })}

                {data.directories.length === 0 && data.midiFiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No directories or MIDI files found in this path</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {!data && !loading && (
        <Alert>
          <Github className="h-4 w-4" />
          <AlertDescription>
            Select a repository above to browse and download MIDI files for RVC processing.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
