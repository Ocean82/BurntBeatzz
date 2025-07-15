"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Github, Download, Music, FileMusic, Loader2, CheckCircle, AlertTriangle, Play, Pause } from "lucide-react"
import { toast } from "sonner"

interface MelodyFile {
  name: string
  path: string
  content: string
  size: number
  type: "midi" | "json" | "txt" | "other"
}

export function GitHubMelodyTester() {
  const [repoUrl, setRepoUrl] = useState("https://github.com/your-username/melody-collection")
  const [loading, setLoading] = useState(false)
  const [melodyFiles, setMelodyFiles] = useState<MelodyFile[]>([])
  const [selectedFile, setSelectedFile] = useState<MelodyFile | null>(null)
  const [playingFile, setPlayingFile] = useState<string | null>(null)

  const testGitHubPull = async () => {
    if (!repoUrl.trim()) {
      toast.error("Please enter a GitHub repository URL")
      return
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      toast.error("Invalid GitHub repository URL")
      return
    }

    const [, owner, repo] = match
    setLoading(true)

    try {
      // First, get repository contents
      const contentsResponse = await fetch("/api/github/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo: repo.replace(/\.git$/, ""),
          branch: "main",
        }),
      })

      const contentsData = await contentsResponse.json()

      if (!contentsData.success) {
        throw new Error(contentsData.error)
      }

      // Filter for melody/music files
      const musicFiles = contentsData.contents.filter((file: any) => {
        const name = file.name.toLowerCase()
        return (
          name.endsWith(".mid") ||
          name.endsWith(".midi") ||
          name.endsWith(".json") ||
          name.includes("melody") ||
          name.includes("music") ||
          name.includes("song")
        )
      })

      // Pull each music file's content
      const melodyFilesData: MelodyFile[] = []

      for (const file of musicFiles) {
        try {
          const fileResponse = await fetch("/api/github/pull", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              owner,
              repo: repo.replace(/\.git$/, ""),
              branch: "main",
              path: file.path,
            }),
          })

          const fileData = await fileResponse.json()

          if (fileData.success) {
            const fileType = getFileType(file.name)
            melodyFilesData.push({
              name: file.name,
              path: file.path,
              content: fileData.file.content,
              size: fileData.file.size,
              type: fileType,
            })
          }
        } catch (error) {
          console.warn(`Failed to pull file ${file.name}:`, error)
        }
      }

      setMelodyFiles(melodyFilesData)

      if (melodyFilesData.length > 0) {
        toast.success(`Successfully pulled ${melodyFilesData.length} melody files from GitHub!`)
      } else {
        toast.warning("No melody files found in the repository")
      }
    } catch (error) {
      console.error("Error testing GitHub pull:", error)
      toast.error(error instanceof Error ? error.message : "Failed to pull from GitHub")
    } finally {
      setLoading(false)
    }
  }

  const getFileType = (fileName: string): "midi" | "json" | "txt" | "other" => {
    const name = fileName.toLowerCase()
    if (name.endsWith(".mid") || name.endsWith(".midi")) return "midi"
    if (name.endsWith(".json")) return "json"
    if (name.endsWith(".txt")) return "txt"
    return "other"
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "midi":
        return <FileMusic className="h-5 w-5 text-green-500" />
      case "json":
        return <Music className="h-5 w-5 text-blue-500" />
      case "txt":
        return <Music className="h-5 w-5 text-yellow-500" />
      default:
        return <Music className="h-5 w-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const previewFile = (file: MelodyFile) => {
    setSelectedFile(file)
  }

  const downloadFile = (file: MelodyFile) => {
    const blob = new Blob([file.content], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success(`Downloaded ${file.name}`)
  }

  const simulatePlay = (fileName: string) => {
    if (playingFile === fileName) {
      setPlayingFile(null)
      toast.info("Stopped playback")
    } else {
      setPlayingFile(fileName)
      toast.info(`Playing ${fileName}`)
      // Simulate playback duration
      setTimeout(() => {
        setPlayingFile(null)
      }, 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Test GitHub Pull */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-6 w-6" />
            Test GitHub Melody File Pull
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repo-url">Repository URL</Label>
            <Input
              id="repo-url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/melody-collection"
              className="font-mono"
            />
          </div>

          <Button onClick={testGitHubPull} disabled={loading || !repoUrl.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Pulling Melody Files...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Test Pull Melody Files
              </>
            )}
          </Button>

          {melodyFiles.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Success!</strong> Found and pulled {melodyFiles.length} melody files from GitHub.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Pulled Melody Files */}
      {melodyFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Pulled Melody Files ({melodyFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {melodyFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type)}
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {file.name}
                          <Badge variant="outline" className="text-xs">
                            {file.type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {file.path}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {file.type === "midi" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => simulatePlay(file.name)}
                          disabled={playingFile !== null && playingFile !== file.name}
                        >
                          {playingFile === file.name ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Play
                            </>
                          )}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => previewFile(file)}>
                        Preview
                      </Button>
                      <Button variant="default" size="sm" onClick={() => downloadFile(file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* File Preview */}
      {selectedFile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getFileIcon(selectedFile.type)}
              {selectedFile.name} Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Size: {formatFileSize(selectedFile.size)}</span>
                <span>Type: {selectedFile.type.toUpperCase()}</span>
                <span>Path: {selectedFile.path}</span>
              </div>

              <div className="space-y-2">
                <Label>File Content:</Label>
                <ScrollArea className="h-64 w-full border rounded-md">
                  <pre className="p-4 text-sm font-mono whitespace-pre-wrap">{selectedFile.content}</pre>
                </ScrollArea>
              </div>

              {selectedFile.type === "json" && (
                <Alert>
                  <Music className="h-4 w-4" />
                  <AlertDescription>
                    This JSON file likely contains melody data that can be processed by your music generation system.
                  </AlertDescription>
                </Alert>
              )}

              {selectedFile.type === "midi" && (
                <Alert>
                  <FileMusic className="h-4 w-4" />
                  <AlertDescription>
                    This MIDI file contains musical note data that can be used for RVC voice processing and melody
                    generation.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {melodyFiles.length === 0 && !loading && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No melody files have been pulled yet. Enter a GitHub repository URL above and click "Test Pull Melody Files"
            to see if the integration is working.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
