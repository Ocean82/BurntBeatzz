import { type NextRequest, NextResponse } from "next/server"
import { readdir, stat } from "fs/promises"
import path from "path"

interface ScaleSample {
  key: string
  scaleType: string
  filePath: string
  fileName: string
  size: number
  lastModified: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scaleType = searchParams.get("scaleType")
    const key = searchParams.get("key")

    const samplesDir = path.join(process.cwd(), "public", "audio", "samples", "MPC_SCALES_FULL_v1.0", "-1")

    // Get all available scale samples
    const samples: ScaleSample[] = []

    const scaleTypes = [
      { dir: "Major/Major_Pentatonic", type: "major_pentatonic" },
      { dir: "Minor/Minor_Pentatonic", type: "minor_pentatonic" },
      { dir: "Major/Major_Scale", type: "major" },
      { dir: "Minor/Minor_Scale", type: "minor" },
      { dir: "Blues/Blues_Scale", type: "blues" },
      { dir: "Chromatic/Chromatic_Scale", type: "chromatic" },
    ]

    for (const scale of scaleTypes) {
      // Skip if filtering by scale type
      if (scaleType && scale.type !== scaleType) continue

      const scaleDir = path.join(samplesDir, scale.dir)

      try {
        const keys = await readdir(scaleDir)

        for (const keyDir of keys) {
          // Skip if filtering by key
          if (key && keyDir !== key && keyDir !== key.replace("#", "_Sharp").replace("b", "_Flat")) continue

          const keyPath = path.join(scaleDir, keyDir)
          const keyStats = await stat(keyPath)

          if (keyStats.isDirectory()) {
            const sampleFile = path.join(keyPath, "_.WAV")

            try {
              const sampleStats = await stat(sampleFile)
              const publicPath = `/audio/samples/MPC_SCALES_FULL_v1.0/-1/${scale.dir}/${keyDir}/_.WAV`

              samples.push({
                key: keyDir.replace("_Sharp", "#").replace("_Flat", "b"),
                scaleType: scale.type,
                filePath: publicPath,
                fileName: "_.WAV",
                size: sampleStats.size,
                lastModified: sampleStats.mtime.toISOString(),
              })
            } catch (error) {
              // Sample file doesn't exist, skip
              console.warn(`Sample not found: ${sampleFile}`)
            }
          }
        }
      } catch (error) {
        // Scale directory doesn't exist, skip
        console.warn(`Scale directory not found: ${scaleDir}`)
      }
    }

    // Sort samples by key and scale type
    samples.sort((a, b) => {
      if (a.scaleType !== b.scaleType) {
        return a.scaleType.localeCompare(b.scaleType)
      }
      return a.key.localeCompare(b.key)
    })

    return NextResponse.json({
      success: true,
      samples,
      total: samples.length,
      filters: {
        scaleType,
        key,
      },
    })
  } catch (error) {
    console.error("Failed to get scale samples:", error)
    return NextResponse.json(
      {
        error: "Failed to retrieve scale samples",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key, scaleType } = await request.json()

    if (!key || !scaleType) {
      return NextResponse.json({ error: "Key and scale type are required" }, { status: 400 })
    }

    // Get specific scale sample
    const scaleTypeMap: Record<string, string> = {
      major_pentatonic: "Major/Major_Pentatonic",
      minor_pentatonic: "Minor/Minor_Pentatonic",
      major: "Major/Major_Scale",
      minor: "Minor/Minor_Scale",
      blues: "Blues/Blues_Scale",
      chromatic: "Chromatic/Chromatic_Scale",
    }

    const scalePath = scaleTypeMap[scaleType]
    if (!scalePath) {
      return NextResponse.json({ error: "Invalid scale type" }, { status: 400 })
    }

    const keyFormatted = key.replace("#", "_Sharp").replace("b", "_Flat")
    const samplePath = path.join(
      process.cwd(),
      "public",
      "audio",
      "samples",
      "MPC_SCALES_FULL_v1.0",
      "-1",
      scalePath,
      keyFormatted,
      "_.WAV",
    )

    try {
      const stats = await stat(samplePath)
      const publicPath = `/audio/samples/MPC_SCALES_FULL_v1.0/-1/${scalePath}/${keyFormatted}/_.WAV`

      return NextResponse.json({
        success: true,
        sample: {
          key,
          scaleType,
          filePath: publicPath,
          fileName: "_.WAV",
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
        },
      })
    } catch (error) {
      return NextResponse.json({ error: "Scale sample not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Failed to get scale sample:", error)
    return NextResponse.json(
      {
        error: "Failed to retrieve scale sample",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
