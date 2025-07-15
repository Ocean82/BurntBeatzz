"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Github,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  FolderOpen,
  AlertTriangle,
  Clock,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

interface GitHubRepo {
  name: string
  fullName: string
  description: string
  private: boolean
  defaultBranch: string
  url: string
  cloneUrl: string
  sshUrl: string
  updatedAt: string
}

interface GitHubBranch {
  name: string
  sha: string
  protected: boolean
}

interface GitHubCommit {
  sha: string
  message: string
  author: {
    name: string
    email: string
    date: string
  }
  url: string
}

interface SyncOperation {
  id: string
  type: "push" | "pull" | "clone" | "commit"
  status: "pending" | "running" | "success" | "error"
  progress: number
  message: string
  startTime?: number
  endTime?: number
  details?: any
}

interface ProjectFile {
  path: string
  content: string
  type: "file" | "directory"
  size: number
  modified: boolean
  status: "added" | "modified" | "deleted" | "unchanged"
}

export function GitHubSyncDashboard() {
  const [repositories, setRepositories] = useState<GitHubRepo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<string>("")
  const [branches, setBranches] = useState<GitHubBranch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [commits, setCommits] = useState<GitHubCommit[]>([])
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([])
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([])

  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  // Form states
  const [commitMessage, setCommitMessage] = useState("")
  const [newRepoName, setNewRepoName] = useState("")
  const [newRepoDescription, setNewRepoDescription] = useState("")
  const [isPrivateRepo, setIsPrivateRepo] = useState(true)

  useEffect(() => {
    validateToken()
    loadRepositories()
    loadProjectFiles()
  }, [])

  useEffect(() => {
    if (selectedRepo) {
      loadBranches()
      loadCommits()
    }
  }, [selectedRepo])

  useEffect(() => {
    if (selectedBranch) {
      loadCommits()
    }
  }, [selectedBranch])

  const validateToken = async () => {
    try {
      const response = await fetch("/api/github/validate-token")
      const data = await response.json()
      setTokenValid(data.valid)

      if (!data.valid) {
        toast.error("GitHub token is invalid or missing")
      }
    } catch (error) {
      setTokenValid(false)
      toast.error("Failed to validate GitHub token")
    }
  }

  const loadRepositories = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/github/repositories")
      const data = await response.json()

      if (data.success) {
        setRepositories(data.repositories)
        if (data.repositories.length > 0 && !selectedRepo) {
          setSelectedRepo(data.repositories[0].fullName)
        }
      } else {
        toast.error("Failed to load repositories")
      }
    } catch (error) {
      console.error("Error loading repositories:", error)
      toast.error("Failed to load repositories")
    } finally {
      setLoading(false)
    }
  }

  const loadBranches = async () => {
    if (!selectedRepo) return

    try {
      const response = await fetch(`/api/github/branches?repository=${selectedRepo}`)
      const data = await response.json()

      if (data.success) {
        setBranches(data.branches)
        if (data.branches.length > 0 && !selectedBranch) {
          const defaultBranch = data.branches.find((b: GitHubBranch) => b.name === "main" || b.name === "master")
          setSelectedBranch(defaultBranch?.name || data.branches[0].name)
        }
      }
    } catch (error) {
      console.error("Error loading branches:", error)
    }
  }

  const loadCommits = async () => {
    if (!selectedRepo) return

    try {
      const response = await fetch(`/api/github/commits?repository=${selectedRepo}&branch=${selectedBranch || "main"}`)
      const data = await response.json()

      if (data.success) {
        setCommits(data.commits)
      }
    } catch (error) {
      console.error("Error loading commits:", error)
    }
  }

  const loadProjectFiles = async () => {
    try {
      const response = await fetch("/api/github/project-files")
      const data = await response.json()

      if (data.success) {
        setProjectFiles(data.files)
      }
    } catch (error) {
      console.error("Error loading project files:", error)
    }
  }

  const createRepository = async () => {
    if (!newRepoName.trim()) {
      toast.error("Repository name is required")
      return
    }

    const operation: SyncOperation = {
      id: `create-${Date.now()}`,
      type: "commit",
      status: "running",
      progress: 0,
      message: `Creating repository: ${newRepoName}`,
      startTime: Date.now(),
    }

    setSyncOperations((prev) => [...prev, operation])

    try {
      const response = await fetch("/api/github/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRepoName,
          description: newRepoDescription,
          private: isPrivateRepo,
        }),
      })

      const data = await response.json()

      if (data.success) {
        updateOperation(operation.id, "success", 100, "Repository created successfully")
        setNewRepoName("")
        setNewRepoDescription("")
        await loadRepositories()
        toast.success(`Repository ${newRepoName} created successfully`)
      } else {
        updateOperation(operation.id, "error", 0, data.error || "Failed to create repository")
        toast.error("Failed to create repository")
      }
    } catch (error) {
      updateOperation(operation.id, "error", 0, "Network error")
      toast.error("Failed to create repository")
    }
  }

  const pushToGitHub = async () => {
    if (!selectedRepo || !commitMessage.trim()) {
      toast.error("Please select a repository and enter a commit message")
      return
    }

    const operation: SyncOperation = {
      id: `push-${Date.now()}`,
      type: "push",
      status: "running",
      progress: 0,
      message: "Pushing changes to GitHub...",
      startTime: Date.now(),
    }

    setSyncOperations((prev) => [...prev, operation])
    setSyncing(true)

    try {
      // Step 1: Commit changes
      updateOperation(operation.id, "running", 25, "Committing changes...")

      const commitResponse = await fetch("/api/github/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: selectedRepo,
          branch: selectedBranch,
          message: commitMessage,
          files: projectFiles.filter((f) => f.modified),
        }),
      })

      const commitData = await commitResponse.json()

      if (!commitData.success) {
        throw new Error(commitData.error || "Failed to commit changes")
      }

      // Step 2: Push to remote
      updateOperation(operation.id, "running", 75, "Pushing to remote repository...")

      const pushResponse = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: selectedRepo,
          branch: selectedBranch,
          commitSha: commitData.commitSha,
        }),
      })

      const pushData = await pushResponse.json()

      if (pushData.success) {
        updateOperation(operation.id, "success", 100, "Successfully pushed to GitHub")
        setCommitMessage("")
        await loadCommits()
        await loadProjectFiles()
        toast.success("Changes pushed to GitHub successfully")
      } else {
        throw new Error(pushData.error || "Failed to push changes")
      }
    } catch (error) {
      updateOperation(operation.id, "error", 0, error instanceof Error ? error.message : "Push failed")
      toast.error("Failed to push changes to GitHub")
    } finally {
      setSyncing(false)
    }
  }

  const pullFromGitHub = async () => {
    if (!selectedRepo) {
      toast.error("Please select a repository")
      return
    }

    const operation: SyncOperation = {
      id: `pull-${Date.now()}`,
      type: "pull",
      status: "running",
      progress: 0,
      message: "Pulling changes from GitHub...",
      startTime: Date.now(),
    }

    setSyncOperations((prev) => [...prev, operation])
    setSyncing(true)

    try {
      updateOperation(operation.id, "running", 50, "Fetching latest changes...")

      const response = await fetch("/api/github/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: selectedRepo,
          branch: selectedBranch,
        }),
      })

      const data = await response.json()

      if (data.success) {
        updateOperation(operation.id, "success", 100, `Pulled ${data.filesUpdated} files`)
        await loadProjectFiles()
        await loadCommits()
        toast.success("Successfully pulled changes from GitHub")
      } else {
        throw new Error(data.error || "Failed to pull changes")
      }
    } catch (error) {
      updateOperation(operation.id, "error", 0, error instanceof Error ? error.message : "Pull failed")
      toast.error("Failed to pull changes from GitHub")
    } finally {
      setSyncing(false)
    }
  }

  const syncBidirectional = async () => {
    if (!selectedRepo) {
      toast.error("Please select a repository")
      return
    }

    const operation: SyncOperation = {
      id: `sync-${Date.now()}`,
      type: "commit",
      status: "running",
      progress: 0,
      message: "Performing bidirectional sync...",
      startTime: Date.now(),
    }

    setSyncOperations((prev) => [...prev, operation])
    setSyncing(true)

    try {
      // Step 1: Pull latest changes
      updateOperation(operation.id, "running", 25, "Pulling latest changes...")
      await pullFromGitHub()

      // Step 2: Push local changes if any
      const modifiedFiles = projectFiles.filter((f) => f.modified)
      if (modifiedFiles.length > 0 && commitMessage.trim()) {
        updateOperation(operation.id, "running", 75, "Pushing local changes...")
        await pushToGitHub()
      }

      updateOperation(operation.id, "success", 100, "Bidirectional sync completed")
      toast.success("Bidirectional sync completed successfully")
    } catch (error) {
      updateOperation(operation.id, "error", 0, "Sync failed")
      toast.error("Bidirectional sync failed")
    } finally {
      setSyncing(false)
    }
  }

  const updateOperation = (id: string, status: SyncOperation["status"], progress: number, message: string) => {
    setSyncOperations((prev) =>
      prev.map((op) =>
        op.id === id
          ? {
              ...op,
              status,
              progress,
              message,
              endTime: status === "success" || status === "error" ? Date.now() : op.endTime,
            }
          : op,
      ),
    )
  }

  const getStatusIcon = (status: SyncOperation["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-gray-400" />
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getFileStatusColor = (status: ProjectFile["status"]) => {
    switch (status) {
      case "added":
        return "text-green-600"
      case "modified":
        return "text-yellow-600"
      case "deleted":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const modifiedFilesCount = projectFiles.filter((f) => f.modified).length

  if (tokenValid === false) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>GitHub Token Required:</strong> Please configure your GitHub token in the environment variables to
            use GitHub sync functionality.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GitHub Sync Dashboard</h1>
          <p className="text-muted-foreground">Manage your project synchronization with GitHub repositories</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadRepositories} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button onClick={syncBidirectional} disabled={syncing || !selectedRepo}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Quick Sync
          </Button>
        </div>
      </div>

      {/* Repository Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Repository Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Repository</label>
              <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select repository" />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map((repo) => (
                    <SelectItem key={repo.fullName} value={repo.fullName}>
                      <div className="flex items-center gap-2">
                        <span>{repo.name}</span>
                        {repo.private && (
                          <Badge variant="secondary" className="text-xs">
                            Private
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Branch</label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.name} value={branch.name}>
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-3 w-3" />
                        <span>{branch.name}</span>
                        {branch.protected && (
                          <Badge variant="outline" className="text-xs">
                            Protected
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedRepo && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{repositories.find((r) => r.fullName === selectedRepo)?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {repositories.find((r) => r.fullName === selectedRepo)?.description || "No description"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedBranch}</Badge>
                  <Badge variant="secondary">{modifiedFilesCount} modified</Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Sync Interface */}
      <Tabs defaultValue="sync" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sync">Sync Operations</TabsTrigger>
          <TabsTrigger value="files">Project Files</TabsTrigger>
          <TabsTrigger value="commits">Commit History</TabsTrigger>
          <TabsTrigger value="create">Create Repository</TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Commit & Push */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Push Changes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Commit Message</label>
                  <Textarea
                    placeholder="Describe your changes..."
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{modifiedFilesCount} files to commit</span>
                  <Badge variant={modifiedFilesCount > 0 ? "default" : "secondary"}>
                    {modifiedFilesCount > 0 ? "Changes pending" : "Up to date"}
                  </Badge>
                </div>
                <Button
                  onClick={pushToGitHub}
                  disabled={syncing || !commitMessage.trim() || modifiedFilesCount === 0}
                  className="w-full"
                >
                  {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Commit & Push
                </Button>
              </CardContent>
            </Card>

            {/* Pull Changes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Pull Changes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pull the latest changes from the remote repository to keep your local project up to date.
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span>Last sync: {commits[0] ? new Date(commits[0].author.date).toLocaleString() : "Never"}</span>
                  <Badge variant="outline">{commits.length} commits</Badge>
                </div>
                <Button onClick={pullFromGitHub} disabled={syncing} className="w-full">
                  {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Pull Latest
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sync Operations History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCommit className="h-5 w-5" />
                Recent Operations ({syncOperations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {syncOperations.map((operation) => (
                    <div key={operation.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {getStatusIcon(operation.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium capitalize">{operation.type} Operation</h4>
                          <Badge variant="outline" className="text-xs">
                            {operation.endTime && operation.startTime
                              ? `${operation.endTime - operation.startTime}ms`
                              : "Running..."}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{operation.message}</p>
                        {operation.status === "running" && (
                          <Progress value={operation.progress} className="w-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))}

                  {syncOperations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <GitCommit className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No sync operations yet</p>
                      <p className="text-sm">Start by pushing or pulling changes</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Files ({projectFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {projectFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-3">
                        {file.type === "directory" ? (
                          <FolderOpen className="h-4 w-4 text-blue-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-500" />
                        )}
                        <div>
                          <div className="font-medium text-sm">{file.path}</div>
                          <div className="text-xs text-muted-foreground">
                            {file.size > 0 && `${(file.size / 1024).toFixed(1)} KB`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.modified && (
                          <Badge variant="outline" className="text-xs">
                            Modified
                          </Badge>
                        )}
                        <Badge variant="secondary" className={`text-xs ${getFileStatusColor(file.status)}`}>
                          {file.status}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {projectFiles.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No project files found</p>
                      <p className="text-sm">Files will appear here once loaded</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCommit className="h-5 w-5" />
                Commit History ({commits.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {commits.map((commit) => (
                    <div key={commit.sha} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{commit.message}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{commit.author.name}</span>
                            <span>•</span>
                            <span>{new Date(commit.author.date).toLocaleString()}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs font-mono">
                          {commit.sha.substring(0, 7)}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {commits.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <GitCommit className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No commits found</p>
                      <p className="text-sm">Select a repository to view commit history</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitPullRequest className="h-5 w-5" />
                Create New Repository
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Repository Name</label>
                  <Input
                    placeholder="my-awesome-project"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visibility</label>
                  <Select
                    value={isPrivateRepo ? "private" : "public"}
                    onValueChange={(value) => setIsPrivateRepo(value === "private")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  placeholder="A brief description of your repository..."
                  value={newRepoDescription}
                  onChange={(e) => setNewRepoDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={createRepository} disabled={!newRepoName.trim() || syncing} className="w-full">
                {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Github className="h-4 w-4 mr-2" />}
                Create Repository
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
