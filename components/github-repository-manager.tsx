"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Github,
  GitBranch,
  Upload,
  Download,
  Plus,
  Folder,
  File,
  Music,
  FileMusic,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Eye,
} from "lucide-react"
import { toast } from "sonner"

interface Repository {
  id: number
  name: string
  fullName: string
  description: string
  private: boolean
  htmlUrl: string
  cloneUrl: string
  defaultBranch: string
  updatedAt: string
  language: string
  size: number
}

interface Branch {
  name: string
  sha: string
  protected: boolean
}

interface FileContent {
  name: string
  path: string
  content: string
  sha: string
  size: number
  encoding: string
}

interface RepositoryContent {
  name: string
  path: string
  type: "file" | "dir"
  size?: number
  download_url?: string
}

export function GitHubRepositoryManager() {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("main")
  const [repoContents, setRepoContents] = useState<RepositoryContent[]>([])
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("repositories")

  // Form states
  const [newRepoName, setNewRepoName] = useState("")
  const [newRepoDescription, setNewRepoDescription] = useState("")
  const [newRepoPrivate, setNewRepoPrivate] = useState(false)
  const [newBranchName, setNewBranchName] = useState("")
  const [commitMessage, setCommitMessage] = useState("")
  const [fileContent, setFileContent] = useState("")
  const [fileName, setFileName] = useState("")

  // Load repositories on component mount
  useEffect(() => {
    loadRepositories()
  }, [])

  // Load branches when repository is selected
  useEffect(() => {
    if (selectedRepo) {
      loadBranches()
      loadRepositoryContents()
    }
  }, [selectedRepo, selectedBranch])

  const loadRepositories = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/github/repositories")
      const data = await response.json()

      if (data.success) {
        setRepositories(data.repositories)
        toast.success(`Loaded ${data.repositories.length} repositories`)
      } else {
        toast.error(data.error)
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
      const response = await fetch(
        `/api/github/branches?owner=${selectedRepo.fullName.split("/")[0]}&repo=${selectedRepo.name}`,
      )
      const data = await response.json()

      if (data.success) {
        setBranches(data.branches)
        if (data.branches.length > 0 && !data.branches.find((b: Branch) => b.name === selectedBranch)) {
          setSelectedBranch(data.branches[0].name)
        }
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error loading branches:", error)
      toast.error("Failed to load branches")
    }
  }

  const loadRepositoryContents = async () => {
    if (!selectedRepo) return

    setLoading(true)
    try {
      const [owner, repo] = selectedRepo.fullName.split("/")
      const response = await fetch("/api/github/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          branch: selectedBranch,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setRepoContents(data.contents)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error loading repository contents:", error)
      toast.error("Failed to load repository contents")
    } finally {
      setLoading(false)
    }
  }

  const createRepository = async () => {
    if (!newRepoName.trim()) {
      toast.error("Repository name is required")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/github/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRepoName,
          description: newRepoDescription,
          isPrivate: newRepoPrivate,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setNewRepoName("")
        setNewRepoDescription("")
        setNewRepoPrivate(false)
        loadRepositories()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error creating repository:", error)
      toast.error("Failed to create repository")
    } finally {
      setLoading(false)
    }
  }

  const createBranch = async () => {
    if (!selectedRepo || !newBranchName.trim()) {
      toast.error("Repository and branch name are required")
      return
    }

    setLoading(true)
    try {
      const [owner, repo] = selectedRepo.fullName.split("/")
      const response = await fetch("/api/github/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          branchName: newBranchName,
          fromBranch: selectedBranch,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setNewBranchName("")
        loadBranches()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error creating branch:", error)
      toast.error("Failed to create branch")
    } finally {
      setLoading(false)
    }
  }

  const pushFile = async () => {
    if (!selectedRepo || !fileName.trim() || !fileContent.trim() || !commitMessage.trim()) {
      toast.error("Repository, file name, content, and commit message are required")
      return
    }

    setLoading(true)
    try {
      const [owner, repo] = selectedRepo.fullName.split("/")
      const response = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          branch: selectedBranch,
          files: [
            {
              path: fileName,
              content: fileContent,
              encoding: "utf-8",
            },
          ],
          message: commitMessage,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setFileName("")
        setFileContent("")
        setCommitMessage("")
        loadRepositoryContents()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error pushing file:", error)
      toast.error("Failed to push file")
    } finally {
      setLoading(false)
    }
  }

  const pullFile = async (filePath: string) => {
    if (!selectedRepo) return

    setLoading(true)
    try {
      const [owner, repo] = selectedRepo.fullName.split("/")
      const response = await fetch("/api/github/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          branch: selectedBranch,
          path: filePath,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSelectedFile(data.file)
        toast.success(`Pulled file: ${filePath}`)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error pulling file:", error)
      toast.error("Failed to pull file")
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (fileName: string, type: string) => {
    if (type === "dir") return <Folder className="h-4 w-4 text-blue-500" />

    const name = fileName.toLowerCase()
    if (name.endsWith(".mid") || name.endsWith(".midi")) {
      return <FileMusic className="h-4 w-4 text-green-500" />
    }
    if (name.includes("melody") || name.includes("music")) {
      return <Music className="h-4 w-4 text-purple-500" />
    }
    return <File className="h-4 w-4 text-gray-500" />
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 B"
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const downloadFile = (file: FileContent) => {
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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="browse">Browse Files</TabsTrigger>
          <TabsTrigger value="push">Push Files</TabsTrigger>
          <TabsTrigger value="pull">Pull Files</TabsTrigger>
        </TabsList>

        {/* Repositories Tab */}
        <TabsContent value="repositories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                Your Repositories
                <Button variant="outline" size="sm" onClick={loadRepositories} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {repositories.map((repo) => (
                    <div
                      key={repo.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRepo?.id === repo.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedRepo(repo)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {repo.name}
                            {repo.private && <Badge variant="secondary">Private</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">{repo.description || "No description"}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{formatFileSize(repo.size * 1024)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Create Repository */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Repository
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repo-name">Repository Name</Label>
                  <Input
                    id="repo-name"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    placeholder="my-melody-collection"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repo-description">Description</Label>
                  <Input
                    id="repo-description"
                    value={newRepoDescription}
                    onChange={(e) => setNewRepoDescription(e.target.value)}
                    placeholder="Collection of melody files"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="private-repo"
                  checked={newRepoPrivate}
                  onChange={(e) => setNewRepoPrivate(e.target.checked)}
                />
                <Label htmlFor="private-repo">Private repository</Label>
              </div>
              <Button onClick={createRepository} disabled={loading || !newRepoName.trim()}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Repository
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Browse Files Tab */}
        <TabsContent value="browse" className="space-y-4">
          {selectedRepo ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    {selectedRepo.name}
                    <Badge variant="outline">{selectedBranch}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Branch Selection */}
                  <div className="flex items-center gap-4">
                    <Label>Branch:</Label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.name} value={branch.name}>
                            <div className="flex items-center gap-2">
                              <GitBranch className="h-4 w-4" />
                              {branch.name}
                              {branch.protected && (
                                <Badge variant="secondary" className="text-xs">
                                  Protected
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={loadRepositoryContents} disabled={loading}>
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>

                  {/* Repository Contents */}
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {repoContents.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                          onClick={() => item.type === "file" && pullFile(item.path)}
                        >
                          <div className="flex items-center gap-3">
                            {getFileIcon(item.name, item.type)}
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">{item.path}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.size && (
                              <span className="text-xs text-muted-foreground">{formatFileSize(item.size)}</span>
                            )}
                            {item.type === "file" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  pullFile(item.path)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Create Branch */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Create New Branch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      placeholder="feature/new-melodies"
                      className="flex-1"
                    />
                    <Button onClick={createBranch} disabled={loading || !newBranchName.trim()}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <GitBranch className="h-4 w-4 mr-2" />
                      )}
                      Create Branch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Please select a repository from the Repositories tab to browse files.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Push Files Tab */}
        <TabsContent value="push" className="space-y-4">
          {selectedRepo ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Push File to {selectedRepo.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-name">File Name</Label>
                    <Input
                      id="file-name"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="melody1.json"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.name} value={branch.name}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-content">File Content</Label>
                  <Textarea
                    id="file-content"
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    placeholder="Enter your file content here..."
                    rows={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commit-message">Commit Message</Label>
                  <Input
                    id="commit-message"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Add new melody file"
                  />
                </div>

                <Button
                  onClick={pushFile}
                  disabled={loading || !fileName.trim() || !fileContent.trim() || !commitMessage.trim()}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Push File
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Please select a repository from the Repositories tab to push files.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Pull Files Tab */}
        <TabsContent value="pull" className="space-y-4">
          {selectedFile ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getFileIcon(selectedFile.name, "file")}
                  {selectedFile.name}
                  <Badge variant="outline">{formatFileSize(selectedFile.size)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Path: {selectedFile.path}</span>
                  <span>Encoding: {selectedFile.encoding}</span>
                </div>

                <div className="space-y-2">
                  <Label>File Content:</Label>
                  <ScrollArea className="h-64 w-full border rounded-md">
                    <pre className="p-4 text-sm font-mono whitespace-pre-wrap">{selectedFile.content}</pre>
                  </ScrollArea>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => downloadFile(selectedFile)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  {selectedFile.name.toLowerCase().includes("melody") && (
                    <Button variant="outline">
                      <Music className="h-4 w-4 mr-2" />
                      Process Melody
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Select a file from the Browse Files tab to view its content here.</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
