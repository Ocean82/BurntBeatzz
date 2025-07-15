import { type NextRequest, NextResponse } from "next/server"
import { GoogleCloudStorage } from "@/lib/services/google-cloud-storage"
import { calculatePricing } from "@/lib/services/pricing-service"

const storage = new GoogleCloudStorage()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const artist = formData.get("artist") as string
    const genre = formData.get("genre") as string
    const description = formData.get("description") as string
    const includeLicense = formData.get("includeLicense") === "true"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/ogg", "audio/mp4"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload MP3, WAV, FLAC, OGG, or M4A files." },
        { status: 400 },
      )
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 100MB." }, { status: 400 })
    }

    // Calculate pricing
    const pricing = calculatePricing(file.size)

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, "_")
    const filename = `songs/${timestamp}_${sanitizedTitle}.${file.name.split(".").pop()}`

    // Upload to Google Cloud Storage
    const uploadResult = await storage.uploadFile(buffer, filename, {
      contentType: file.type,
      metadata: {
        title,
        artist,
        genre,
        description,
        originalName: file.name,
        fileSize: file.size.toString(),
        pricingTier: pricing.tier,
        price: pricing.price.toString(),
        includeLicense: includeLicense.toString(),
        uploadedAt: new Date().toISOString(),
      },
    })

    // TODO: Save to database
    // const song = await db.songs.create({
    //   title,
    //   artist,
    //   genre,
    //   description,
    //   filePath: uploadResult.publicUrl,
    //   fileSize: file.size,
    //   pricingTier: pricing.tier,
    //   price: pricing.price,
    //   hasFullLicense: includeLicense,
    //   status: 'uploaded'
    // })

    return NextResponse.json({
      success: true,
      song: {
        id: timestamp.toString(),
        title,
        artist,
        genre,
        description,
        filePath: uploadResult.publicUrl,
        fileSize: file.size,
        pricing,
        includeLicense,
        status: "uploaded",
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
