import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { readFile } from "fs/promises"
import path from "path"

interface MidiEvent {
  deltaTime: number
  type: string
  channel?: number
  note?: number
  velocity?: number
  data?: number[]
}

interface MidiAnalysis {
  duration: number
  tempo: number
  timeSignature: string
  keySignature: string
  tracks: number
  instruments: string[]
  noteRange: { min: number; max: number }
  complexity: "simple" | "moderate" | "complex"
  genre: string
  events: MidiEvent[]
}

function analyzeMidiBuffer(buffer: Buffer): MidiAnalysis {
  try {
    let pos = 0

    // Read header
    const headerChunk = buffer.slice(pos, pos + 14)
    const format = headerChunk.readUInt16BE(8)
    const tracks = headerChunk.readUInt16BE(10)
    const division = headerChunk.readUInt16BE(12)

    pos += 14

    let tempo = 120 // Default BPM
    let timeSignature = "4/4"
    let keySignature = "C major"
    let totalTicks = 0
    let minNote = 127
    let maxNote = 0
    let noteCount = 0
    const instruments: Set<string> = new Set()
    const events: MidiEvent[] = []

    // Parse tracks
    for (let trackNum = 0; trackNum < tracks && pos < buffer.length - 8; trackNum++) {
      const trackHeader = buffer.slice(pos, pos + 8)
      if (trackHeader.slice(0, 4).toString("ascii") !== "MTrk") {
        break
      }

      const trackLength = trackHeader.readUInt32BE(4)
      pos += 8
      const trackEnd = pos + trackLength

      let deltaTime = 0

      while (pos < trackEnd && pos < buffer.length) {
        // Read variable length delta time
        deltaTime = 0
        let byte: number
        do {
          if (pos >= buffer.length) break
          byte = buffer[pos++]
          deltaTime = (deltaTime << 7) | (byte & 0x7f)
        } while (byte & 0x80)

        totalTicks += deltaTime

        if (pos >= buffer.length) break

        const eventByte = buffer[pos++]

        if (eventByte === 0xff) {
          // Meta event
          if (pos >= buffer.length) break
          const metaType = buffer[pos++]
          if (pos >= buffer.length) break
          const length = buffer[pos++]

          if (pos + length > buffer.length) break

          const data = buffer.slice(pos, pos + length)
          pos += length

          switch (metaType) {
            case 0x51: // Set Tempo
              if (data.length >= 3) {
                const microsecondsPerQuarter = (data[0] << 16) | (data[1] << 8) | data[2]
                tempo = Math.round(60000000 / microsecondsPerQuarter)
              }
              break
            case 0x58: // Time Signature
              if (data.length >= 2) {
                timeSignature = `${data[0]}/${Math.pow(2, data[1])}`
              }
              break
            case 0x59: // Key Signature
              if (data.length >= 2) {
                const sharpsFlats = data[0]
                const major = data[1] === 0
                keySignature = getKeySignature(sharpsFlats, major)
              }
              break
          }

          events.push({
            deltaTime,
            type: "meta",
            data: Array.from(data),
          })
        } else if ((eventByte & 0xf0) === 0x90) {
          // Note On
          if (pos + 1 >= buffer.length) break
          const note = buffer[pos++]
          const velocity = buffer[pos++]

          if (velocity > 0) {
            noteCount++
            minNote = Math.min(minNote, note)
            maxNote = Math.max(maxNote, note)
          }

          events.push({
            deltaTime,
            type: "noteOn",
            channel: eventByte & 0x0f,
            note,
            velocity,
          })
        } else if ((eventByte & 0xf0) === 0x80) {
          // Note Off
          if (pos + 1 >= buffer.length) break
          const note = buffer[pos++]
          const velocity = buffer[pos++]

          events.push({
            deltaTime,
            type: "noteOff",
            channel: eventByte & 0x0f,
            note,
            velocity,
          })
        } else if ((eventByte & 0xf0) === 0xc0) {
          // Program Change
          if (pos >= buffer.length) break
          const program = buffer[pos++]
          instruments.add(getInstrumentName(program))

          events.push({
            deltaTime,
            type: "programChange",
            channel: eventByte & 0x0f,
            data: [program],
          })
        } else {
          // Skip other events
          if ((eventByte & 0x80) === 0) {
            // Running status, back up one byte
            pos--
          }
          // Skip to next event (simplified)
          pos += 2
        }
      }
    }

    // Calculate duration
    const ticksPerQuarter = division & 0x7fff
    const duration = (totalTicks * 60) / (tempo * ticksPerQuarter)

    // Determine complexity
    let complexity: "simple" | "moderate" | "complex" = "simple"
    if (noteCount > 1000 || tracks > 8) {
      complexity = "complex"
    } else if (noteCount > 200 || tracks > 4) {
      complexity = "moderate"
    }

    // Guess genre based on characteristics
    let genre = "unknown"
    if (tempo > 140) {
      genre = "electronic"
    } else if (tempo < 80) {
      genre = "ballad"
    } else if (instruments.has("Distortion Guitar")) {
      genre = "rock"
    } else if (instruments.has("Acoustic Grand Piano")) {
      genre = "classical"
    }

    return {
      duration: Math.max(30, duration),
      tempo,
      timeSignature,
      keySignature,
      tracks,
      instruments: Array.from(instruments),
      noteRange: { min: minNote, max: maxNote },
      complexity,
      genre,
      events: events.slice(0, 100), // Limit events for response size
    }
  } catch (error) {
    console.error("MIDI analysis error:", error)
    return {
      duration: 60,
      tempo: 120,
      timeSignature: "4/4",
      keySignature: "C major",
      tracks: 1,
      instruments: ["Acoustic Grand Piano"],
      noteRange: { min: 60, max: 72 },
      complexity: "simple",
      genre: "unknown",
      events: [],
    }
  }
}

