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
import {
  Github,
  Download,
  FileMusic,
  Search,
  RefreshCw,
  Loader2,
  Music,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { RepositoryValidator } from "@/lib/services/repository-validator"

interface MidiFile {
  name: string
  path: string
  downloadUrl: string
  size: number
  sizeFormatted: string
  category: string
  sha: string
}

interface RepositoryInfo {
  owner: string
  repo: string
  description: string
  stars: number
  forks: number
  language: string
  updatedAt: string
  isPublic: boolean
  hasContent: boolean
}

export function Ocean82MidiSync() {
  const [repositoryUrl, setRepositoryUrl] = useState("https://github.com/Ocean82/midi_land")
  const [repositoryInfo, setRepositoryInfo] = useState<RepositoryInfo | null>(null)
  const [midiFiles, setMidiFiles] = useState<MidiFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<MidiFile[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [validating, setValidating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [downloading, setDownloading] = useState<string[]>([])
  const [urlValidation, setUrlValidation] = useState<{
    isValid: boolean
    error?: string
    suggestions?: string[]
  } | null>(null)

  useEffect(() => {
    validateRepositoryUrl()
  }, [repositoryUrl])

  useEffect(() => {
    filterAndSortFiles()
  }, [midiFiles, searchTerm, selectedCategory, sortBy])

  const validateRepositoryUrl = async () => {
    if (!repositoryUrl.trim()) {
      setUrlValidation(null)
      return
    }

    setValidating(true)

    try {
      const validation = RepositoryValidator.validateGitHubUrl(repositoryUrl)

      if (!validation.isValid) {
        setUrlValidation({
          isValid: false,
          error: validation.error,
          suggestions: validation.suggestions,
        })
        return
      }

      // Update URL if it was corrected
      if (validation.correctedUrl && validation.correctedUrl !== repositoryUrl) {
        setRepositoryUrl(validation.correctedUrl)
      }

      // Extract owner and repo from corrected URL
      const match = validation.correctedUrl!.match(/github\.com\/([^/]+)\/([^/]+)/)
      if (match) {
        const [, owner, repo] = match

        // Check if repository exists
        const existsCheck = await RepositoryValidator.checkRepositoryExists(owner, repo)

        if (!existsCheck.exists) {
          setUrlValidation({
            isValid: false,
            error: existsCheck.error || "Repository not found",
            suggestions: [
              "Check if the repository name is spelled correctly",
              "Verify that the repository is public",
              "Make sure the repository exists",
            ],
          })
          return
        }

        setUrlValidation({ isValid: true })

        // Load repository info
        await loadRepositoryInfo(owner, repo)
      }
    } catch (error) {
      setUrlValidation({
        isValid: false,
        error: "Failed to validate repository",
        suggestions: ["Check your internet connection and try again"],
      })
    } finally {
      setValidating(false)
    }
  }

  const loadRepositoryInfo = async (owner: string, repo: string) => {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          "User-Agent": "Burnt-Beats-MIDI-Sync",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRepositoryInfo({
          owner: data.owner.login,
          repo: data.name,
          description: data.description || "No description available",
          stars: data.stargazers_count,
          forks: data.forks_count,
          language: data.language || "Unknown",
          updatedAt: data.updated_at,
          isPublic: !data.private,
          hasContent: data.size > 0,
        })
      }
    } catch (error) {
      console.error("Failed to load repository info:", error)
    }
  }

  const syncRepository = async () => {
    if (!urlValidation?.isValid || !repositoryInfo) {
      toast.error("Please enter a valid repository URL first")
      return
    }

    setSyncing(true)

    try {
      const response = await fetch("/api/github/sync-repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syncAll: false,
          repositories: [
            {
              owner: repositoryInfo.owner,
              repo: repositoryInfo.repo,
              branch: "main",
              paths: ["", "midi", "music", "songs", "tracks", "samples", "data"],
              description: repositoryInfo.description,
              priority: 1,
            },
          ],
        }),
      })

      const data = await response.json()

      if (data.success) {
        const processedFiles = data.files.map((file: any) => ({
          ...file,
          sizeFormatted: formatFileSize(file.size),
          category: getCategoryFromPath(file.path),
        }))

        setMidiFiles(processedFiles)
        toast.success(`Synced ${processedFiles.length} MIDI files from ${repositoryInfo.owner}/${repositoryInfo.repo}`)
      } else {
        throw new Error(data.error || "Sync failed")
      }
    } catch (error) {
      console.error("Sync error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to sync repository")
    } finally {
      setSyncing(false)
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

  const getCategoryFromPath = (path: string): string => {
    const pathLower = path.toLowerCase()
    if (pathLower.includes("chord")) return "Chords"
    if (pathLower.includes("melody")) return "Melodies"
    if (pathLower.includes("drum")) return "Drums"
    if (pathLower.includes("bass")) return "Bass"
    if (pathLower.includes("lead")) return "Leads"
    if (pathLower.includes("pad")) return "Pads"
    if (pathLower.includes("arp")) return "Arpeggios"
    if (pathLower.includes("loop")) return "Loops"
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
          <h1 className="text-3xl font-bold">Ocean82/midi_land Repository Sync</h1>
          <p className="text-muted-foreground">Sync MIDI files from Ocean82's midi_land repository</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={validateRepositoryUrl} disabled={validating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${validating ? "animate-spin" : ""}`} />
            Validate
          </Button>
          <Button onClick={syncRepository} disabled={syncing || !urlValidation?.isValid}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Github className="h-4 w-4 mr-2" />}
            Sync Repository
          </Button>
        </div>
      </div>

      {/* Repository URL Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Repository Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Repository URL</label>
            <div className="flex gap-2">
              <Input
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                placeholder="https://github.com/Ocean82/midi_land"
                className={urlValidation?.isValid === false ? "border-red-500" : ""}
              />
              <Button variant="outline" onClick={validateRepositoryUrl} disabled={validating}>
                {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* URL Validation Status */}
          {urlValidation && (
            <Alert>
              {urlValidation.isValid ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertDescription>
                {urlValidation.isValid ? (
                  "Repository URL is valid and accessible"
                ) : (
                  <div>
                    <strong>Error:</strong> {urlValidation.error}
                    {urlValidation.suggestions && (
                      <ul className="mt-2 list-disc list-inside text-sm">
                        {urlValidation.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Repository Info */}
          {repositoryInfo && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {repositoryInfo.owner}/{repositoryInfo.repo}
                    </h3>
                    <Badge variant={repositoryInfo.isPublic ? "default" : "secondary"}>
                      {repositoryInfo.isPublic ? "Public" : "Private"}
                    </Badge>
                    <Badge variant="outline">{repositoryInfo.language}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{repositoryInfo.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>⭐ {repositoryInfo.stars}</span>
                    <span>🍴 {repositoryInfo.forks}</span>
                    <span>Updated: {new Date(repositoryInfo.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={repositoryUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    View on GitHub
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Progress */}
      {syncing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Syncing repository...</span>
                <span>Scanning for MIDI files</span>
              </div>
              <Progress value={45} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files Section */}
      {midiFiles.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{midiFiles.length}</div>
                <p className="text-xs text-muted-foreground">MIDI Files</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{getUniqueCategories().length}</div>
                <p className="text-xs text-muted-foreground">Categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {formatFileSize(midiFiles.reduce((sum, file) => sum + file.size, 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total Size</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{filteredFiles.length}</div>
                <p className="text-xs text-muted-foreground">Filtered</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
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
              </div>
            </CardContent>
          </Card>

          {/* Files List */}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(file)}
                            disabled={isDownloading}
                          >
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
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {midiFiles.length === 0 && !syncing && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <Github className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No MIDI files synced yet</h3>
              <p className="text-sm mb-4">Enter a valid repository URL and click "Sync Repository" to get started</p>
              <Button variant="outline" onClick={validateRepositoryUrl} disabled={!repositoryUrl.trim()}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Validate Repository
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
