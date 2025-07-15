import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  try {
    const melodiesDir = path.join(process.cwd(), "public", "melodies")

    // Ensure directory exists
    try {
      await fs.access(melodiesDir)
    } catch {
      await fs.mkdir(melodiesDir, { recursive: true })
    }

    const files = await fs.readdir(melodiesDir)
    const melodyFiles = files.filter((file) => file.endsWith(".json"))

    const melodies = await Promise.all(
      melodyFiles.map(async (file) => {
        const filePath = path.join(melodiesDir, file)
        const content = await fs.readFile(filePath, "utf-8")
        return JSON.parse(content)
      }),
    )

    return NextResponse.json({
      success: true,
      melodies,
      count: melodies.length,
      message: `Found ${melodies.length} melody files`,
    })
  } catch (error) {
    console.error("❌ Error loading melodies:", error)
    return NextResponse.json(
      {
        error: "Failed to load melodies",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const melody = await request.json()

    if (!melody.id || !melody.title) {
      return NextResponse.json({ error: "Melody must have id and title" }, { status: 400 })
    }

    const melodiesDir = path.join(process.cwd(), "public", "melodies")

    // Ensure directory exists
    try {
      await fs.access(melodiesDir)
    } catch {
      await fs.mkdir(melodiesDir, { recursive: true })
    }

    const filePath = path.join(melodiesDir, `${melody.id}.json`)
    await fs.writeFile(filePath, JSON.stringify(melody, null, 2))

    return NextResponse.json({
      success: true,
      melody,
      message: `Melody "${melody.title}" saved successfully`,
    })
  } catch (error) {
    console.error("❌ Error saving melody:", error)
    return NextResponse.json(
      {
        error: "Failed to save melody",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
