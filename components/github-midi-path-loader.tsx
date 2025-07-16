"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, Download, FileMusic, Loader2, CheckCircle, Code, Folder } from "lucide-react"
import { toast } from "sonner"

interface GitHubMidiFile {
  name: string
  path: string
  content: string
  size: number
  type: "midi" | "python" | "other"
}

export function GitHubMidiPathLoader() {
  const [repoUrl, setRepoUrl] = useState("https://github.com/example/chords2midi")
  const [specificPath, setSpecificPath] = useState("src/chords2midi/__init__.py")
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<GitHubMidiFile[]>([])
  const [selectedFile, setSelectedFile] = useState<GitHubMidiFile | null>(null)

  const loadFromGitHubPath = async () => {
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
      console.log(`🎵 Loading from GitHub path: ${owner}/${repo}/${specificPath}`)

      // If specific path is provided, load that file
      if (specificPath.trim()) {
        const fileResponse = await fetch("/api/github/pull", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner,
            repo: repo.replace(/\.git$/, ""),
            branch: "main",
            path: specificPath,
          }),
        })

        const fileData = await fileResponse.json()

        if (fileData.success) {
          const fileType = getFileType(fileData.file.name)
          const newFile: GitHubMidiFile = {
            name: fileData.file.name,
            path: fileData.file.path,
            content: fileData.file.content,
            size: fileData.file.size,
            type: fileType,
          }

          setFiles([newFile])
          setSelectedFile(newFile)
          toast.success(`Successfully loaded file: ${fileData.file.name}`)
        } else {
          throw new Error(fileData.error)
        }
      } else {
        // Load repository contents
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

        // Filter for relevant files
        const relevantFiles = contentsData.contents.filter((file: any) => {
          const name = file.name.toLowerCase()
          return (
            name.endsWith(".py") ||
            name.endsWith(".mid") ||
            name.endsWith(".midi") ||
            name.includes("chord") ||
            name.includes("midi") ||
            name.includes("music")
          )
        })

        // Load content for each relevant file
        const loadedFiles: GitHubMidiFile[] = []

        for (const file of relevantFiles.slice(0, 10)) {
          // Limit to first 10 files
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
              loadedFiles.push({
                name: file.name,
                path: file.path,
                content: fileData.file.content,
                size: fileData.file.size,
                type: fileType,
              })
            }
          } catch (error) {
            console.warn(`Failed to load file ${file.name}:`, error)
          }
        }

        setFiles(loadedFiles)
        if (loadedFiles.length > 0) {
          setSelectedFile(loadedFiles[0])
          toast.success(`Successfully loaded ${loadedFiles.length} files from repository`)
        } else {
          toast.warning("No relevant files found in the repository")
        }
      }
    } catch (error) {
      console.error("Error loading from GitHub:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load from GitHub")
    } finally {
      setLoading(false)
    }
  }

  const getFileType = (fileName: string): "midi" | "python" | "other" => {
    const name = fileName.toLowerCase()
    if (name.endsWith(".mid") || name.endsWith(".midi")) return "midi"
    if (name.endsWith(".py")) return "python"
    return "other"
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "midi":
        return <FileMusic className="h-5 w-5 text-green-500" />
      case "python":
        return <Code className="h-5 w-5 text-blue-500" />
      default:
        return <Folder className="h-5 w-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const downloadFile = (file: GitHubMidiFile) => {
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

  const previewFile = (file: GitHubMidiFile) => {
    setSelectedFile(file)
  }

  return (
    <div className="space-y-6">
      {/* GitHub Path Loader */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-6 w-6" />
            Load from GitHub Path: src/chords2midi/__init__.py
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repo-url">Repository URL</Label>
            <Input
              id="repo-url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/chords2midi"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specific-path">Specific Path (optional)</Label>
            <Input
              id="specific-path"
              value={specificPath}
              onChange={(e) => setSpecificPath(e.target.value)}
              placeholder="src/chords2midi/__init__.py"
              className="font-mono"
            />
          </div>

          <Button onClick={loadFromGitHubPath} disabled={loading || !repoUrl.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading from GitHub...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Load from GitHub Path
              </>
            )}
          </Button>

          {files.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Success!</strong> Found and loaded {files.length} files from the GitHub repository.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Loaded Files */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileMusic className="h-5 w-5" />
                Loaded Files ({files.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedFile?.path === file.path ? "bg-primary/10 border-primary" : "hover:bg-muted"
                      }`}
                      onClick={() => previewFile(file)}
                    >
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

                      <Button variant="outline" size="sm" onClick={() => downloadFile(file)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* File Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedFile && getFileIcon(selectedFile.type)}
                File Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Name: {selectedFile.name}</span>
                    <span>Size: {formatFileSize(selectedFile.size)}</span>
                    <span>Type: {selectedFile.type.toUpperCase()}</span>
                  </div>

                  <div className="space-y-2">
                    <Label>File Content:</Label>
                    <ScrollArea className="h-64 w-full border rounded-md">
                      <pre className="p-4 text-sm font-mono whitespace-pre-wrap">{selectedFile.content}</pre>
                    </ScrollArea>
                  </div>

                  {selectedFile.type === "python" && (
                    <Alert>
                      <Code className="h-4 w-4" />
                      <AlertDescription>
                        This Python file likely contains MIDI processing code that can be integrated with your music
                        generation system.
                      </AlertDescription>
                    </Alert>
                  )}

                  {selectedFile.type === "midi" && (
                    <Alert>
                      <FileMusic className="h-4 w-4" />
                      <AlertDescription>
                        This MIDI file contains musical data that can be processed through your RVC voice system.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert>
                  <FileMusic className="h-4 w-4" />
                  <AlertDescription>Select a file from the list to preview its content.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
