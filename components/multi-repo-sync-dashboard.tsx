"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Github,
  RefreshCw,
  Download,
  FileMusic,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Folder,
  GitBranch,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface Repository {
  owner: string
  repo: string
  branch?: string
  paths: string[]
  description: string
  priority: number
  lastSync?: string
  status: "active" | "inactive" | "error"
  syncResult?: SyncResult
}

interface SyncResult {
  repository: string
  filesFound: number
  filesDownloaded: number
  errors: string[]
  duration: number
  lastSync: string
}

interface RepositoryStats {
  total: number
  active: number
  inactive: number
  error: number
  totalFiles: number
  lastSyncTime?: string
}

interface MidiFile {
  name: string
  path: string
  repository: string
  content: string
  size: number
  downloadUrl: string
  sha: string
  lastModified: string
}

export function MultiRepoSyncDashboard() {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [stats, setStats] = useState<RepositoryStats | null>(null)
  const [midiFiles, setMidiFiles] = useState<MidiFile[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [selectedRepo, setSelectedRepo] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("dashboard")

  // Form states for adding new repository
  const [newRepo, setNewRepo] = useState({
    owner: "",
    repo: "",
    branch: "main",
    paths: "",
    description: "",
    priority: 999,
  })

  useEffect(() => {
    loadRepositoryData()
  }, [])

  const loadRepositoryData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/github/sync-repositories")
      const data = await response.json()

      if (data.success) {
        setRepositories(data.repositories)
        setStats(data.stats)
        toast.success(`Loaded ${data.repositories.length} repositories`)
      } else {
        toast.error("Failed to load repository data")
      }
    } catch (error) {
      console.error("Error loading repository data:", error)
      toast.error("Failed to load repository data")
    } finally {
      setLoading(false)
    }
  }

  const syncAllRepositories = async () => {
    setSyncing(true)
    setSyncProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSyncProgress((prev) => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch("/api/github/sync-repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncAll: true }),
      })

      clearInterval(progressInterval)
      setSyncProgress(100)

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setRepositories(data.repositories || [])
        setStats(data.stats)

        // Load MIDI files
        loadMidiFiles()
      } else {
        toast.error(`Sync completed with errors: ${data.errors?.join(", ")}`)
      }
    } catch (error) {
      console.error("Sync error:", error)
      toast.error("Failed to sync repositories")
    } finally {
      setSyncing(false)
      setSyncProgress(0)
    }
  }

  const loadMidiFiles = async (repository?: string) => {
    try {
      const params = new URLSearchParams()
      if (repository) params.set("repository", repository)
      params.set("includeContent", "false")

      const response = await fetch(`/api/github/sync-repositories?${params}`)
      const data = await response.json()

      if (data.success) {
        setMidiFiles(data.files || [])
      }
    } catch (error) {
      console.error("Error loading MIDI files:", error)
    }
  }

  const addRepository = async () => {
    if (!newRepo.owner || !newRepo.repo) {
      toast.error("Owner and repository name are required")
      return
    }

    try {
      const response = await fetch("/api/github/sync-repositories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          owner: newRepo.owner,
          repo: newRepo.repo,
          branch: newRepo.branch,
          paths: newRepo.paths
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
          description: newRepo.description,
          priority: newRepo.priority,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setNewRepo({
          owner: "",
          repo: "",
          branch: "main",
          paths: "",
          description: "",
          priority: 999,
        })
        loadRepositoryData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error adding repository:", error)
      toast.error("Failed to add repository")
    }
  }

  const removeRepository = async (owner: string, repo: string) => {
    try {
      const response = await fetch("/api/github/sync-repositories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          owner,
          repo,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        loadRepositoryData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error removing repository:", error)
      toast.error("Failed to remove repository")
    }
  }

  const updateRepositoryStatus = async (owner: string, repo: string, status: Repository["status"]) => {
    try {
      const response = await fetch("/api/github/sync-repositories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateStatus",
          owner,
          repo,
          status,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        loadRepositoryData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error updating repository status:", error)
      toast.error("Failed to update repository status")
    }
  }

  const getStatusIcon = (status: Repository["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "inactive":
        return <Pause className="h-4 w-4 text-yellow-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: Repository["status"]) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      error: "destructive",
    } as const

    return <Badge variant={variants[status] || "secondary"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"]
    if (bytes === 0) return "0 B"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Multi-Repository MIDI Sync</h1>
          <p className="text-muted-foreground">Sync MIDI files from multiple GitHub repositories</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadRepositoryData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={syncAllRepositories} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Sync All
          </Button>
        </div>
      </div>

      {/* Sync Progress */}
      {syncing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Syncing repositories...</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Repositories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.error}</div>
              <p className="text-xs text-muted-foreground">Errors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.totalFiles}</div>
              <p className="text-xs text-muted-foreground">MIDI Files</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="files">MIDI Files</TabsTrigger>
          <TabsTrigger value="add">Add Repository</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Sync Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Recent Sync Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {repositories
                      .filter((repo) => repo.syncResult)
                      .sort(
                        (a, b) =>
                          new Date(b.syncResult!.lastSync).getTime() - new Date(a.syncResult!.lastSync).getTime(),
                      )
                      .slice(0, 10)
                      .map((repo) => (
                        <div
                          key={`${repo.owner}/${repo.repo}`}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(repo.status)}
                            <div>
                              <div className="font-medium">
                                {repo.owner}/{repo.repo}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {repo.syncResult!.filesDownloaded} files • {formatDuration(repo.syncResult!.duration)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(repo.syncResult!.lastSync).toLocaleString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Repository Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  Repository Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {repositories.map((repo) => (
                      <div
                        key={`${repo.owner}/${repo.repo}`}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex items-center gap-2">
                          {getStatusIcon(repo.status)}
                          <span className="text-sm font-medium">
                            {repo.owner}/{repo.repo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(repo.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateRepositoryStatus(
                                repo.owner,
                                repo.repo,
                                repo.status === "active" ? "inactive" : "active",
                              )
                            }
                          >
                            {repo.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Repositories Tab */}
        <TabsContent value="repositories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Repository Management</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {repositories.map((repo) => (
                    <Card key={`${repo.owner}/${repo.repo}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Github className="h-4 w-4" />
                              <span className="font-medium">
                                {repo.owner}/{repo.repo}
                              </span>
                              {getStatusBadge(repo.status)}
                              <Badge variant="outline">Priority {repo.priority}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{repo.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <GitBranch className="h-3 w-3" />
                                {repo.branch || "main"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Folder className="h-3 w-3" />
                                {repo.paths.length} paths
                              </span>
                              {repo.lastSync && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(repo.lastSync).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {repo.paths.map((path, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {path}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateRepositoryStatus(
                                  repo.owner,
                                  repo.repo,
                                  repo.status === "active" ? "inactive" : "active",
                                )
                              }
                            >
                              {repo.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeRepository(repo.owner, repo.repo)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Sync Results */}
                        {repo.syncResult && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="font-medium">{repo.syncResult.filesFound}</div>
                                <div className="text-muted-foreground">Files Found</div>
                              </div>
                              <div>
                                <div className="font-medium">{repo.syncResult.filesDownloaded}</div>
                                <div className="text-muted-foreground">Downloaded</div>
                              </div>
                              <div>
                                <div className="font-medium">{formatDuration(repo.syncResult.duration)}</div>
                                <div className="text-muted-foreground">Duration</div>
                              </div>
                            </div>
                            {repo.syncResult.errors.length > 0 && (
                              <Alert className="mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  {repo.syncResult.errors.length} error(s):{" "}
                                  {repo.syncResult.errors.slice(0, 2).join(", ")}
                                  {repo.syncResult.errors.length > 2 && "..."}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MIDI Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileMusic className="h-5 w-5" />
                MIDI Files Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="All repositories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All repositories</SelectItem>
                      {repositories.map((repo) => (
                        <SelectItem key={`${repo.owner}/${repo.repo}`} value={`${repo.owner}/${repo.repo}`}>
                          {repo.owner}/{repo.repo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => loadMidiFiles(selectedRepo)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Load Files
                  </Button>
                </div>

                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {midiFiles
                      .filter((file) => selectedRepo === "all" || file.repository === selectedRepo)
                      .map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileMusic className="h-4 w-4 text-green-500" />
                            <div>
                              <div className="font-medium">{file.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {file.repository} • {file.path}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                            <Button variant="outline" size="sm">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Repository Tab */}
        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Repository
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner">Repository Owner</Label>
                  <Input
                    id="owner"
                    value={newRepo.owner}
                    onChange={(e) => setNewRepo({ ...newRepo, owner: e.target.value })}
                    placeholder="microsoft"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repo">Repository Name</Label>
                  <Input
                    id="repo"
                    value={newRepo.repo}
                    onChange={(e) => setNewRepo({ ...newRepo, repo: e.target.value })}
                    placeholder="muzic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={newRepo.branch}
                    onChange={(e) => setNewRepo({ ...newRepo, branch: e.target.value })}
                    placeholder="main"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={newRepo.priority}
                    onChange={(e) => setNewRepo({ ...newRepo, priority: Number.parseInt(e.target.value) || 999 })}
                    placeholder="999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paths">Paths (comma-separated)</Label>
                <Input
                  id="paths"
                  value={newRepo.paths}
                  onChange={(e) => setNewRepo({ ...newRepo, paths: e.target.value })}
                  placeholder="src/chords2midi, data/midi, examples"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRepo.description}
                  onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
                  placeholder="Description of the repository and its MIDI content"
                  rows={3}
                />
              </div>

              <Button onClick={addRepository} disabled={!newRepo.owner || !newRepo.repo}>
                <Plus className="h-4 w-4 mr-2" />
                Add Repository
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
