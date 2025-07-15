"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RefreshCw, CheckCircle, AlertTriangle, Clock, Database, Loader2, Play, Pause } from "lucide-react"
import { useMultiRepoSync } from "@/hooks/use-multi-repo-sync"

interface RepositorySyncWidgetProps {
  variant?: "compact" | "full"
  showControls?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function RepositorySyncWidget({
  variant = "compact",
  showControls = true,
  autoRefresh = true,
  refreshInterval = 30000,
}: RepositorySyncWidgetProps) {
  const {
    repositories,
    syncing,
    loading,
    loadRepositories,
    syncRepository,
    syncAllRepositories,
    pauseSync,
    resumeSync,
    updatePriority,
    stats,
  } = useMultiRepoSync()

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh)

  useEffect(() => {
    loadRepositories()
  }, [loadRepositories])

  useEffect(() => {
    if (!autoRefreshEnabled) return

    const interval = setInterval(() => {
      if (!syncing) {
        loadRepositories()
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefreshEnabled, syncing, refreshInterval, loadRepositories])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "synced":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "syncing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Database className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "synced":
        return "bg-green-500"
      case "syncing":
        return "bg-blue-500"
      case "error":
        return "bg-red-500"
      case "pending":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatLastSync = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  if (variant === "compact") {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Repository Status</CardTitle>
            {showControls && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className="h-6 w-6 p-0"
                >
                  {autoRefreshEnabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={loadRepositories} disabled={loading} className="h-6 w-6 p-0">
                  <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {repositories.slice(0, 3).map((repo) => (
              <div key={repo.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getStatusIcon(repo.status)}
                  <span className="text-sm truncate">{repo.name.split("/")[1]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {repo.fileCount?.toLocaleString() || 0}
                  </Badge>
                  {repo.progress !== undefined && repo.progress < 100 && (
                    <div className="w-12">
                      <Progress value={repo.progress} className="h-1" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {repositories.length > 3 && (
              <div className="text-xs text-muted-foreground text-center pt-1">
                +{repositories.length - 3} more repositories
              </div>
            )}
          </div>

          {showControls && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={syncAllRepositories} disabled={syncing} className="flex-1">
                {syncing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                Sync All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Repository Sync Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{stats.totalRepositories} repos</Badge>
            <Badge variant="secondary">{stats.totalFiles.toLocaleString()} files</Badge>
            {showControls && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}>
                  {autoRefreshEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={loadRepositories} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {repositories.map((repo) => (
              <div key={repo.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getStatusIcon(repo.status)}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{repo.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {repo.fileCount?.toLocaleString() || 0} files
                      {repo.lastSync && ` • ${formatLastSync(repo.lastSync)}`}
                    </div>
                    {repo.progress !== undefined && repo.progress < 100 && (
                      <Progress value={repo.progress} className="h-1 mt-1" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${getStatusColor(repo.status)}`}>
                    Priority {repo.priority}
                  </Badge>
                  {showControls && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncRepository(repo.name)}
                      disabled={syncing || repo.status === "syncing"}
                    >
                      {repo.status === "syncing" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {showControls && (
          <div className="flex gap-2 mt-4">
            <Button onClick={syncAllRepositories} disabled={syncing} className="flex-1">
              {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Sync All Repositories
            </Button>
            <Button variant="outline" onClick={pauseSync} disabled={!syncing}>
              <Pause className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats.syncedRepositories}</div>
            <div className="text-xs text-muted-foreground">Synced</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.syncingRepositories}</div>
            <div className="text-xs text-muted-foreground">Syncing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{stats.errorRepositories}</div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
