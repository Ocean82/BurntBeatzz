"use client"

import { useState, useCallback } from "react"
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

export function useMultiRepoSync() {
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [stats, setStats] = useState<RepositoryStats | null>(null)
  const [syncProgress, setSyncProgress] = useState(0)

  const loadRepositories = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/github/sync-repositories")
      const data = await response.json()

      if (data.success) {
        setRepositories(data.repositories)
        setStats(data.stats)
      } else {
        toast.error("Failed to load repositories")
      }
    } catch (error) {
      console.error("Error loading repositories:", error)
      toast.error("Failed to load repositories")
    } finally {
      setLoading(false)
    }
  }, [])

  const syncAllRepositories = useCallback(async () => {
    setSyncing(true)
    setSyncProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSyncProgress((prev) => Math.min(prev + 5, 90))
      }, 1000)

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
  }, [])

  const syncSpecificRepositories = useCallback(
    async (repoConfigs: Repository[]) => {
      setSyncing(true)
      setSyncProgress(0)

      try {
        const progressInterval = setInterval(() => {
          setSyncProgress((prev) => Math.min(prev + 10, 90))
        }, 500)

        const response = await fetch("/api/github/sync-repositories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            syncAll: false,
            repositories: repoConfigs,
          }),
        })

        clearInterval(progressInterval)
        setSyncProgress(100)

        const data = await response.json()

        if (data.success) {
          toast.success(data.message)
          await loadRepositories()
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
    },
    [loadRepositories],
  )

  const addRepository = useCallback(
    async (repo: Omit<Repository, "lastSync" | "status">) => {
      try {
        const response = await fetch("/api/github/sync-repositories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add",
            ...repo,
          }),
        })

        const data = await response.json()

        if (data.success) {
          toast.success(data.message)
          await loadRepositories()
        } else {
          toast.error(data.error)
        }
      } catch (error) {
        console.error("Error adding repository:", error)
        toast.error("Failed to add repository")
      }
    },
    [loadRepositories],
  )

  const removeRepository = useCallback(
    async (owner: string, repo: string) => {
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
          await loadRepositories()
        } else {
          toast.error(data.error)
        }
      } catch (error) {
        console.error("Error removing repository:", error)
        toast.error("Failed to remove repository")
      }
    },
    [loadRepositories],
  )

  const updateRepositoryStatus = useCallback(
    async (owner: string, repo: string, status: Repository["status"]) => {
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
          await loadRepositories()
        } else {
          toast.error(data.error)
        }
      } catch (error) {
        console.error("Error updating repository status:", error)
        toast.error("Failed to update repository status")
      }
    },
    [loadRepositories],
  )

  const getMidiFiles = useCallback(async (repository?: string) => {
    try {
      const params = new URLSearchParams()
      if (repository) params.set("repository", repository)
      params.set("includeContent", "false")

      const response = await fetch(`/api/github/sync-repositories?${params}`)
      const data = await response.json()

      if (data.success) {
        return data.files || []
      } else {
        toast.error("Failed to load MIDI files")
        return []
      }
    } catch (error) {
      console.error("Error loading MIDI files:", error)
      toast.error("Failed to load MIDI files")
      return []
    }
  }, [])

  const formatFileSize = useCallback((bytes: number): string => {
    const sizes = ["B", "KB", "MB", "GB"]
    if (bytes === 0) return "0 B"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }, [])

  const formatDuration = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`
  }, [])

  return {
    loading,
    syncing,
    repositories,
    stats,
    syncProgress,
    loadRepositories,
    syncAllRepositories,
    syncSpecificRepositories,
    addRepository,
    removeRepository,
    updateRepositoryStatus,
    getMidiFiles,
    formatFileSize,
    formatDuration,
  }
}
