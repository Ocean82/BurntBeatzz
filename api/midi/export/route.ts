import { type NextRequest, NextResponse } from "next/server"
import { multiRepoSyncService } from "@/lib/services/multi-repo-sync-service"
import { midiExportService } from "@/lib/services/midi-export-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "stats") {
      const stats = multiRepoSyncService.getRepositoryStats()
      const allFiles = multiRepoSyncService.getMidiFiles()

      return NextResponse.json({
        success: true,
        stats: {
          totalFiles: allFiles.length,
          totalSize: allFiles.reduce((sum, file) => sum + file.size, 0),
          repositories: stats.total,
          lastExport: undefined, // Would be stored in database
          exportHistory: [], // Would be loaded from database
        },
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("MIDI export GET error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      format,
      includeContent,
      includeMetadata,
      filterByRepository,
      filterByFileType,
      customFilter,
      maxFiles,
      compression,
      preview,
    } = body

    // Get all MIDI files
    let files = multiRepoSyncService.getMidiFiles(filterByRepository)

    // Apply file type filter
    if (filterByFileType) {
      files = files.filter((file) => file.name.toLowerCase().endsWith(filterByFileType.toLowerCase()))
    }

    // Apply custom filter for individual exports
    if (customFilter) {
      const selectedFiles = customFilter.split(",")
      files = files.filter((file) => selectedFiles.includes(file.name))
    }

    // Apply max files limit
    if (maxFiles && files.length > maxFiles) {
      files = files.slice(0, maxFiles)
    }

    // If preview mode, just return the files
    if (preview) {
      return NextResponse.json({
        success: true,
        files: files.map((file) => ({
          ...file,
          content: includeContent ? file.content : "",
        })),
      })
    }

    // Generate export based on format
    const result = await midiExportService.exportFiles(files, {
      format,
      includeContent,
      includeMetadata,
      compression,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("MIDI export POST error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
      },
      { status: 500 },
    )
  }
}
