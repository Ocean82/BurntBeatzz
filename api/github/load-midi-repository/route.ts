import { type NextRequest, NextResponse } from "next/server"

// Pre-configured repositories with MIDI files
const MIDI_REPOSITORIES = [
  {
    owner: "your-username",
    repo: "burnt-beats-midi-collection",
    description: "Main MIDI collection for Burnt Beats",
    paths: ["beats", "melodies", "samples"],
  },
  {
    owner: "midi-samples",
    repo: "free-midi-collection",
    description: "Free MIDI samples collection",
    paths: ["pop", "rock", "electronic", "classical"],
  },
  {
    owner: "music-production",
    repo: "midi-loops",
    description: "Professional MIDI loops and patterns",
    paths: ["drums", "bass", "leads", "pads"],
  },
]

interface GitHubFile {
  name: string
  path: string
  download_url: string | null
  type: string
  size: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const repoIndex = Number.parseInt(searchParams.get("repo") || "0")
    const path = searchParams.get("path") || ""

    if (repoIndex >= MIDI_REPOSITORIES.length) {
      return NextResponse.json({ error: "Invalid repository index" }, { status: 400 })
    }

    const repository = MIDI_REPOSITORIES[repoIndex]
    const { owner, repo } = repository

    console.log(`🎵 Loading MIDI files from ${owner}/${repo}${path ? `/${path}` : ""}`)

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Burnt-Beats-MIDI-Loader",
    }

    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    const response = await fetch(apiUrl, { headers })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          {
            error: "Repository not found or path doesn't exist",
            suggestion: "Try a different repository or check if the path exists",
          },
          { status: 404 },
        )
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const files: GitHubFile[] = await response.json()

    // Separate directories and MIDI files
    const directories = files
      .filter((file) => file.type === "dir")
      .map((dir) => ({
        name: dir.name,
        path: dir.path,
        type: "directory" as const,
      }))

    const midiFiles = files
      .filter((file) => {
        const isMidiFile = file.name.toLowerCase().endsWith(".mid") || file.name.toLowerCase().endsWith(".midi")
        return file.type === "file" && isMidiFile && file.download_url
      })
      .map((file) => ({
        name: file.name,
        path: file.path,
        downloadUrl: file.download_url!,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
      }))

    console.log(`✅ Found ${midiFiles.length} MIDI files and ${directories.length} directories`)

    return NextResponse.json({
      success: true,
      repository: {
        owner,
        repo,
        description: repository.description,
        currentPath: path,
      },
      directories,
      midiFiles,
      stats: {
        totalDirectories: directories.length,
        totalMidiFiles: midiFiles.length,
        totalSize: midiFiles.reduce((sum, file) => sum + file.size, 0),
      },
    })
  } catch (error) {
    console.error("❌ GitHub repository load error:", error)
    return NextResponse.json(
      {
        error: "Failed to load MIDI repository",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { repositoryIndex, downloadAll = false } = await request.json()

    if (typeof repositoryIndex !== "number" || repositoryIndex >= MIDI_REPOSITORIES.length) {
      return NextResponse.json({ error: "Invalid repository index" }, { status: 400 })
    }

    const repository = MIDI_REPOSITORIES[repositoryIndex]
    const { owner, repo } = repository

    console.log(`🔄 Batch downloading from ${owner}/${repo}`)

    // Get all MIDI files from all paths
    const allMidiFiles: Array<{
      name: string
      path: string
      downloadUrl: string
      size: number
    }> = []

    for (const path of repository.paths) {
      try {
        const response = await fetch(`/api/github/midi-files?owner=${owner}&repo=${repo}&path=${path}`)
        if (response.ok) {
          const data = await response.json()
          allMidiFiles.push(...data.midiFiles)
        }
      } catch (error) {
        console.warn(`Failed to load path ${path}:`, error)
      }
    }

    if (allMidiFiles.length === 0) {
      return NextResponse.json(
        {
          error: "No MIDI files found in repository",
          repository: `${owner}/${repo}`,
        },
        { status: 404 },
      )
    }

    // If downloadAll is true, prepare batch download
    if (downloadAll) {
      const downloadJobs = allMidiFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        downloadUrl: file.downloadUrl,
        size: file.size,
        status: "pending" as const,
      }))

      return NextResponse.json({
        success: true,
        message: `Prepared ${downloadJobs.length} files for batch download`,
        repository: `${owner}/${repo}`,
        downloadJobs,
        totalSize: allMidiFiles.reduce((sum, file) => sum + file.size, 0),
      })
    }

    return NextResponse.json({
      success: true,
      repository: `${owner}/${repo}`,
      availableFiles: allMidiFiles.length,
      totalSize: allMidiFiles.reduce((sum, file) => sum + file.size, 0),
      files: allMidiFiles.slice(0, 10), // Return first 10 as preview
    })
  } catch (error) {
    console.error("❌ Batch download preparation error:", error)
    return NextResponse.json(
      {
        error: "Failed to prepare batch download",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}
