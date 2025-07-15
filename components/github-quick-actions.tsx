"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, Upload, Download, GitBranch, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface QuickActionsProps {
  compact?: boolean
  selectedRepo?: string
  onRepoChange?: (repo: string) => void
}

export function GitHubQuickActions({ compact = false, selectedRepo, onRepoChange }: QuickActionsProps) {
  const [commitMessage, setCommitMessage] = useState("")
  const [pushing, setPushing] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  const quickPush = async () => {
    if (!selectedRepo) {
      toast.error("Please select a repository first")
      return
    }

    if (!commitMessage.trim()) {
      toast.error("Please enter a commit message")
      return
    }

    setPushing(true)
    try {
      // Simulate getting project files
      const filesResponse = await fetch("/api/github/project-files")
      const filesData = await filesResponse.json()

      if (!filesData.success) {
        throw new Error("Failed to get project files")
      }

      // Create commit
      const commitResponse = await fetch("/api/github/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: selectedRepo,
          branch: "main",
          message: commitMessage,
          files: filesData.files.slice(0, 10), // Limit to first 10 files for demo
        }),
      })

      const commitData = await commitResponse.json()

      if (!commitData.success) {
        throw new Error(commitData.error || "Failed to create commit")
      }

      // Push commit
      const pushResponse = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: selectedRepo,
          branch: "main",
          commitSha: commitData.commitSha,
        }),
      })

      const pushData = await pushResponse.json()

      if (pushData.success) {
        setCommitMessage("")
        setLastSync(new Date().toLocaleString())
        toast.success("Successfully pushed to GitHub!")
      } else {
        throw new Error(pushData.error || "Failed to push")
      }
    } catch (error) {
      console.error("Push error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to push to GitHub")
    } finally {
      setPushing(false)
    }
  }

  const quickPull = async () => {
    if (!selectedRepo) {
      toast.error("Please select a repository first")
      return
    }

    setPulling(true)
    try {
      const response = await fetch("/api/github/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: selectedRepo,
          branch: "main",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setLastSync(new Date().toLocaleString())
        toast.success(`Pulled ${data.filesUpdated} updated files from GitHub`)
      } else {
        throw new Error(data.error || "Failed to pull")
      }
    } catch (error) {
      console.error("Pull error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to pull from GitHub")
    } finally {
      setPulling(false)
    }
  }

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              <span className="text-sm font-medium">GitHub Sync</span>
              {lastSync && (
                <Badge variant="outline" className="text-xs">
                  Last: {lastSync}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={quickPull} disabled={pulling || !selectedRepo}>
                {pulling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              </Button>
              <Button size="sm" onClick={quickPush} disabled={pushing || !selectedRepo || !commitMessage.trim()}>
                {pushing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          {selectedRepo && (
            <Input
              placeholder="Quick commit message..."
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="mt-2 text-xs"
              size={1}
            />
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          Quick GitHub Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedRepo && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Please select a repository in the main dashboard to use quick actions.</AlertDescription>
          </Alert>
        )}

        {selectedRepo && (
          <>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <span className="text-sm font-medium">{selectedRepo}</span>
                <Badge variant="outline">main</Badge>
              </div>
              {lastSync && <p className="text-xs text-muted-foreground mt-1">Last sync: {lastSync}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Commit Message</label>
              <Input
                placeholder="Describe your changes..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    quickPush()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Press Ctrl+Enter to quick push</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={quickPull} disabled={pulling} variant="outline" className="w-full bg-transparent">
                {pulling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Pull Latest
              </Button>
              <Button onClick={quickPush} disabled={pushing || !commitMessage.trim()} className="w-full">
                {pushing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Push Changes
              </Button>
            </div>

            {(pushing || pulling) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{pushing ? "Pushing changes..." : "Pulling changes..."}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
