"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Github, Download, FileMusic, Search, RefreshCw, Loader2, Music, BarChart3 } from "lucide-react"
import { toast } from "sonner"

interface MidiFile {
  name: string
  path: string
  downloadUrl: string
  size: number
  sizeFormatted: string
  category: string
  key?: string
  tempo?: number
  duration?: number
}

interface SyncStats {
  totalFiles: number
  downloadedFiles: number
  categories: Record<string, number>
  totalSize: number
  lastSync: string
  syncDuration: number
}

interface SyncProgress {
  current: number
  total: number
  currentFile: string
  stage: string
  percentage: number
}

export function LdrolezMidiSync() {
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [midiFiles, setMidiFiles] = useState<MidiFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<MidiFile[]>([])
  const [stats, setStats] = useState<SyncStats | null>(null)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [downloading, setDownloading] = useState<string[]>([])
  const [playingFile, setPlayingFile] = useState<string | null>(null)

  // Repository configuration for ldrolez/free-midi-chords
  const REPO_CONFIG = {
    owner: "ldrolez",
    repo: "free-midi-chords",
    branch: "main",
    paths: ["", "chords", "progressions", "src/chords2midi", "midi", "data"],
    description: "🎵 Free MIDI chords and progressions - over 10,000 MIDI files",
  }

  useEffect(() => {
    loadExistingFiles()
  }, [])

  useEffect(() => {
    filterAndSortFiles()
  }, [midiFiles, searchTerm, selectedCategory, sortBy])

  const loadExistingFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/github/sync-repositories?repository=${REPO_CONFIG.owner}/${REPO_CONFIG.repo}`)
      const data = await response.json()

      if (data.success && data.files) {
        const processedFiles = data.files.map((file: any) => ({
          ...file,
          sizeFormatted: formatFileSize(file.size),
          category: getCategoryFromPath(file.path),
        }))
        setMidiFiles(processedFiles)

        // Generate stats
        generateStats(processedFiles)
        toast.success(`Loaded ${processedFiles.length} existing MIDI files`)
      }
    } catch (error) {
      console.error("Error loading existing files:", error)
      toast.error("Failed to load existing files")
    } finally {
      setLoading(false)
    }
  }

  const syncRepository = async () => {
    setSyncing(true)
    setSyncProgress({
      current: 0,
      total: 100,
      currentFile: "Initializing...",
      stage: "Starting sync",
      percentage: 0,
    })

    try {
      // Start the sync process
      const response = await fetch("/api/github/sync-repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syncAll: false,
          repositories: [REPO_CONFIG],
        }),
      })

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSyncProgress((prev) => {
          if (!prev) return null
          const newPercentage = Math.min(prev.percentage + 2, 95)
          return {
            ...prev,
            percentage: newPercentage,
            current: Math.floor((newPercentage / 100) * prev.total),
            currentFile: `Processing MIDI files... (${Math.floor(newPercentage)}%)`,
            stage:
              newPercentage < 30
                ? "Scanning repository"
                : newPercentage < 60
                  ? "Analyzing MIDI files"
                  : newPercentage < 90
                    ? "Downloading files"
                    : "Finalizing",
          }
        })
      }, 500)

      const data = await response.json()
      clearInterval(progressInterval)

      setSyncProgress((prev) => (prev ? { ...prev, percentage: 100, stage: "Complete" } : null))

      if (data.success) {
        toast.success(data.message)
        await loadExistingFiles() // Reload the files
      } else {
        toast.error(`Sync completed with errors: ${data.errors?.join(", ")}`)
      }
    } catch (error) {
      console.error("Sync error:", error)
      toast.error("Failed to sync repository")
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncProgress(null), 2000)
    }
  }

  const downloadFile = async (file: MidiFile) => {
    const fileId = file.name
    setDownloading((prev) => [...prev, fileId])

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
    } catch (error) {
      console.error("Download error:", error)
      toast.error(`Failed to download ${file.name}`)
    } finally {
      setDownloading((prev) => prev.filter((id) => id !== fileId))
    }
  }

  const downloadBatch = async (files: MidiFile[]) => {
    const filesToDownload = files.slice(0, 10) // Limit to 10 files
    toast.info(`Starting batch download of ${filesToDownload.length} files...`)

    for (const file of filesToDownload) {
      await downloadFile(file)
      await new Promise((resolve) => setTimeout(resolve, 500)) // Delay between downloads
    }

    toast.success(`Completed batch download of ${filesToDownload.length} files`)
  }

  const filterAndSortFiles = () => {
    let filtered = [...midiFiles]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (file) =>
          file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.path.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((file) => file.category === selectedCategory)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "size":
          return b.size - a.size
        case "category":
          return a.category.localeCompare(b.category)
        case "path":
          return a.path.localeCompare(b.path)
        default:
          return 0
      }
    })

    setFilteredFiles(filtered)
  }

  const generateStats = (files: MidiFile[]) => {
    const categories: Record<string, number> = {}
    let totalSize = 0

    files.forEach((file) => {
      categories[file.category] = (categories[file.category] || 0) + 1
      totalSize += file.size
    })

    setStats({
      totalFiles: files.length,
      downloadedFiles: files.length,
      categories,
      totalSize,
      lastSync: new Date().toISOString(),
      syncDuration: 0,
    })
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const getUniqueCategories = () => {
    const categories = new Set(midiFiles.map((file) => file.category))
    return Array.from(categories).sort()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ldrolez/free-midi-chords Repository</h1>
          <p className="text-muted-foreground">
            Sync and download from the largest free MIDI chord collection on GitHub
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadExistingFiles} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={syncRepository} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Github className="h-4 w-4 mr-2" />}
            Sync Repository
          </Button>
        </div>
      </div>

      {/* Sync Progress */}
      {syncProgress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{syncProgress.stage}</h3>
                  <p className="text-sm text-muted-foreground">{syncProgress.currentFile}</p>
                </div>
                <Badge variant="outline">{syncProgress.percentage}%</Badge>
              </div>
              <Progress value={syncProgress.percentage} className="w-full" />
              <div className="text-xs text-muted-foreground">
                {syncProgress.current} / {syncProgress.total} items processed
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repository Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
              <p className="text-xs text-muted-foreground">Total MIDI Files</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.downloadedFiles}</div>
              <p className="text-xs text-muted-foreground">Available</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{Object.keys(stats.categories).length}</div>
              <p className="text-xs text-muted-foreground">Categories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">{formatFileSize(stats.totalSize)}</div>
              <p className="text-xs text-muted-foreground">Total Size</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{new Date(stats.lastSync).toLocaleDateString()}</div>
              <p className="text-xs text-muted-foreground">Last Sync</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.categories)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">{category}</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search MIDI files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {getUniqueCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="path">Path</SelectItem>
              </SelectContent>
            </Select>
            {filteredFiles.length > 0 && (
              <Button variant="outline" onClick={() => downloadBatch(filteredFiles)}>
                <Download className="h-4 w-4 mr-2" />
                Download Batch
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MIDI Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileMusic className="h-5 w-5" />
            MIDI Files ({filteredFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredFiles.map((file, index) => {
                const isDownloading = downloading.includes(file.name)
                const isPlaying = playingFile === file.name

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileMusic className="h-4 w-4 text-green-500" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{file.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {file.path} • {file.sizeFormatted}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{file.category}</Badge>
                      <Button variant="outline" size="sm" onClick={() => downloadFile(file)} disabled={isDownloading}>
                        {isDownloading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}

              {filteredFiles.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No MIDI files found matching your criteria</p>
                  <p className="text-sm">Try adjusting your search or sync the repository</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Loading MIDI files...</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Repository Info */}
      <Alert>
        <Github className="h-4 w-4" />
        <AlertDescription>
          <strong>Repository:</strong> {REPO_CONFIG.owner}/{REPO_CONFIG.repo} •<strong> Branch:</strong>{" "}
          {REPO_CONFIG.branch} •<strong> Paths:</strong> {REPO_CONFIG.paths.join(", ")}
        </AlertDescription>
      </Alert>
    </div>
  )
}
