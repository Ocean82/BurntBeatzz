import { githubConfig } from "@/lib/config/github-config"

interface Repository {
  owner: string
  repo: string
  branch?: string
  paths: string[]
  description: string
  priority: number
  lastSync?: string
  status: "active" | "inactive" | "error"
}

interface SyncResult {
  repository: string
  filesFound: number
  filesDownloaded: number
  errors: string[]
  duration: number
  lastSync: string
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

export class MultiRepoSyncService {
  private repositories: Repository[] = [
    {
      owner: "ldrolez",
      repo: "free-midi-chords",
      branch: "main",
      paths: ["", "chords", "progressions", "src/chords2midi", "midi", "data"],
      description: "🎵 PRIMARY: Free MIDI chords and progressions - over 10,000 MIDI files",
      priority: 1,
      status: "active",
    },
    {
      owner: "kylelix7",
      repo: "music-generation",
      branch: "main",
      paths: ["src/chords2midi", "midi_files", "examples", "data"],
      description: "Music generation with chord to MIDI conversion",
      priority: 2,
      status: "active",
    },
    {
      owner: "craffel",
      repo: "pretty-midi",
      branch: "main",
      paths: ["examples", "tests/data"],
      description: "Pretty MIDI library examples and test data",
      priority: 3,
      status: "active",
    },
    {
      owner: "bearpelican",
      repo: "musicautobot",
      branch: "master",
      paths: ["data/midi", "musicautobot/music_transformer"],
      description: "Music generation with transformers",
      priority: 4,
      status: "active",
    },
    {
      owner: "magenta",
      repo: "magenta",
      branch: "main",
      paths: ["magenta/models/music_vae/data", "magenta/models/melody_rnn/data"],
      description: "Google Magenta music AI models",
      priority: 5,
      status: "active",
    },
    {
      owner: "microsoft",
      repo: "muzic",
      branch: "main",
      paths: ["musicbert/data", "roc/data"],
      description: "Microsoft music AI research",
      priority: 6,
      status: "active",
    },
  ]

  private syncResults: Map<string, SyncResult> = new Map()
  private midiFiles: Map<string, MidiFile[]> = new Map()

  async syncAllRepositories(): Promise<{
    success: boolean
    results: SyncResult[]
    totalFiles: number
    errors: string[]
  }> {
    console.log("🔄 Starting multi-repository sync...")

    const results: SyncResult[] = []
    const allErrors: string[] = []
    let totalFiles = 0

    // Sort repositories by priority
    const sortedRepos = [...this.repositories].sort((a, b) => a.priority - b.priority)

    for (const repo of sortedRepos) {
      if (repo.status !== "active") {
        console.log(`⏭️ Skipping inactive repository: ${repo.owner}/${repo.repo}`)
        continue
      }

      try {
        console.log(`🔄 Syncing repository: ${repo.owner}/${repo.repo}`)
        const result = await this.syncRepository(repo)
        results.push(result)
        totalFiles += result.filesDownloaded

        if (result.errors.length > 0) {
          allErrors.push(...result.errors)
        }

        // Update repository status
        repo.lastSync = result.lastSync
        repo.status = result.errors.length > 0 ? "error" : "active"

        // Small delay between repositories to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        const errorMsg = `Failed to sync ${repo.owner}/${repo.repo}: ${error instanceof Error ? error.message : "Unknown error"}`
        console.error(`❌ ${errorMsg}`)
        allErrors.push(errorMsg)
        repo.status = "error"
      }
    }

    console.log(`✅ Multi-repository sync completed. Total files: ${totalFiles}`)

    return {
      success: allErrors.length === 0,
      results,
      totalFiles,
      errors: allErrors,
    }
  }

  async syncRepository(repo: Repository): Promise<SyncResult> {
    const startTime = Date.now()
    const repoKey = `${repo.owner}/${repo.repo}`
    const errors: string[] = []
    let filesFound = 0
    let filesDownloaded = 0

    try {
      const repoFiles: MidiFile[] = []

      // Sync each path in the repository
      for (const path of repo.paths) {
        try {
          console.log(`📁 Syncing path: ${path} in ${repoKey}`)
          const pathFiles = await this.syncRepositoryPath(repo, path)
          repoFiles.push(...pathFiles)
          filesFound += pathFiles.length
        } catch (error) {
          const errorMsg = `Failed to sync path ${path}: ${error instanceof Error ? error.message : "Unknown error"}`
          console.error(`❌ ${errorMsg}`)
          errors.push(errorMsg)
        }
      }

      // Filter and download MIDI-related files
      const midiFiles = repoFiles.filter((file) => this.isMidiRelatedFile(file.name))

      for (const file of midiFiles) {
        try {
          await this.downloadAndStoreFile(file)
          filesDownloaded++
        } catch (error) {
          const errorMsg = `Failed to download ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`
          console.error(`❌ ${errorMsg}`)
          errors.push(errorMsg)
        }
      }

      // Store files for this repository
      this.midiFiles.set(repoKey, midiFiles)

      const result: SyncResult = {
        repository: repoKey,
        filesFound,
        filesDownloaded,
        errors,
        duration: Date.now() - startTime,
        lastSync: new Date().toISOString(),
      }

      this.syncResults.set(repoKey, result)
      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      errors.push(errorMsg)

      return {
        repository: repoKey,
        filesFound: 0,
        filesDownloaded: 0,
        errors,
        duration: Date.now() - startTime,
        lastSync: new Date().toISOString(),
      }
    }
  }

