export interface SongStructure {
  intro: { duration: number; chords: string[]; melody: number[] }
  verse: { duration: number; chords: string[]; melody: number[]; lyrics: string }
  chorus: { duration: number; chords: string[]; melody: number[]; lyrics: string }
  bridge: { duration: number; chords: string[]; melody: number[]; lyrics: string }
  outro: { duration: number; chords: string[]; melody: number[] }
}

export interface CompositionRequest {
  title: string
  genre: string
  key: string
  tempo: number
  timeSignature: string
  lyrics: string
  mood: string
  complexity: "simple" | "moderate" | "complex"
}

export interface QualityMetrics {
  melodicCoherence: number
  harmonicRichness: number
  rhythmicConsistency: number
  structuralBalance: number
  overallScore: number
}

export class Music21Service {
  private static readonly GENRE_CHORD_PROGRESSIONS = {
    pop: [
      ["C", "Am", "F", "G"],
      ["Am", "F", "C", "G"],
      ["F", "G", "Am", "C"],
      ["C", "G", "Am", "F"],
    ],
    rock: [
      ["E", "A", "B", "E"],
      ["A", "D", "E", "A"],
      ["G", "C", "D", "G"],
      ["Em", "C", "G", "D"],
    ],
    jazz: [
      ["Cmaj7", "Am7", "Dm7", "G7"],
      ["Am7", "D7", "Gmaj7", "Cmaj7"],
      ["Fmaj7", "Bm7b5", "E7", "Am7"],
      ["Dm7", "G7", "Em7", "Am7"],
    ],
    electronic: [
      ["Am", "F", "C", "G"],
      ["Dm", "Bb", "F", "C"],
      ["Em", "C", "G", "D"],
      ["Fm", "Db", "Ab", "Eb"],
    ],
    classical: [
      ["C", "F", "G", "C"],
      ["Am", "Dm", "G", "C"],
      ["F", "C", "G", "Am"],
      ["Dm", "G", "C", "F"],
    ],
  }