function getKeySignature(sharpsFlats: number, major: boolean): string {
  const majorKeys = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"]
  const minorKeys = ["A", "E", "B", "F#", "C#", "G#", "D#", "A#", "D", "G", "C", "F", "Bb", "Eb", "Ab"]

  const index = sharpsFlats + 7 // Offset for negative values
  const keys = major ? majorKeys : minorKeys
  const key = keys[Math.max(0, Math.min(keys.length - 1, index))] || "C"

  return `${key} ${major ? "major" : "minor"}`
}

function getInstrumentName(program: number): string {
  const instruments = [
    "Acoustic Grand Piano",
    "Bright Acoustic Piano",
    "Electric Grand Piano",
    "Honky-tonk Piano",
    "Electric Piano 1",
    "Electric Piano 2",
    "Harpsichord",
    "Clavi",
    "Celesta",
    "Glockenspiel",
    "Music Box",
    "Vibraphone",
    "Marimba",
    "Xylophone",
    "Tubular Bells",
    "Dulcimer",
    "Drawbar Organ",
    "Percussive Organ",
    "Rock Organ",
    "Church Organ",
    "Reed Organ",
    "Accordion",
    "Harmonica",
    "Tango Accordion",
    "Acoustic Guitar (nylon)",
    "Acoustic Guitar (steel)",
    "Electric Guitar (jazz)",
    "Electric Guitar (clean)",
    "Electric Guitar (muted)",
    "Overdriven Guitar",
    "Distortion Guitar",
    "Guitar harmonics",
    "Acoustic Bass",
    "Electric Bass (finger)",
    "Electric Bass (pick)",
    "Fretless Bass",
    "Slap Bass 1",
    "Slap Bass 2",
    "Synth Bass 1",
    "Synth Bass 2",
    "Violin",
    "Viola",
    "Cello",
    "Contrabass",
    "Tremolo Strings",
    "Pizzicato Strings",
    "Orchestral Harp",
    "Timpani",
    "String Ensemble 1",
    "String Ensemble 2",
    "SynthStrings 1",
    "SynthStrings 2",
    "Choir Aahs",
    "Voice Oohs",
    "Synth Voice",
    "Orchestra Hit",
    "Trumpet",
    "Trombone",
    "Tuba",
    "Muted Trumpet",
    "French Horn",
    "Brass Section",
    "SynthBrass 1",
    "SynthBrass 2",
    "Soprano Sax",
    "Alto Sax",
    "Tenor Sax",
    "Baritone Sax",
    "Oboe",
    "English Horn",
    "Bassoon",
    "Clarinet",
    "Piccolo",
    "Flute",
    "Recorder",
    "Pan Flute",
    "Blown Bottle",
    "Shakuhachi",
    "Whistle",
    "Ocarina",
    "Lead 1 (square)",
    "Lead 2 (sawtooth)",
    "Lead 3 (calliope)",
    "Lead 4 (chiff)",
    "Lead 5 (charang)",
    "Lead 6 (voice)",
    "Lead 7 (fifths)",
    "Lead 8 (bass + lead)",
    "Pad 1 (new age)",
    "Pad 2 (warm)",
    "Pad 3 (polysynth)",
    "Pad 4 (choir)",
    "Pad 5 (bowed)",
    "Pad 6 (metallic)",
    "Pad 7 (halo)",
    "Pad 8 (sweep)",
    "FX 1 (rain)",
    "FX 2 (soundtrack)",
    "FX 3 (crystal)",
    "FX 4 (atmosphere)",
    "FX 5 (brightness)",
    "FX 6 (goblins)",
    "FX 7 (echoes)",
    "FX 8 (sci-fi)",
    "Sitar",
    "Banjo",
    "Shamisen",
    "Koto",
    "Kalimba",
    "Bag pipe",
    "Fiddle",
    "Shanai",
    "Tinkle Bell",
    "Agogo",
    "Steel Drums",
    "Woodblock",
    "Taiko Drum",
    "Melodic Tom",
    "Synth Drum",
    "Reverse Cymbal",
    "Guitar Fret Noise",
    "Breath Noise",
    "Seashore",
    "Bird Tweet",
    "Telephone Ring",
    "Helicopter",
    "Applause",
    "Gunshot",
  ]

  return instruments[Math.max(0, Math.min(instruments.length - 1, program))] || "Unknown Instrument"
}

export async function POST(request: NextRequest) {
  try {
    const { midiId } = await request.json()

    if (!midiId) {
      return NextResponse.json({ error: "MIDI ID is required" }, { status: 400 })
    }

    const midiPath = path.join(process.cwd(), "public", "midi", "uploads", `${midiId}.mid`)

    // Check if file exists
    try {
      await readFile(midiPath)
    } catch (error) {
      return NextResponse.json({ error: "MIDI file not found" }, { status: 404 })
    }

    console.log("🎵 Analyzing MIDI file:", midiPath)

    // Run Python analysis script
    const analysis = await analyzeMidiFile(midiPath)

    return NextResponse.json({
      success: true,
      analysis,
      analyzedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ MIDI analysis failed:", error)
    return NextResponse.json(
      {
        error: "Analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function analyzeMidiFile(midiPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), "backend", "midi_analyzer.py")

    const pythonProcess = spawn("python3", [pythonScript, midiPath])

    let stdout = ""
    let stderr = ""

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString()
    })

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const analysis = JSON.parse(stdout)
          resolve(analysis)
        } catch (parseError) {
          reject(new Error(`Failed to parse analysis result: ${parseError}`))
        }
      } else {
        reject(new Error(`Python analysis failed: ${stderr}`))
      }
    })

    pythonProcess.on("error", (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`))
    })
  })
}
