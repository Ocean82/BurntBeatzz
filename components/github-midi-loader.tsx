"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Github,
  Download,
  Folder,
  Music,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Zap,
  Shield,
} from "lucide-react"
import { toast } from "sonner"

interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  download_url: string | null
  type: "file" | "dir"
}

interface RateLimit {
  remaining: number
  limit: number
  percentage: number
  resetIn: number
}

export function GitHubMidiLoader() {
  const [repoUrl, setRepoUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<GitHubFile[]>([])
  const [currentPath, setCurrentPath] = useState("")
  const [repository, setRepository] = useState("")
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null)
  const [tokenConfigured, setTokenConfigured] = useState(false)

  useEffect(() => {
    checkTokenStatus()
  }, [])

  const checkTokenStatus = async () => {
    try {
      const response = await fetch("/api/github/validate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // Empty body to use pre-configured token
      })

      if (response.ok) {
        const result = await response.json()
        setTokenConfigured(result.valid)
        if (result.rateLimit) {
          setRateLimit({
            remaining: result.rateLimit.remaining,
            limit: result.rateLimit.limit,
            percentage: (result.rateLimit.remaining / result.rateLimit.limit) * 100,
            resetIn: result.rateLimit.reset * 1000 - Date.now(),
          })
        }
      }
    } catch (error) {
      console.error("Error checking token status:", error)
    }
  }

  const parseGitHubUrl = (url: string) => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, "") }
    }
    return null
  }

  const loadRepository = async () => {
    const parsed = parseGitHubUrl(repoUrl)
    if (!parsed) {
      toast.error("Invalid GitHub repository URL")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/github/midi-files?owner=${parsed.owner}&repo=${parsed.repo}&path=${currentPath}`,
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to load repository")
      }

      const data = await response.json()
      setFiles(data.files)
      setRepository(data.repository)
      setRateLimit(data.rateLimit)

      toast.success(`Loaded ${data.files.length} items from repository`)
    } catch (error) {
      console.error("Error loading repository:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load repository")
    } finally {
      setLoading(false)
    }
  }

  const navigateToFolder = async (folderPath: string) => {
    const parsed = parseGitHubUrl(repoUrl)
    if (!parsed) return

    setLoading(true)
    setCurrentPath(folderPath)

    try {
      const response = await fetch(
        `/api/github/midi-files?owner=${parsed.owner}&repo=${parsed.repo}&path=${folderPath}`,
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to load folder")
      }

      const data = await response.json()
      setFiles(data.files)
      setRateLimit(data.rateLimit)
    } catch (error) {
      console.error("Error loading folder:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load folder")
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (file: GitHubFile) => {
    if (!file.download_url) {
      toast.error("Download URL not available for this file")
      return
    }

    try {
      const response = await fetch(file.download_url)
      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Downloaded ${file.name}`)
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download file")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const goBack = () => {
    const pathParts = currentPath.split("/").filter(Boolean)
    pathParts.pop()
    const newPath = pathParts.join("/")
    navigateToFolder(newPath)
  }

  return (
    <div className="space-y-6">
      {/* Token Status */}
      <Card className={tokenConfigured ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {tokenConfigured ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">GitHub Token Configured</div>
                  <div className="text-sm text-green-600">
                    You have enhanced access to repositories and higher rate limits
                  </div>
                </div>
                <div className="ml-auto">
                  <Badge variant="outline" className="border-green-300 text-green-700">
                    <Shield className="h-3 w-3 mr-1" />
                    Enhanced Access
                  </Badge>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-yellow-800">Limited Access Mode</div>
                  <div className="text-sm text-yellow-600">Using unauthenticated requests with rate limits</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("/github-setup", "_blank")}
                  className="ml-auto"
                >
                  Configure Token
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rate Limit Status */}
      {rateLimit && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">API Rate Limit</span>
              </div>
              <Badge variant={rateLimit.percentage > 20 ? "default" : "destructive"}>
                {rateLimit.remaining}/{rateLimit.limit} remaining
              </Badge>
            </div>
            <Progress value={rateLimit.percentage} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>{Math.round(rateLimit.percentage)}% remaining</span>
              {rateLimit.resetIn > 0 && <span>Resets in {Math.ceil(rateLimit.resetIn / (1000 * 60))} minutes</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repository Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Load GitHub Repository
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repo-url">Repository URL</Label>
            <Input
              id="repo-url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="font-mono"
            />
          </div>

          <Button onClick={loadRepository} disabled={!repoUrl || loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading Repository...
              </>
            ) : (
              <>
                <Github className="h-4 w-4 mr-2" />
                Load Repository
              </>
            )}
          </Button>

          {repository && (
            <Alert>
              <Github className="h-4 w-4" />
              <AlertDescription>
                Browsing: <strong>{repository}</strong>
                {currentPath && (
                  <>
                    {" / "}
                    <span className="font-mono">{currentPath}</span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* File Browser */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                MIDI Files & Folders
              </CardTitle>
              {currentPath && (
                <Button variant="outline" size="sm" onClick={goBack}>
                  ← Back
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={file.sha}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {file.type === "dir" ? (
                      <Folder className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Music className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {file.type === "file" ? formatFileSize(file.size) : "Directory"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {file.type === "dir" ? (
                      <Button variant="outline" size="sm" onClick={() => navigateToFolder(file.path)}>
                        Open
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => window.open(file.html_url, "_blank")}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="default" size="sm" onClick={() => downloadFile(file)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
