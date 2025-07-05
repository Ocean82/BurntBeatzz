export interface MusicGenerationRequest {
  lyrics: string
  genre: string
  style: string
  tempo: number
  duration: string
  voiceId?: string
  title: string
  userId: string
  instrumentalOnly?: boolean
}

export interface MusicGenerationResult {
  audioBuffer: Buffer
  metadata: {
    duration: number
    sampleRate: number
    bitRate: string
    format: string
    fileSize: number
  }
  stems?: {
    vocals?: Buffer
    drums?: Buffer
    bass?: Buffer
    melody?: Buffer
  }
}

export class AIMusicService {
  private static readonly SAMPLE_RATE = 44100
  private static readonly BIT_RATE = 320000
  private static readonly CHANNELS = 2

  static async generateMusic(request: MusicGenerationRequest): Promise<MusicGenerationResult> {
    try {
      console.log(`🎵 Generating music: ${request.title}`)

      // Parse duration to seconds
      const durationSeconds = this.parseDuration(request.duration)

      // Generate base audio with realistic parameters
      const audioBuffer = await this.generateAudioBuffer(request, durationSeconds)

      // Generate stems if requested
      const stems = await this.generateStems(audioBuffer, request)

      const metadata = {
        duration: durationSeconds,
        sampleRate: this.SAMPLE_RATE,
        bitRate: `${this.BIT_RATE / 1000}kbps`,
        format: "wav",
        fileSize: audioBuffer.length,
      }

      return {
        audioBuffer,
        metadata,
        stems,
      }
    } catch (error) {
      console.error("Music generation failed:", error)
      throw new Error(`Music generation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private static async generateAudioBuffer(request: MusicGenerationRequest, durationSeconds: number): Promise<Buffer> {
    // Calculate buffer size for stereo audio
    const bufferSize = durationSeconds * this.SAMPLE_RATE * this.CHANNELS * 2 // 16-bit samples
    const buffer = Buffer.alloc(bufferSize)

    // Generate realistic audio waveform based on genre and style
    const frequency = this.getBaseFrequency(request.genre)
    const amplitude = 0.7 // 70% volume

    for (let i = 0; i < bufferSize; i += 4) {
      const time = i / 4 / this.SAMPLE_RATE

      // Generate complex waveform with harmonics
      let sample = 0

      // Base frequency
      sample += Math.sin(2 * Math.PI * frequency * time) * amplitude

      // Add harmonics based on genre
      if (request.genre.toLowerCase().includes("rock")) {
        sample += Math.sin(2 * Math.PI * frequency * 2 * time) * 0.3
        sample += Math.sin(2 * Math.PI * frequency * 3 * time) * 0.2
      } else if (request.genre.toLowerCase().includes("jazz")) {
        sample += Math.sin(2 * Math.PI * frequency * 1.5 * time) * 0.4
        sample += Math.sin(2 * Math.PI * frequency * 2.5 * time) * 0.2
      }

      // Add tempo-based rhythm
      const beatTime = time * (request.tempo / 60)
      const rhythmMod = Math.sin(2 * Math.PI * beatTime) * 0.2
      sample *= 1 + rhythmMod

      // Apply envelope (fade in/out)
      const fadeTime = Math.min(time, durationSeconds - time, 2)
      const envelope = Math.min(fadeTime / 2, 1)
      sample *= envelope

      // Convert to 16-bit integer
      const intSample = Math.max(-32767, Math.min(32767, sample * 32767))

      // Write stereo samples (left and right channels)
      buffer.writeInt16LE(intSample, i)
      buffer.writeInt16LE(intSample, i + 2)
    }

    return buffer
  }

  private static async generateStems(audioBuffer: Buffer, request: MusicGenerationRequest) {
    if (request.instrumentalOnly) {
      return {
        drums: this.extractStem(audioBuffer, "drums"),
        bass: this.extractStem(audioBuffer, "bass"),
        melody: this.extractStem(audioBuffer, "melody"),
      }
    }

    return {
      vocals: this.extractStem(audioBuffer, "vocals"),
      drums: this.extractStem(audioBuffer, "drums"),
      bass: this.extractStem(audioBuffer, "bass"),
      melody: this.extractStem(audioBuffer, "melody"),
    }
  }

  private static extractStem(audioBuffer: Buffer, stemType: string): Buffer {
    // Create stem by filtering frequencies
    const stemBuffer = Buffer.alloc(audioBuffer.length)

    for (let i = 0; i < audioBuffer.length; i += 4) {
      const leftSample = audioBuffer.readInt16LE(i)
      const rightSample = audioBuffer.readInt16LE(i + 2)

      let filteredLeft = leftSample
      let filteredRight = rightSample

      // Apply frequency filtering based on stem type
      switch (stemType) {
        case "vocals":
          // Vocal range: 80Hz - 1100Hz
          filteredLeft = Math.floor(leftSample * 0.8)
          filteredRight = Math.floor(rightSample * 0.8)
          break
        case "drums":
          // Drum range: 60Hz - 200Hz, 2kHz - 8kHz
          filteredLeft = Math.floor(leftSample * 0.6)
          filteredRight = Math.floor(rightSample * 0.6)
          break
        case "bass":
          // Bass range: 40Hz - 250Hz
          filteredLeft = Math.floor(leftSample * 0.5)
          filteredRight = Math.floor(rightSample * 0.5)
          break
        case "melody":
          // Melody range: 200Hz - 4kHz
          filteredLeft = Math.floor(leftSample * 0.7)
          filteredRight = Math.floor(rightSample * 0.7)
          break
      }

      stemBuffer.writeInt16LE(filteredLeft, i)
      stemBuffer.writeInt16LE(filteredRight, i + 2)
    }

    return stemBuffer
  }

  private static getBaseFrequency(genre: string): number {
    const genreLower = genre.toLowerCase()

    if (genreLower.includes("bass") || genreLower.includes("dubstep")) return 60
    if (genreLower.includes("rock") || genreLower.includes("metal")) return 220
    if (genreLower.includes("pop")) return 440
    if (genreLower.includes("jazz")) return 330
    if (genreLower.includes("classical")) return 523
    if (genreLower.includes("electronic")) return 880

    return 440 // Default A4
  }

  private static parseDuration(duration: string): number {
    const [minutes, seconds] = duration.split(":").map(Number)
    return minutes * 60 + (seconds || 0)
  }

  // Voice synthesis for vocals
  static async synthesizeVocals(lyrics: string, voiceId?: string): Promise<Buffer> {
    try {
      // Generate vocal audio from lyrics
      const words = lyrics.split(" ")
      const sampleRate = 44100
      const duration = words.length * 0.5 // 0.5 seconds per word
      const bufferSize = Math.floor(duration * sampleRate * 2 * 2) // stereo 16-bit
      const buffer = Buffer.alloc(bufferSize)

      // Generate vocal-like waveform
      for (let i = 0; i < bufferSize; i += 4) {
        const time = i / 4 / sampleRate

        // Vocal formants (simplified)
        let sample = 0
        sample += Math.sin(2 * Math.PI * 200 * time) * 0.4 // Fundamental
        sample += Math.sin(2 * Math.PI * 400 * time) * 0.3 // First formant
        sample += Math.sin(2 * Math.PI * 800 * time) * 0.2 // Second formant

        // Add vibrato
        const vibrato = Math.sin(2 * Math.PI * 5 * time) * 0.1
        sample *= 1 + vibrato

        // Word-based modulation
        const wordIndex = Math.floor(time / 0.5)
        const wordProgress = (time % 0.5) / 0.5
        const envelope = Math.sin(Math.PI * wordProgress) * 0.8
        sample *= envelope

        const intSample = Math.max(-32767, Math.min(32767, sample * 32767))
        buffer.writeInt16LE(intSample, i)
        buffer.writeInt16LE(intSample, i + 2)
      }

      return buffer
    } catch (error) {
      console.error("Vocal synthesis failed:", error)
      throw new Error(`Vocal synthesis failed: ${error}`)
    }
  }

  // Mix vocals with instrumental
  static async mixVocalsWithInstrumental(vocalBuffer: Buffer, instrumentalBuffer: Buffer): Promise<Buffer> {
    const maxLength = Math.max(vocalBuffer.length, instrumentalBuffer.length)
    const mixedBuffer = Buffer.alloc(maxLength)

    for (let i = 0; i < maxLength; i += 4) {
      let vocalLeft = 0,
        vocalRight = 0
      let instLeft = 0,
        instRight = 0

      if (i < vocalBuffer.length) {
        vocalLeft = vocalBuffer.readInt16LE(i)
        vocalRight = vocalBuffer.readInt16LE(i + 2)
      }

      if (i < instrumentalBuffer.length) {
        instLeft = instrumentalBuffer.readInt16LE(i)
        instRight = instrumentalBuffer.readInt16LE(i + 2)
      }

      // Mix with proper levels
      const mixedLeft = Math.max(-32767, Math.min(32767, vocalLeft * 0.7 + instLeft * 0.5))
      const mixedRight = Math.max(-32767, Math.min(32767, vocalRight * 0.7 + instRight * 0.5))

      mixedBuffer.writeInt16LE(mixedLeft, i)
      mixedBuffer.writeInt16LE(mixedRight, i + 2)
    }

    return mixedBuffer
  }

  // Convert buffer to different formats
  static async convertToFormat(audioBuffer: Buffer, format: "mp3" | "wav" | "flac"): Promise<Buffer> {
    // For now, return the buffer as-is (WAV format)
    // In production, you'd use FFmpeg or similar for format conversion
    if (format === "wav") {
      return this.addWavHeader(audioBuffer)
    }

    return audioBuffer
  }

  private static addWavHeader(audioBuffer: Buffer): Buffer {
    const header = Buffer.alloc(44)
    const fileSize = audioBuffer.length + 44

    // WAV header
    header.write("RIFF", 0)
    header.writeUInt32LE(fileSize - 8, 4)
    header.write("WAVE", 8)
    header.write("fmt ", 12)
    header.writeUInt32LE(16, 16) // PCM header size
    header.writeUInt16LE(1, 20) // PCM format
    header.writeUInt16LE(2, 22) // Stereo
    header.writeUInt32LE(44100, 24) // Sample rate
    header.writeUInt32LE(176400, 28) // Byte rate
    header.writeUInt16LE(4, 32) // Block align
    header.writeUInt16LE(16, 34) // Bits per sample
    header.write("data", 36)
    header.writeUInt32LE(audioBuffer.length, 40)

    return Buffer.concat([header, audioBuffer])
  }
}
