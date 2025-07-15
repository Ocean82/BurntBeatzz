import { type NextRequest, NextResponse } from "next/server"

interface Repository {
  owner: string
  repo: string
  branch: string
  paths: string[]
}

interface MidiFile {
  name: string
  path: string
  downloadUrl: string
  size: number
  sizeFormatted: string
  category: string
  sha: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const repository = searchParams.get("repository")

    if (!repository) {
      return NextResponse.json({ error: "Repository parameter is required" }, { status: 400 })
    }

    // For now, return empty results - in production this would query a database
    return NextResponse.json({
      success: true,
      files: [],
      stats: {
        totalFiles: 0,
        downloadedFiles: 0,
        categories: {},
        totalSize: 0,
        lastSync: new Date().toISOString(),
        syncDuration: 0,
      },
      message: "No cached files found. Run a sync to populate the repository.",
    })
  } catch (error) {
    console.error("Error in sync-repositories GET:", error)
    return NextResponse.json({ error: "Failed to load repository data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { syncAll = false, repositories = [] } = body

    if (!Array.isArray(repositories) || repositories.length === 0) {
      return NextResponse.json({ error: "No repositories specified for sync" }, { status: 400 })
    }

    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken) {
      return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 })
    }

    const allFiles: MidiFile[] = []
    const errors: string[] = []
    const startTime = Date.now()

    for (const repo of repositories) {
      try {
        console.log(`Syncing repository: ${repo.owner}/${repo.repo}`)

        // Scan all specified paths in the repository
        for (const path of repo.paths) {
          try {
            const files = await scanRepositoryPath(repo, path, githubToken)
            allFiles.push(...files)
          } catch (pathError) {
            console.error(`Error scanning path ${path} in ${repo.owner}/${repo.repo}:`, pathError)
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

    // Generate statistics
    const categories: Record<string, number> = {}
    let totalSize = 0

    uniqueFiles.forEach((file) => {
      categories[file.category] = (categories[file.category] || 0) + 1
      totalSize += file.size
    })

    const syncDuration = Date.now() - startTime

    const stats = {
      totalFiles: uniqueFiles.length,
      downloadedFiles: uniqueFiles.length,
      categories,
      totalSize,
      lastSync: new Date().toISOString(),
      syncDuration,
    }

    console.log(`Sync completed: ${uniqueFiles.length} files found in ${syncDuration}ms`)

    return NextResponse.json({
      success: true,
      files: uniqueFiles,
      stats,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully synced ${uniqueFiles.length} MIDI files from ${repositories.length} repositories`,
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      {
        error: "Failed to sync repositories",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function scanRepositoryPath(repo: Repository, path: string, githubToken: string): Promise<MidiFile[]> {
  const files: MidiFile[] = []

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${path}?ref=${repo.branch}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "User-Agent": "Burnt-Beats-MIDI-Sync",
        },
      },
    )

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Path ${path} not found in ${repo.owner}/${repo.repo}`)
        return files
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const contents = await response.json()
    const items = Array.isArray(contents) ? contents : [contents]

    for (const item of items) {
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
          const subFiles = await scanRepositoryPath(repo, item.path, githubToken)
          files.push(...subFiles)
        } catch (subDirError) {
          console.error(`Error scanning subdirectory ${item.path}:`, subDirError)
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning path ${path}:`, error)
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
