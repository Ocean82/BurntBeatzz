"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, Download, FileMusic, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useLdrolezSync } from "@/hooks/use-ldrolez-sync"

interface QuickSyncProps {
  compact?: boolean
  showStats?: boolean
  autoLoad?: boolean
}

export function LdrolezQuickSync({ compact = false, showStats = true, autoLoad = false }: QuickSyncProps) {
  const { files, stats, loading, syncing, error, loadFiles, syncRepository, downloadBatch } = useLdrolezSync()

  const [quickDownloading, setQuickDownloading] = useState(false)

  const handleQuickDownload = async () => {
    if (files.length === 0) {
      toast.error("No files available for download")
      return
    }

    setQuickDownloading(true)
    try {
      // Download first 5 files as a quick sample
      const sampleFiles = files.slice(0, 5)
      await downloadBatch(sampleFiles)
    } catch (error) {
      console.error("Quick download error:", error)
    } finally {
      setQuickDownloading(false)
    }
  }

  // Auto-load files if requested
  React.useEffect(() => {
    if (autoLoad && files.length === 0 && !loading) {
      loadFiles()
    }
  }, [autoLoad, files.length, loading, loadFiles])

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Github className="h-5 w-5" />
              <div>
                <div className="font-medium">ldrolez/free-midi-chords</div>
                <div className="text-sm text-muted-foreground">
                  {files.length > 0 ? `${files.length} files loaded` : "Ready to sync"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {files.length > 0 && <Badge variant="outline">{files.length} files</Badge>}
              <Button size="sm" onClick={files.length > 0 ? syncRepository : loadFiles} disabled={loading || syncing}>
                {loading || syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : files.length > 0 ? "Sync" : "Load"}
              </Button>
            </div>
          </div>
          {error && (
            <Alert className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Sync Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            ldrolez/free-midi-chords Quick Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Quick access to the largest free MIDI chord collection</p>
              {files.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Last loaded: {stats?.lastSync ? new Date(stats.lastSync).toLocaleString() : "Unknown"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={loadFiles} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileMusic className="h-4 w-4 mr-2" />}
                Load Files
              </Button>
              <Button onClick={syncRepository} disabled={syncing}>
                {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Github className="h-4 w-4 mr-2" />}
                Full Sync
              </Button>
            </div>
          </div>

          {(loading || syncing) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{syncing ? "Syncing repository..." : "Loading files..."}</span>
                <span>{syncing ? "This may take a few minutes" : "Please wait"}</span>
              </div>
              <Progress value={syncing ? 45 : 75} className="w-full" />
            </div>
          )}

          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {files.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">{files.length} MIDI files ready</span>
              </div>
              <Button size="sm" onClick={handleQuickDownload} disabled={quickDownloading}>
                {quickDownloading ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-2" />
                )}
                Quick Download (5 files)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Card */}
      {showStats && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Repository Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalFiles}</div>
                <div className="text-sm text-muted-foreground">Total Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Object.keys(stats.categories).length}</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{(stats.totalSize / 1024 / 1024).toFixed(1)}MB</div>
                <div className="text-sm text-muted-foreground">Total Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.syncDuration || 0}ms</div>
                <div className="text-sm text-muted-foreground">Sync Time</div>
              </div>
            </div>

            {Object.keys(stats.categories).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Categories:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.categories).map(([category, count]) => (
                    <Badge key={category} variant="secondary">
                      {category}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
