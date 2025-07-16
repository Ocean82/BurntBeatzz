import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action !== "process") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Process chord sets using Python script
    const result = await new Promise<any>((resolve, reject) => {
      const pythonProcess = spawn("python3", [join(process.cwd(), "backend", "chord_sets_processor.py"), "--process"])

      let output = ""
      let errorOutput = ""

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          resolve({ success: true, output })
        } else {
          reject(new Error(`Python process failed with code ${code}: ${errorOutput}`))
        }
      })

      pythonProcess.on("error", (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`))
      })
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Chord sets processing error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Processing failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const tempoMin = searchParams.get("tempoMin")
    const tempoMax = searchParams.get("tempoMax")

    // Build Python command arguments
    const args = [join(process.cwd(), "backend", "chord_sets_processor.py"), "--list"]

    if (category && category !== "all") {
      args.push("--category", category)
    }

    if (tempoMin) {
      args.push("--tempo-min", tempoMin)
    }

    if (tempoMax) {
      args.push("--tempo-max", tempoMax)
    }

    // Get chord sets using Python script
    const result = await new Promise<any>((resolve, reject) => {
      const pythonProcess = spawn("python3", args)

      let output = ""
      let errorOutput = ""

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          // Try to read the catalog file directly
          const catalogPath = join(
            process.cwd(),
            "storage",
            "midi",
            "templates",
            "chord-sets",
            "chord_sets_catalog.json",
          )
          if (existsSync(catalogPath)) {
            readFile(catalogPath, "utf-8")
              .then((data) => {
                try {
                  const catalog = JSON.parse(data)
                  let chordSets = catalog.chord_sets || []

                  // Apply filters
                  if (category && category !== "all") {
                    chordSets = chordSets.filter((cs: any) => cs.category?.includes(category))
                  }

                  if (tempoMin || tempoMax) {
                    const minTempo = tempoMin ? Number.parseInt(tempoMin) : 0
                    const maxTempo = tempoMax ? Number.parseInt(tempoMax) : 999
                    chordSets = chordSets.filter((cs: any) => {
                      const tempo = cs.analysis?.estimated_tempo || 120
                      return tempo >= minTempo && tempo <= maxTempo
                    })
                  }

                  // Transform data for frontend
                  const transformedSets = chordSets.map((cs: any) => ({
                    name: cs.analysis?.filename || "Unknown",
                    category: cs.category || "Unknown",
                    tempo: cs.analysis?.estimated_tempo || 120,
                    key: cs.analysis?.estimated_key || "C",
                    chordCount: cs.analysis?.chord_count || 0,
                    duration: cs.analysis?.length || 0,
                    analysis: cs.analysis,
                  }))

                  resolve({
                    success: true,
                    chordSets: transformedSets,
                    categories: catalog.categories || {},
                  })
                } catch (e) {
                  resolve({ success: true, chordSets: [], categories: {} })
                }
              })
              .catch(() => {
                resolve({ success: true, chordSets: [], categories: {} })
              })
          } else {
            resolve({ success: true, chordSets: [], categories: {} })
          }
        } else {
          reject(new Error(`Python process failed with code ${code}: ${errorOutput}`))
        }
      })

      pythonProcess.on("error", (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`))
      })
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Chord sets loading error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Loading failed" }, { status: 500 })
  }
}