  private static readonly SCALE_PATTERNS = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    pentatonic: [0, 2, 4, 7, 9],
  }

  static async generateFullComposition(request: CompositionRequest): Promise<{
    structure: SongStructure
    midiData: Buffer
    qualityMetrics: QualityMetrics
  }> {
    try {
      console.log(`🎼 Generating full composition: ${request.title}`)

      // Analyze lyrics structure
      const lyricsStructure = this.analyzeLyricsStructure(request.lyrics)

      // Generate chord progressions for each section
      const chordProgressions = this.generateChordProgressions(request.genre, request.key)

      // Create melodic content for each section
      const melodies = this.generateMelodies(request, chordProgressions)

      // Build complete song structure
      const structure = this.buildSongStructure(lyricsStructure, chordProgressions, melodies, request)

      // Generate MIDI data
      const midiData = await this.generateMIDI(structure, request)

      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(structure, request)

      console.log(`✅ Composition generated with ${qualityMetrics.overallScore}% quality score`)

      return {
        structure,
        midiData,
        qualityMetrics,
      }
    } catch (error) {
      console.error("Music21 composition failed:", error)
      throw new Error(`Composition generation failed: ${error}`)
    }
  }

  private static analyzeLyricsStructure(lyrics: string) {
    const lines = lyrics.split("\n").filter((line) => line.trim())
    const sections = {
      verse: [] as string[],
      chorus: [] as string[],
      bridge: [] as string[],
    }

    let currentSection = "verse"

    for (const line of lines) {
      const lowerLine = line.toLowerCase()

      if (lowerLine.includes("[chorus]") || lowerLine.includes("chorus:")) {
        currentSection = "chorus"
        continue
      } else if (lowerLine.includes("[verse]") || lowerLine.includes("verse:")) {
        currentSection = "verse"
        continue
      } else if (lowerLine.includes("[bridge]") || lowerLine.includes("bridge:")) {
        currentSection = "bridge"
        continue
      }

      if (line.trim()) {
        sections[currentSection as keyof typeof sections].push(line.trim())
      }
    }

    // If no explicit sections, distribute lines intelligently
    if (sections.verse.length === 0 && sections.chorus.length === 0) {
      const totalLines = lines.length
      const verseLines = Math.ceil(totalLines * 0.6)
      const chorusLines = Math.floor(totalLines * 0.3)

      sections.verse = lines.slice(0, verseLines)
      sections.chorus = lines.slice(verseLines, verseLines + chorusLines)
      sections.bridge = lines.slice(verseLines + chorusLines)
    }

    return sections
  }

  private static generateChordProgressions(genre: string, key: string) {
    const genreProgressions =
      this.GENRE_CHORD_PROGRESSIONS[genre.toLowerCase() as keyof typeof this.GENRE_CHORD_PROGRESSIONS] ||
      this.GENRE_CHORD_PROGRESSIONS.pop

    // Transpose to requested key
    const transposedProgressions = genreProgressions.map((progression) =>
      this.transposeChordProgression(progression, key),
    )

    return {
      intro: transposedProgressions[0],
      verse: transposedProgressions[1],
      chorus: transposedProgressions[0], // Often same as intro for cohesion
      bridge: transposedProgressions[2],
      outro: transposedProgressions[3],
    }
  }

  private static transposeChordProgression(progression: string[], targetKey: string): string[] {
    // Simplified transposition - in production, use proper music theory
    const keyMap: Record<string, number> = {
      C: 0,
      "C#": 1,
      Db: 1,
      D: 2,
      "D#": 3,
      Eb: 3,
      E: 4,
      F: 5,
      "F#": 6,
      Gb: 6,
      G: 7,
      "G#": 8,
      Ab: 8,
      A: 9,
      "A#": 10,
      Bb: 10,
      B: 11,
    }

    const semitoneShift = keyMap[targetKey] || 0

    return progression.map((chord) => {
      // Simple chord transposition logic
      const rootNote = chord.charAt(0)
      const quality = chord.slice(1)
      const newRoot = this.transposeNote(rootNote, semitoneShift)
      return newRoot + quality
    })
  }

  private static transposeNote(note: string, semitones: number): string {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    const noteIndex = notes.indexOf(note)
    if (noteIndex === -1) return note

    const newIndex = (noteIndex + semitones) % 12
    return notes[newIndex]
  }

  private static generateMelodies(request: CompositionRequest, chordProgressions: any) {
    const scale = this.SCALE_PATTERNS.major // Simplified - choose based on genre/mood
    const baseNote = 60 // Middle C

    return {
      intro: this.generateMelodyLine(chordProgressions.intro, scale, baseNote, 8),
      verse: this.generateMelodyLine(chordProgressions.verse, scale, baseNote, 16),
      chorus: this.generateMelodyLine(chordProgressions.chorus, scale, baseNote + 5, 16), // Higher for chorus
      bridge: this.generateMelodyLine(chordProgressions.bridge, scale, baseNote + 3, 12),
      outro: this.generateMelodyLine(chordProgressions.outro, scale, baseNote - 3, 8), // Lower for outro
    }
  }

  private static generateMelodyLine(chords: string[], scale: number[], baseNote: number, length: number): number[] {
    const melody: number[] = []

    for (let i = 0; i < length; i++) {
      const chordIndex = i % chords.length
      const scaleNote = scale[Math.floor(Math.random() * scale.length)]
      const octaveVariation = Math.floor(Math.random() * 3) - 1 // -1, 0, or 1 octave
      const note = baseNote + scaleNote + octaveVariation * 12

      melody.push(Math.max(36, Math.min(84, note))) // Keep in reasonable range
    }

    return melody
  }

  private static buildSongStructure(
    lyricsStructure: any,
    chordProgressions: any,
    melodies: any,
    request: CompositionRequest,
  ): SongStructure {
    const beatsPerMeasure = Number.parseInt(request.timeSignature.split("/")[0])
    const measureDuration = (60 / request.tempo) * beatsPerMeasure

    return {
      intro: {
        duration: measureDuration * 4, // 4 measures
        chords: chordProgressions.intro,
        melody: melodies.intro,
      },
      verse: {
        duration: measureDuration * 8, // 8 measures
        chords: chordProgressions.verse,
        melody: melodies.verse,
        lyrics: lyricsStructure.verse.join("\n"),
      },
      chorus: {
        duration: measureDuration * 8, // 8 measures
        chords: chordProgressions.chorus,
        melody: melodies.chorus,
        lyrics: lyricsStructure.chorus.join("\n"),
      },
      bridge: {
        duration: measureDuration * 4, // 4 measures
        chords: chordProgressions.bridge,
        melody: melodies.bridge,
        lyrics: lyricsStructure.bridge.join("\n"),
      },
      outro: {
        duration: measureDuration * 4, // 4 measures
        chords: chordProgressions.outro,
        melody: melodies.outro,
      },
    }
  }

  private static async generateMIDI(structure: SongStructure, request: CompositionRequest): Promise<Buffer> {
    // Simplified MIDI generation - in production, use proper MIDI library
    const midiEvents: any[] = []
    let currentTime = 0

    // Add tempo and time signature
    midiEvents.push({
      type: "setTempo",
      time: 0,
      tempo: request.tempo,
    })

    // Generate MIDI events for each section
    const sections = ["intro", "verse", "chorus", "bridge", "outro"] as const

    for (const sectionName of sections) {
      const section = structure[sectionName]

      // Add chord progression
      for (let i = 0; i < section.chords.length; i++) {
        const chordTime = currentTime + (section.duration / section.chords.length) * i
        midiEvents.push({
          type: "noteOn",
          time: chordTime,
          note: this.chordToMidiNotes(section.chords[i]),
          velocity: 80,
        })
      }

      // Add melody line
      for (let i = 0; i < section.melody.length; i++) {
        const noteTime = currentTime + (section.duration / section.melody.length) * i
        midiEvents.push({
          type: "noteOn",
          time: noteTime,
          note: section.melody[i],
          velocity: 100,
          duration: (section.duration / section.melody.length) * 0.8,
        })
      }

      currentTime += section.duration
    }

    // Convert to MIDI buffer (simplified)
    return this.createMIDIBuffer(midiEvents)
  }

  private static chordToMidiNotes(chord: string): number[] {
    // Simplified chord to MIDI conversion
    const rootNote = 60 // Middle C
    const chordPatterns: Record<string, number[]> = {
      C: [0, 4, 7],
      Am: [9, 0, 4],
      F: [5, 9, 0],
      G: [7, 11, 2],
      Dm: [2, 5, 9],
      Em: [4, 7, 11],
    }

    const pattern = chordPatterns[chord] || [0, 4, 7]
    return pattern.map((interval) => rootNote + interval)
  }

  private static createMIDIBuffer(events: any[]): Buffer {
    // Simplified MIDI buffer creation
    // In production, use a proper MIDI library like 'midi-writer-js'
    const headerSize = 14
    const trackSize = events.length * 8 + 8
    const totalSize = headerSize + trackSize

    const buffer = Buffer.alloc(totalSize)

    // MIDI header
    buffer.write("MThd", 0)
    buffer.writeUInt32BE(6, 4)
    buffer.writeUInt16BE(0, 8) // Format 0
    buffer.writeUInt16BE(1, 10) // 1 track
    buffer.writeUInt16BE(480, 12) // Ticks per quarter note

    // Track header
    buffer.write("MTrk", 14)
    buffer.writeUInt32BE(trackSize - 8, 18)

    // Simplified event data
    let offset = 22
    for (const event of events) {
      buffer.writeUInt8(0, offset++) // Delta time
      buffer.writeUInt8(0x90, offset++) // Note on
      buffer.writeUInt8(60, offset++) // Note number
      buffer.writeUInt8(80, offset++) // Velocity
    }

    return buffer
  }

  private static calculateQualityMetrics(structure: SongStructure, request: CompositionRequest): QualityMetrics {
    // Melodic Coherence: Check for smooth melodic transitions
    const melodicCoherence = this.calculateMelodicCoherence(structure)

    // Harmonic Richness: Evaluate chord progression complexity
    const harmonicRichness = this.calculateHarmonicRichness(structure, request.genre)

    // Rhythmic Consistency: Check tempo and timing consistency
    const rhythmicConsistency = this.calculateRhythmicConsistency(structure, request.tempo)

    // Structural Balance: Evaluate section proportions
    const structuralBalance = this.calculateStructuralBalance(structure)

    // Overall score
    const overallScore =
      Math.round(
        (melodicCoherence * 0.3 + harmonicRichness * 0.3 + rhythmicConsistency * 0.2 + structuralBalance * 0.2) * 100,
      ) / 100

    return {
      melodicCoherence: Math.round(melodicCoherence * 100),
      harmonicRichness: Math.round(harmonicRichness * 100),
      rhythmicConsistency: Math.round(rhythmicConsistency * 100),
      structuralBalance: Math.round(structuralBalance * 100),
      overallScore: Math.round(overallScore * 100),
    }
  }

  private static calculateMelodicCoherence(structure: SongStructure): number {
    let totalIntervals = 0
    let smoothIntervals = 0

    const sections = [structure.verse, structure.chorus, structure.bridge]

    for (const section of sections) {
      for (let i = 1; i < section.melody.length; i++) {
        const interval = Math.abs(section.melody[i] - section.melody[i - 1])
        totalIntervals++

        if (interval <= 7) {
          // Within an octave
          smoothIntervals++
        }
      }
    }

    return totalIntervals > 0 ? smoothIntervals / totalIntervals : 0.8
  }

  private static calculateHarmonicRichness(structure: SongStructure, genre: string): number {
    const allChords = [
      ...structure.intro.chords,
      ...structure.verse.chords,
      ...structure.chorus.chords,
      ...structure.bridge.chords,
      ...structure.outro.chords,
    ]

    const uniqueChords = new Set(allChords)
    const chordVariety = uniqueChords.size / Math.max(allChords.length, 1)

    // Genre-specific scoring
    const genreMultipliers: Record<string, number> = {
      jazz: 1.2,
      classical: 1.1,
      rock: 0.9,
      pop: 0.8,
      electronic: 0.85,
    }

    const multiplier = genreMultipliers[genre.toLowerCase()] || 1.0
    return Math.min(1.0, chordVariety * multiplier)
  }

  private static calculateRhythmicConsistency(structure: SongStructure, tempo: number): number {
    // Check if tempo is within reasonable range for genre
    const tempoScore = tempo >= 60 && tempo <= 200 ? 1.0 : 0.7

    // Check section duration consistency
    const durations = [structure.verse.duration, structure.chorus.duration, structure.bridge.duration]

    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length
    const consistencyScore = Math.max(0, 1 - variance / (avgDuration * avgDuration))

    return (tempoScore + consistencyScore) / 2
  }

  private static calculateStructuralBalance(structure: SongStructure): number {
    const totalDuration =
      structure.intro.duration +
      structure.verse.duration +
      structure.chorus.duration +
      structure.bridge.duration +
      structure.outro.duration

    // Ideal proportions (rough guidelines)
    const idealProportions = {
      intro: 0.1,
      verse: 0.3,
      chorus: 0.3,
      bridge: 0.2,
      outro: 0.1,
    }

    let balanceScore = 0
    const sections = ["intro", "verse", "chorus", "bridge", "outro"] as const

    for (const section of sections) {
      const actualProportion = structure[section].duration / totalDuration
      const idealProportion = idealProportions[section]
      const difference = Math.abs(actualProportion - idealProportion)
      balanceScore += Math.max(0, 1 - difference / idealProportion)
    }

    return balanceScore / sections.length
  }

  // Professional arrangement methods
  static generateGenreSpecificArrangement(genre: string, structure: SongStructure) {
    const arrangements: Record<string, any> = {
      pop: {
        instruments: ["piano", "guitar", "bass", "drums", "strings"],
        dynamics: "moderate",
        effects: ["reverb", "compression"],
      },
      rock: {
        instruments: ["electric_guitar", "bass_guitar", "drums", "vocals"],
        dynamics: "high",
        effects: ["distortion", "delay", "compression"],
      },
      jazz: {
        instruments: ["piano", "bass", "drums", "saxophone", "trumpet"],
        dynamics: "variable",
        effects: ["reverb", "chorus"],
      },
      electronic: {
        instruments: ["synthesizer", "drum_machine", "bass_synth", "pad"],
        dynamics: "high",
        effects: ["filter", "delay", "reverb", "compression"],
      },
      classical: {
        instruments: ["strings", "woodwinds", "brass", "percussion"],
        dynamics: "variable",
        effects: ["natural_reverb"],
      },
    }

    return arrangements[genre.toLowerCase()] || arrangements.pop
  }
}
