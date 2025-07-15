import { type NextRequest, NextResponse } from "next/server"
import { Octokit } from "@octokit/rest"

interface MidiFile {
  name: string
  path: string
  downloadUrl: string
  size: number
  sizeFormatted: string
  category: string
  sha: string
}

interface SyncStats {
  totalFiles: number
  downloadedFiles: number
  categories: Record<string, number>
  totalSize: number
  lastSync: string
  syncDuration: number
}

const REPO_CONFIG = {
  owner: "ldrolez",
  repo: "free-midi-chords",
  branch: "main",
  paths: ["", "chords", "progressions", "src/chords2midi", "midi", "data"],
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const repository = searchParams.get("repository")

    if (!repository || repository !== `${REPO_CONFIG.owner}/${REPO_CONFIG.repo}`) {
      return NextResponse.json({ error: "Invalid repository" }, { status: 400 })
    }

    // Check if we have a GitHub token
    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken) {
      return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 })
    }

    const octokit = new Octokit({
      auth: githubToken,
    })

    // Get existing files from cache or storage
    // For now, return empty array - in production this would check a database
    const existingFiles: MidiFile[] = []

    const stats: SyncStats = {
      totalFiles: existingFiles.length,
      downloadedFiles: existingFiles.length,
      categories: {},
      totalSize: 0,
      lastSync: new Date().toISOString(),
      syncDuration: 0,
    }

    // Calculate stats
    existingFiles.forEach((file) => {
      const category = getCategoryFromPath(file.path)
      stats.categories[category] = (stats.categories[category] || 0) + 1
      stats.totalSize += file.size
    })

    return NextResponse.json({
      success: true,
      files: existingFiles,
      stats,
      message: `Loaded ${existingFiles.length} existing MIDI files`,
    })
  } catch (error) {
    console.error("Error loading existing files:", error)
    return NextResponse.json({ error: "Failed to load existing files" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { syncAll = false, repositories = [REPO_CONFIG] } = body

    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken) {
      return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 })
    }

    const octokit = new Octokit({
      auth: githubToken,
    })

    const allFiles: MidiFile[] = []
    const errors: string[] = []

    for (const repo of repositories) {
      try {
        console.log(`Syncing repository: ${repo.owner}/${repo.repo}`)

        // Scan all specified paths
        for (const path of repo.paths) {
          try {
            const files = await scanDirectoryRecursively(octokit, repo.owner, repo.repo, path, repo.branch)
            allFiles.push(...files)
          } catch (pathError) {
            console.error(`Error scanning path ${path}:`, pathError)
            errors.push(`Failed to scan path: ${path}`)
          }
        }
      } catch (repoError) {
        console.error(`Error syncing repository ${repo.owner}/${repo.repo}:`, repoError)
        errors.push(`Failed to sync repository: ${repo.owner}/${repo.repo}`)
      }
    }

    // Remove duplicates based on path
    const uniqueFiles = allFiles.filter((file, index, self) => index === self.findIndex((f) => f.path === file.path))

    // Generate stats
    const stats: SyncStats = {
      totalFiles: uniqueFiles.length,
      downloadedFiles: uniqueFiles.length,
      categories: {},
      totalSize: 0,
      lastSync: new Date().toISOString(),
      syncDuration: Date.now() - startTime,
    }

    uniqueFiles.forEach((file) => {
      const category = getCategoryFromPath(file.path)
      stats.categories[category] = (stats.categories[category] || 0) + 1
      stats.totalSize += file.size
    })

    // In production, you would save these files to a database here
    console.log(`Sync completed: ${uniqueFiles.length} files found`)

    return NextResponse.json({
      success: true,
      files: uniqueFiles,
      stats,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully synced ${uniqueFiles.length} MIDI files from ${repositories.length} repositories`,
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json({ error: "Failed to sync repositories" }, { status: 500 })
  }
}

async function scanDirectoryRecursively(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<MidiFile[]> {
  const files: MidiFile[] = []

  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    })

    const contents = Array.isArray(response.data) ? response.data : [response.data]

    for (const item of contents) {
      if (item.type === "file" && isMidiFile(item.name)) {
        files.push({
          name: item.name,
          path: item.path,
          downloadUrl: item.download_url || "",
          size: item.size || 0,
          sizeFormatted: formatFileSize(item.size || 0),
          category: getCategoryFromPath(item.path),
          sha: item.sha,
        })
      } else if (item.type === "dir") {
        // Recursively scan subdirectories
        try {
          const subFiles = await scanDirectoryRecursively(octokit, owner, repo, item.path, branch)
          files.push(...subFiles)
        } catch (subDirError) {
          console.error(`Error scanning subdirectory ${item.path}:`, subDirError)
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${path}:`, error)
    throw error
  }

  return files
}

function isMidiFile(filename: string): boolean {
  const midiExtensions = [".mid", ".midi", ".MID", ".MIDI"]
  return midiExtensions.some((ext) => filename.endsWith(ext))
}

function getCategoryFromPath(path: string): string {
  const pathLower = path.toLowerCase()
  if (pathLower.includes("chord")) return "Chords"
  if (pathLower.includes("progression")) return "Progressions"
  if (pathLower.includes("scale")) return "Scales"
  if (pathLower.includes("arpeggio")) return "Arpeggios"
  if (pathLower.includes("melody")) return "Melodies"
  if (pathLower.includes("bass")) return "Bass"
  if (pathLower.includes("drum")) return "Drums"
  if (pathLower.includes("src")) return "Source"
  return "Other"
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}
