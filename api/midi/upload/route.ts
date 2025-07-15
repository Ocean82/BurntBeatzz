import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

interface MidiHeader {
  format: number
  tracks: number
  division: number
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".mid") && !file.name.toLowerCase().endsWith(".midi")) {
      return NextResponse.json({ error: "Invalid file type. Only .mid and .midi files are allowed" }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB" }, { status: 400 })
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), "public", "midi", "uploads")
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const fileId = uuidv4()
    const fileName = `${fileId}.mid`
    const filePath = path.join(uploadDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Parse MIDI header
    const midiInfo = await parseMidiHeader(buffer)

    // Create file record
    const fileRecord = {
      id: fileId,
      originalName: file.name,
      fileName: fileName,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      midiInfo,
    }

    return NextResponse.json({
      success: true,
      file: fileRecord,
      message: "MIDI file uploaded successfully",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), "public", "midi", "uploads")

    // Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true })

    // For now, return empty array - in production you'd read from database
    return NextResponse.json({
      success: true,
      files: [],
    })
  } catch (error) {
    console.error("Failed to get files:", error)
    return NextResponse.json(
      {
        error: "Failed to retrieve files",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function parseMidiHeader(buffer: Buffer): Promise<MidiHeader> {
  try {
    // Check MIDI header signature
    const headerSignature = buffer.toString("ascii", 0, 4)
    if (headerSignature !== "MThd") {
      throw new Error("Invalid MIDI file: Missing MThd header")
    }

    // Read header length (should be 6)
    const headerLength = buffer.readUInt32BE(4)
    if (headerLength !== 6) {
      throw new Error("Invalid MIDI file: Invalid header length")
    }

    // Read MIDI format (0, 1, or 2)
    const format = buffer.readUInt16BE(8)

    // Read number of tracks
    const tracks = buffer.readUInt16BE(10)

    // Read time division
    const division = buffer.readUInt16BE(12)

    // Estimate duration (very rough calculation)
    let estimatedDuration = 60 // Default 60 seconds

    // Try to find tempo events for better duration estimate
    try {
      let pos = 14 // Start after header
      let trackCount = 0

      while (pos < buffer.length && trackCount < tracks) {
        // Look for track header
        if (buffer.toString("ascii", pos, pos + 4) === "MTrk") {
          const trackLength = buffer.readUInt32BE(pos + 4)
          pos += 8 + trackLength
          trackCount++
        } else {
          pos++
        }
      }

      // Rough estimate based on file size and tracks
      estimatedDuration = Math.max(30, Math.min(300, (buffer.length / 1024) * tracks * 2))
    } catch (e) {
      // Use default if parsing fails
    }

    return {
      format,
      tracks,
      division,
      estimatedDuration: Math.round(estimatedDuration),
    }
  } catch (error) {
    console.error("MIDI parsing error:", error)
    return {
      format: 1,
      tracks: 1,
      division: 480,
      estimatedDuration: 60,
    }
  }
}