  async syncRepositoryPath(repo: Repository, path: string): Promise<MidiFile[]> {
    const files: MidiFile[] = []

    try {
      const response = await githubConfig.fetchWithAuth(
        `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${path}?ref=${repo.branch || "main"}`,
      )

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`📁 Path not found: ${path} in ${repo.owner}/${repo.repo}`)
          return files
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const contents = await response.json()
      const items = Array.isArray(contents) ? contents : [contents]

      for (const item of items) {
        if (item.type === "file" && item.download_url) {
          files.push({
            name: item.name,
            path: item.path,
            repository: `${repo.owner}/${repo.repo}`,
            content: "",
            size: item.size,
            downloadUrl: item.download_url,
            sha: item.sha,
            lastModified: new Date().toISOString(),
          })
        } else if (item.type === "dir") {
          // Recursively sync subdirectories (limit depth to avoid infinite loops)
          const subFiles = await this.syncRepositoryPath(repo, item.path)
          files.push(...subFiles)
        }
      }
    } catch (error) {
      console.error(`❌ Error syncing path ${path}:`, error)
      throw error
    }

    return files
  }

  private isMidiRelatedFile(fileName: string): boolean {
    const name = fileName.toLowerCase()
    return (
      name.endsWith(".mid") ||
      name.endsWith(".midi") ||
      (name.endsWith(".py") && (name.includes("midi") || name.includes("chord") || name.includes("music"))) ||
      (name.endsWith(".json") && (name.includes("melody") || name.includes("chord") || name.includes("music"))) ||
      (name.endsWith(".txt") && (name.includes("midi") || name.includes("chord"))) ||
      name.includes("__init__.py") ||
      name.includes("chords2midi") ||
      name.includes("progression")
    )
  }

  private async downloadAndStoreFile(file: MidiFile): Promise<void> {
    try {
      const response = await fetch(file.downloadUrl)
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`)
      }

      const content = await response.text()
      file.content = content

      console.log(`✅ Downloaded: ${file.name} (${file.size} bytes)`)
    } catch (error) {
      console.error(`❌ Failed to download ${file.name}:`, error)
      throw error
    }
  }

  getRepositories(): Repository[] {
    return [...this.repositories]
  }

  getSyncResults(): Map<string, SyncResult> {
    return new Map(this.syncResults)
  }

  getMidiFiles(repository?: string): MidiFile[] {
    if (repository) {
      return this.midiFiles.get(repository) || []
    }

    // Return all files from all repositories
    const allFiles: MidiFile[] = []
    for (const files of this.midiFiles.values()) {
      allFiles.push(...files)
    }
    return allFiles
  }

  async addRepository(repo: Omit<Repository, "lastSync" | "status">): Promise<void> {
    const newRepo: Repository = {
      ...repo,
      status: "active",
    }

    this.repositories.push(newRepo)
    console.log(`➕ Added repository: ${repo.owner}/${repo.repo}`)
  }

  removeRepository(owner: string, repo: string): void {
    const index = this.repositories.findIndex((r) => r.owner === owner && r.repo === repo)
    if (index !== -1) {
      this.repositories.splice(index, 1)
      const repoKey = `${owner}/${repo}`
      this.syncResults.delete(repoKey)
      this.midiFiles.delete(repoKey)
      console.log(`➖ Removed repository: ${repoKey}`)
    }
  }

  updateRepositoryStatus(owner: string, repo: string, status: Repository["status"]): void {
    const repository = this.repositories.find((r) => r.owner === owner && r.repo === repo)
    if (repository) {
      repository.status = status
      console.log(`🔄 Updated ${owner}/${repo} status to: ${status}`)
    }
  }

  getRepositoryStats(): {
    total: number
    active: number
    inactive: number
    error: number
    totalFiles: number
    lastSyncTime?: string
  } {
    const stats = {
      total: this.repositories.length,
      active: this.repositories.filter((r) => r.status === "active").length,
      inactive: this.repositories.filter((r) => r.status === "inactive").length,
      error: this.repositories.filter((r) => r.status === "error").length,
      totalFiles: this.getMidiFiles().length,
      lastSyncTime: undefined as string | undefined,
    }

    // Find most recent sync time
    const syncTimes = Array.from(this.syncResults.values())
      .map((r) => r.lastSync)
      .filter(Boolean)
      .sort()
      .reverse()

    if (syncTimes.length > 0) {
      stats.lastSyncTime = syncTimes[0]
    }

    return stats
  }
}

export const multiRepoSyncService = new MultiRepoSyncService()
