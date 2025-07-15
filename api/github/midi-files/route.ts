import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { downloadUrl, fileName, testMode = false } = body

    if (!downloadUrl || !fileName) {
      return NextResponse.json(
        {
          error: "Missing required parameters: downloadUrl and fileName",
        },
        { status: 400 },
      )
    }

    // In test mode, just return success without actually downloading
    if (testMode) {
      return NextResponse.json({
        success: true,
        message: `Test mode: Would download ${fileName}`,
        fileName,
        testMode: true,
      })
    }

    // Fetch the file from GitHub
    const response = await fetch(downloadUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch file: HTTP ${response.status}`)
    }

    // Get the file content as array buffer
    const arrayBuffer = await response.arrayBuffer()

    // Convert to base64 for transmission
    const base64Data = Buffer.from(arrayBuffer).toString("base64")

    return NextResponse.json({
      success: true,
      data: base64Data,
      fileName,
      size: arrayBuffer.byteLength,
      contentType: response.headers.get("content-type") || "audio/midi",
    })
  } catch (error) {
    console.error("MIDI file download error:", error)

    return NextResponse.json(
      {
        error: "Failed to download MIDI file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const repository = searchParams.get("repository")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    // This would typically fetch from a database
    // For testing, return mock data
    const mockFiles = [
      {
        name: "C_Major_Chord.mid",
        path: "chords/C_Major_Chord.mid",
        downloadUrl: "https://raw.githubusercontent.com/ldrolez/free-midi-chords/main/chords/C_Major_Chord.mid",
        size: 1024,
        category: "Chords",
        sha: "abc123",
      },
      {
        name: "Am_Progression.mid",
        path: "progressions/Am_Progression.mid",
        downloadUrl: "https://raw.githubusercontent.com/ldrolez/free-midi-chords/main/progressions/Am_Progression.mid",
        size: 2048,
        category: "Progressions",
        sha: "def456",
      },
    ]

    let filteredFiles = mockFiles

    // Apply filters
    if (category && category !== "all") {
      filteredFiles = filteredFiles.filter((file) => file.category === category)
    }

    if (search) {
      filteredFiles = filteredFiles.filter(
        (file) =>
          file.name.toLowerCase().includes(search.toLowerCase()) ||
          file.path.toLowerCase().includes(search.toLowerCase()),
      )
    }

    return NextResponse.json({
      success: true,
      files: filteredFiles,
      total: filteredFiles.length,
      filters: { repository, category, search },
    })
  } catch (error) {
    console.error("MIDI files GET error:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch MIDI files",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
