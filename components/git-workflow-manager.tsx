"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  GitBranch,
  GitCommit,
  GitMerge,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Terminal,
  Globe,
  Lock,
} from "lucide-react"
import { toast } from "sonner"

interface GitStatus {
  branch: string
  ahead: number
  behind: number
  staged: string[]
  modified: string[]
  untracked: string[]
  clean: boolean
}

interface RemoteRepository {
  name: string
  url: string
  accessible: boolean
  exists: boolean
  private: boolean
}

export function GitWorkflowManager() {
  const [repositoryUrl, setRepositoryUrl] = useState("https://github.com/Ocean82/BurntBeatzz.git")
  const [alternativeUrls, setAlternativeUrls] = useState([
    "https://github.com/Ocean82/BurntBeatzz",
    "https://github.com/Ocean82/BurntBeats",
    "https://github.com/Ocean82/Burnt-Beats",
  ])
  const [commitMessage, setCommitMessage] = useState("")
  const [targetBranch, setTargetBranch] = useState("main")
  const [currentBranch, setCurrentBranch] = useState("test")

  const [gitStatus, setGitStatus] = useState<GitStatus>({
    branch: "test",
    ahead: 0,
    behind: 0,
    staged: [],
    modified: [],
    untracked: [],
    clean: true,
  })

  const [remoteStatus, setRemoteStatus] = useState<RemoteRepository>({
    name: "origin",
    url: "https://github.com/Ocean82/BurntBeatzz.git",
    accessible: false,
    exists: false,
    private: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [currentOperation, setCurrentOperation] = useState<string | null>(null)
  const [operationLog, setOperationLog] = useState<string[]>([])

  const addToLog = (message: string) => {
    setOperationLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const checkRepositoryStatus = async () => {
    setIsLoading(true)
    setCurrentOperation("Checking repository status...")
    addToLog("Checking repository accessibility...")

    try {
      // First try the main URL
      let response = await fetch("/api/github/validate-repository", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repositoryUrl }),
      })

      let data = await response.json()

      // If main URL fails, try alternatives
      if (!data.accessible && alternativeUrls.length > 0) {
        addToLog("Main URL not accessible, trying alternative URLs...")

        for (const altUrl of alternativeUrls) {
          addToLog(`Trying: ${altUrl}`)
          response = await fetch("/api/github/validate-repository", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: altUrl }),
          })

          data = await response.json()

          if (data.accessible) {
            addToLog(`✅ Found accessible repository: ${altUrl}`)
            setRepositoryUrl(altUrl)
            break
          }
        }
      }

      setRemoteStatus({
        name: "origin",
        url: data.accessible ? (data.fullName ? `https://github.com/${data.fullName}` : repositoryUrl) : repositoryUrl,
        accessible: data.accessible || false,
        exists: data.exists || false,
        private: data.private || false,
      })

      if (!data.accessible) {
        addToLog("❌ Repository not accessible - checking if recently made public...")
        addToLog("💡 If repository was just made public, try again in a few minutes")
        toast.error("Repository not accessible - may need time to propagate if recently made public")
      } else {
        addToLog("✅ Repository is accessible and ready for Git operations")
        toast.success("Repository found and accessible")
      }
    } catch (error) {
      addToLog(`❌ Error checking repository: ${error}`)
      toast.error("Failed to check repository status")
    } finally {
      setIsLoading(false)
      setCurrentOperation(null)
    }
  }

  const initializeRepository = async () => {
    setIsLoading(true)
    setCurrentOperation("Initializing repository...")
    addToLog("Initializing Git repository...")

    try {
      const response = await fetch("/api/git/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remoteUrl: repositoryUrl,
          branch: currentBranch,
        }),
      })

      const data = await response.json()

      if (data.success) {
        addToLog("✅ Repository initialized successfully")
        toast.success("Repository initialized")
        await checkGitStatus()
      } else {
        addToLog(`❌ Failed to initialize repository: ${data.error}`)
        toast.error("Failed to initialize repository")
      }
    } catch (error) {
      addToLog(`❌ Error initializing repository: ${error}`)
      toast.error("Failed to initialize repository")
    } finally {
      setIsLoading(false)
      setCurrentOperation(null)
    }
  }

  const checkGitStatus = async () => {
    setIsLoading(true)
    setCurrentOperation("Checking Git status...")
    addToLog("Checking Git status...")

    try {
      const response = await fetch("/api/git/status")
      const data = await response.json()

      if (data.success) {
        setGitStatus(data.status)
        addToLog(`✅ Git status updated - Branch: ${data.status.branch}`)
      } else {
        addToLog(`❌ Failed to get Git status: ${data.error}`)
      }
    } catch (error) {
      addToLog(`❌ Error checking Git status: ${error}`)
    } finally {
      setIsLoading(false)
      setCurrentOperation(null)
    }
  }

  const stageAllChanges = async () => {
    setIsLoading(true)
    setCurrentOperation("Staging changes...")
    addToLog("Staging all changes...")

    try {
      const response = await fetch("/api/git/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: ["."] }),
      })

      const data = await response.json()

      if (data.success) {
        addToLog("✅ All changes staged successfully")
        toast.success("Changes staged")
        await checkGitStatus()
      } else {
        addToLog(`❌ Failed to stage changes: ${data.error}`)
        toast.error("Failed to stage changes")
      }
    } catch (error) {
      addToLog(`❌ Error staging changes: ${error}`)
      toast.error("Failed to stage changes")
    } finally {
      setIsLoading(false)
      setCurrentOperation(null)
    }
  }

  const commitChanges = async () => {
    if (!commitMessage.trim()) {
      toast.error("Please enter a commit message")
      return
    }

    setIsLoading(true)
    setCurrentOperation("Committing changes...")
    addToLog(`Committing changes: "${commitMessage}"`)

    try {
      const response = await fetch("/api/git/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commitMessage }),
      })

      const data = await response.json()

      if (data.success) {
        addToLog(`✅ Changes committed successfully: ${data.hash}`)
        toast.success("Changes committed")
        setCommitMessage("")
        await checkGitStatus()
      } else {
        addToLog(`❌ Failed to commit changes: ${data.error}`)
        toast.error("Failed to commit changes")
      }
    } catch (error) {
      addToLog(`❌ Error committing changes: ${error}`)
      toast.error("Failed to commit changes")
    } finally {
      setIsLoading(false)
      setCurrentOperation(null)
    }
  }

  const pushChanges = async () => {
    setIsLoading(true)
    setCurrentOperation("Pushing to remote...")
    addToLog(`Pushing ${currentBranch} to origin...`)

    try {
      const response = await fetch("/api/git/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch: currentBranch,
          remote: "origin",
        }),
      })

      const data = await response.json()

      if (data.success) {
        addToLog("✅ Changes pushed to remote successfully")
        toast.success("Changes pushed to remote")
        await checkGitStatus()
      } else {
        addToLog(`❌ Failed to push changes: ${data.error}`)
        toast.error("Failed to push changes")
      }
    } catch (error) {
      addToLog(`❌ Error pushing changes: ${error}`)
      toast.error("Failed to push changes")
    } finally {
      setIsLoading(false)
      setCurrentOperation(null)
    }
  }

  const switchBranch = async (branch: string) => {
    setIsLoading(true)
    setCurrentOperation(`Switching to ${branch}...`)
    addToLog(`Switching to branch: ${branch}`)

    try {
      const response = await fetch("/api/git/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch }),
      })

      const data = await response.json()

      if (data.success) {
        setCurrentBranch(branch)
        addToLog(`✅ Switched to branch: ${branch}`)
        toast.success(`Switched to ${branch}`)
        await checkGitStatus()
      } else {
        addToLog(`❌ Failed to switch branch: ${data.error}`)
        toast.error("Failed to switch branch")
      }
    } catch (error) {
      addToLog(`❌ Error switching branch: ${error}`)
      toast.error("Failed to switch branch")
    } finally {
      setIsLoading(false)
      setCurrentOperation(null)
    }
  }

  const mergeWithMain = async () => {
    setIsLoading(true)
    setCurrentOperation(`Merging ${currentBranch} with ${targetBranch}...`)
    addToLog(`Merging ${currentBranch} into ${targetBranch}`)

    try {
      // First switch to target branch
      await switchBranch(targetBranch)

      // Then merge current branch
      const response = await fetch("/api/git/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceBranch: currentBranch,
          targetBranch: targetBranch,
        }),
      })

      const data = await response.json()

      if (data.success) {
        addToLog(`✅ Successfully merged ${currentBranch} into ${targetBranch}`)
        toast.success("Merge completed successfully")
        await checkGitStatus()
      } else {
        addToLog(`❌ Failed to merge: ${data.error}`)
        toast.error("Merge failed")
      }
    } catch (error) {
      addToLog(`❌ Error during merge: ${error}`)
      toast.error("Merge failed")
    } finally {
      setIsLoading(false)
      setCurrentOperation(null)
    }
  }

  const runCompleteWorkflow = async () => {
    setIsLoading(true)
    addToLog("🚀 Starting complete Git workflow...")

    try {
      // Step 1: Check repository
      await checkRepositoryStatus()

      // Step 2: Stage all changes
      await stageAllChanges()

      // Step 3: Commit changes
      if (commitMessage.trim()) {
        await commitChanges()
      }

      // Step 4: Push changes
      await pushChanges()

      // Step 5: Merge with main
      await mergeWithMain()

      addToLog("🎉 Complete workflow finished successfully!")
      toast.success("Complete Git workflow completed!")
    } catch (error) {
      addToLog(`❌ Workflow failed: ${error}`)
      toast.error("Workflow failed")
    } finally {
      setIsLoading(false)
      setCurrentOperation(null)
    }
  }

  useEffect(() => {
    checkRepositoryStatus()
    checkGitStatus()
  }, [])

  const getRepositoryStatusIcon = () => {
    if (!remoteStatus.accessible) {
      return <XCircle className="h-5 w-5 text-red-500" />
    } else if (remoteStatus.private) {
      return <Lock className="h-5 w-5 text-yellow-500" />
    } else {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🔄 Git Workflow Manager</h1>
        <p className="text-muted-foreground">Stage, commit, sync, and merge with main branch</p>
      </div>

      {/* Repository Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Repository Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repo-url">Repository URL</Label>
              <div className="flex gap-2">
                <Input
                  id="repo-url"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo.git"
                  className="flex-1"
                />
                <Button variant="outline" onClick={checkRepositoryStatus} disabled={isLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                If repository was recently made public, it may take a few minutes to be accessible
              </p>
            </div>

            <div className="flex items-center gap-3">
              {getRepositoryStatusIcon()}
              <div className="flex-1">
                <p className="font-medium">{remoteStatus.url}</p>
                <p className="text-sm text-muted-foreground">
                  {!remoteStatus.accessible
                    ? "Repository not accessible - may be private, not exist, or recently made public"
                    : remoteStatus.private
                      ? "Private repository - authentication required"
                      : "Public repository - accessible"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{gitStatus.branch}</div>
              <div className="text-sm text-muted-foreground">Current Branch</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{gitStatus.ahead}</div>
              <div className="text-sm text-muted-foreground">Ahead</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">{gitStatus.behind}</div>
              <div className="text-sm text-muted-foreground">Behind</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{gitStatus.staged.length}</div>
              <div className="text-sm text-muted-foreground">Staged</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Workflow */}
      <Tabs defaultValue="workflow" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflow">Complete Workflow</TabsTrigger>
          <TabsTrigger value="manual">Manual Operations</TabsTrigger>
          <TabsTrigger value="logs">Operation Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Complete Git Workflow</CardTitle>
              <CardDescription>Automatically stage, commit, push, and merge with main branch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="commit-message">Commit Message</Label>
                <Textarea
                  id="commit-message"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Enter commit message..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Branch</Label>
                  <Input value={currentBranch} onChange={(e) => setCurrentBranch(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Target Branch</Label>
                  <Input value={targetBranch} onChange={(e) => setTargetBranch(e.target.value)} />
                </div>
              </div>

              {currentOperation && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>{currentOperation}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={runCompleteWorkflow}
                disabled={isLoading || !commitMessage.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Workflow...
                  </>
                ) : (
                  <>
                    <GitMerge className="h-4 w-4 mr-2" />
                    Run Complete Workflow
                  </>
                )}
              </Button>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">This workflow will:</p>
                <ul className="space-y-1">
                  <li>• Check repository accessibility</li>
                  <li>• Stage all changes (git add .)</li>
                  <li>• Commit with your message</li>
                  <li>• Push to remote repository</li>
                  <li>• Switch to {targetBranch} branch</li>
                  <li>
                    • Merge {currentBranch} into {targetBranch}
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCommit className="h-5 w-5" />
                  Stage & Commit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={stageAllChanges} disabled={isLoading} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Stage All Changes
                </Button>
                <Button onClick={commitChanges} disabled={isLoading || !commitMessage.trim()} className="w-full">
                  <GitCommit className="h-4 w-4 mr-2" />
                  Commit Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Branch Operations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={pushChanges} disabled={isLoading} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Push to Remote
                </Button>
                <Button onClick={mergeWithMain} disabled={isLoading} className="w-full">
                  <GitMerge className="h-4 w-4 mr-2" />
                  Merge with {targetBranch}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Operation Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                <div className="space-y-1">
                  {operationLog.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No operations logged yet</p>
                  ) : (
                    operationLog.map((log, index) => (
                      <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Repository Not Found Alert */}
      {!remoteStatus.accessible && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Repository Not Accessible</strong>
            <br />
            The repository https://github.com/Ocean82/BurntBeatzz.git returned a 404 error. This could mean:
            <ul className="mt-2 space-y-1">
              <li>• The repository doesn't exist</li>
              <li>• The repository is private and requires authentication</li>
              <li>• The URL is incorrect</li>
              <li>• You don't have access permissions</li>
            </ul>
            <br />
            Please verify the repository URL and your access permissions.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
