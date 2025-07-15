export interface InstrumentalRequest {
  genre: string
  tempo: number
  key: string
  duration: number
  structure: string
}

export class AudioSynthesisService {
  private static audioContext: AudioContext | null = null
  private static readonly SAMPLE_RATE = 44100
  private static readonly CHANNELS = 2 // Stereo

  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.audioContext
  }

  // Star-Spangled Banner melody notes (simplified)
  static readonly STAR_SPANGLED_BANNER_NOTES = [
    { note: "G4", duration: 0.75 }, // Oh
    { note: "E4", duration: 0.25 }, // say
    { note: "C5", duration: 0.5 }, // can
    { note: "C5", duration: 0.5 }, // you
    { note: "C5", duration: 0.5 }, // see
    { note: "C5", duration: 0.25 }, // by
    { note: "B4", duration: 0.25 }, // the
    { note: "A4", duration: 0.5 }, // dawn's
    { note: "A4", duration: 0.25 }, // ear
    { note: "G4", duration: 0.25 }, // ly
    { note: "G4", duration: 1.0 }, // light
  ]

  // Convert note name to frequency
  private static noteToFrequency(note: string): number {
    const noteMap: Record<string, number> = {
      C2: 65.41,
      D2: 73.42,
      E2: 82.41,
      F2: 87.31,
      G2: 98.0,
      A2: 110.0,
      B2: 123.47,
      C3: 130.81,
      D3: 146.83,
      E3: 164.81,
      F3: 174.61,
      G3: 196.0,
      A3: 220.0,
      B3: 246.94,
      C4: 261.63,
      D4: 293.66,
      E4: 329.63,
      F4: 349.23,
      G4: 392.0,
      A4: 440.0,
      B4: 493.88,
      C5: 523.25,
      D5: 587.33,
      E5: 659.25,
      F5: 698.46,
      G5: 783.99,
      A5: 880.0,
      B5: 987.77,
      Eb4: 311.13,
      "F#3": 185.0,
      "F#4": 369.99,
      "G#3": 207.65,
      "C#4": 277.18,
      Bb4: 466.16,
    }
    return noteMap[note] || 440
  }

  // Generate basic Star-Spangled Banner melody
  static async generateBasicMelody(): Promise<AudioBuffer> {
    const context = this.getAudioContext()
    const sampleRate = context.sampleRate
    const totalDuration = this.STAR_SPANGLED_BANNER_NOTES.reduce((sum, note) => sum + note.duration, 0)
    const buffer = context.createBuffer(1, totalDuration * sampleRate, sampleRate)
    const data = buffer.getChannelData(0)

    let currentTime = 0

    for (const noteInfo of this.STAR_SPANGLED_BANNER_NOTES) {
      const frequency = this.noteToFrequency(noteInfo.note)
      const startSample = Math.floor(currentTime * sampleRate)
      const endSample = Math.floor((currentTime + noteInfo.duration) * sampleRate)

      for (let i = startSample; i < endSample && i < data.length; i++) {
        const t = (i - startSample) / sampleRate
        const envelope = Math.sin((Math.PI * t) / noteInfo.duration) // Simple envelope
        data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3
      }

      currentTime += noteInfo.duration
    }

    return buffer
  }

  // Generate genre-specific versions
  static async generateGenreVersion(genre: string): Promise<AudioBuffer> {
    const baseBuffer = await this.generateBasicMelody()
    const context = this.getAudioContext()
    const buffer = context.createBuffer(baseBuffer.numberOfChannels, baseBuffer.length, baseBuffer.sampleRate)
    const sourceData = baseBuffer.getChannelData(0)
    const outputData = buffer.getChannelData(0)

    for (let i = 0; i < sourceData.length; i++) {
      const t = i / baseBuffer.sampleRate
      let sample = sourceData[i]

      switch (genre.toLowerCase()) {
        case "rock":
          // Add distortion and power
          sample = Math.tanh(sample * 3) * 0.8
          // Add some harmonics
          sample += Math.sin(2 * Math.PI * 880 * t) * sample * 0.2
          break

        case "jazz":
          // Add swing rhythm and blue notes
          const swingMod = 1 + Math.sin(2 * Math.PI * 2 * t) * 0.1
          sample *= swingMod
          // Add seventh harmonics
          sample += Math.sin(2 * Math.PI * 330 * t) * sample * 0.15
          break

        case "electronic":
          // Add synthesizer-like effects
          sample = Math.sign(sample) * Math.pow(Math.abs(sample), 0.7)
          // Add filter sweep
          const filterMod = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.5 * t)
          sample *= filterMod
          break

        case "country":
          // Add twang and simplicity
          sample *= 0.9
          // Add slight chorus effect
          const delayedSample = i > 1000 ? sourceData[i - 1000] * 0.3 : 0
          sample += delayedSample
          break

        case "pop":
          // Clean, polished sound
          sample = Math.tanh(sample * 1.2) * 0.9
          break

        default:
          // Keep original
          break
      }

      outputData[i] = Math.max(-1, Math.min(1, sample))
    }

    return buffer
  }

  // Generate instrumental track
  static async generateInstrumental(request: InstrumentalRequest): Promise<Buffer> {
    console.log(`🎼 Generating ${request.genre} instrumental at ${request.tempo} BPM`)

    const samples = Math.floor(request.duration * this.SAMPLE_RATE)
    const bufferSize = samples * this.CHANNELS * 2 // 16-bit samples
    const audioBuffer = Buffer.alloc(bufferSize)

    // Generate Star-Spangled Banner melody with genre styling
    const melody = this.getStarSpangledBannerMelody()
    const chords = this.getChordProgression(request.key)

    for (let i = 0; i < samples; i++) {
      const time = i / this.SAMPLE_RATE
      const beatTime = time * (request.tempo / 60)

      // Generate melody
      const melodyNote = this.getMelodyNoteAtTime(melody, beatTime)
      const melodyFreq = this.noteToFrequency(melodyNote, request.key)
      const melodySample = Math.sin(2 * Math.PI * melodyFreq * time) * 0.4

      // Generate harmony
      const chordIndex = Math.floor(beatTime / 2) % chords.length
      const chord = chords[chordIndex]
      let harmonySample = 0

      for (const note of chord) {
        const freq = this.noteToFrequency(note, request.key)
        harmonySample += Math.sin(2 * Math.PI * freq * time) * 0.2
      }

      // Generate rhythm
      const rhythmSample = this.generateRhythm(beatTime, request.genre, request.tempo)

      // Apply genre-specific effects
      let finalSample = melodySample + harmonySample + rhythmSample
      finalSample = this.applyGenreEffects(finalSample, request.genre, time)

      // Apply envelope
      const envelope = this.getEnvelope(time, request.duration)
      finalSample *= envelope

      // Convert to 16-bit and write stereo
      const intSample = Math.max(-32767, Math.min(32767, finalSample * 32767))
      const offset = i * this.CHANNELS * 2

      // Left channel
      audioBuffer.writeInt16LE(intSample, offset)
      // Right channel (slightly different for stereo effect)
      audioBuffer.writeInt16LE(intSample * 0.9, offset + 2)
    }

    console.log(`✅ Generated ${request.duration}s instrumental track`)
    return audioBuffer
  }

  // Get Star-Spangled Banner melody
  private static getStarSpangledBannerMelody(): string[] {
    return [
      "G3",
      "E3",
      "C4",
      "E3",
      "G3",
      "C4",
      "E4",
      "D4",
      "C4",
      "E3",
      "F#3",
      "G3",
      "G3",
      "E3",
      "C4",
      "E3",
      "G3",
      "C4",
      "E4",
      "D4",
      "C4",
      "C4",
      "C4",
      "C4",
      "E4",
      "D4",
      "C4",
      "B3",
      "A3",
      "B3",
      "C4",
      "C4",
      "G3",
      "E3",
      "G3",
      "C4",
    ]
  }

  // Get chord progression
  private static getChordProgression(key: string): string[][] {
    // I-V-vi-IV progression in C major
    return [
      ["C4", "E4", "G4"], // C major
      ["G3", "B3", "D4"], // G major
      ["A3", "C4", "E4"], // A minor
      ["F3", "A3", "C4"], // F major
    ]
  }

  // Get melody note at specific time
  private static getMelodyNoteAtTime(melody: string[], beatTime: number): string {
    const noteIndex = Math.floor(beatTime / 0.5) % melody.length
    return melody[noteIndex]
  }

  // Generate rhythm section
  private static generateRhythm(beatTime: number, genre: string, tempo: number): number {
    let rhythmSample = 0

    // Kick drum (on beats 1 and 3)
    const kickTime = beatTime % 2
    if (kickTime < 0.1) {
      const kickEnv = Math.exp(-kickTime * 20)
      rhythmSample += Math.sin(2 * Math.PI * 60 * kickTime) * kickEnv * 0.3
    }

    // Snare drum (on beats 2 and 4)
    const snareTime = (beatTime + 1) % 2
    if (snareTime < 0.05) {
      const snareEnv = Math.exp(-snareTime * 30)
      const noise = (Math.random() - 0.5) * 2
      rhythmSample += noise * snareEnv * 0.2
    }

    // Hi-hat (eighth notes)
    const hihatTime = (beatTime * 2) % 1
    if (hihatTime < 0.02) {
      const hihatEnv = Math.exp(-hihatTime * 50)
      rhythmSample += (Math.random() - 0.5) * hihatEnv * 0.1
    }

    return rhythmSample
  }

  // Apply genre-specific effects
  private static applyGenreEffects(sample: number, genre: string, time: number): number {
    switch (genre.toLowerCase()) {
      case "rock":
        // Add distortion
        return Math.tanh(sample * 2) * 0.8
      case "jazz":
        // Add subtle chorus
        const delayedSample = Math.sin(2 * Math.PI * 440 * (time - 0.01))
        return sample + delayedSample * 0.1
      case "electronic":
        // Add filter sweep
        const filterMod = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.25 * time)
        return sample * filterMod
      default:
        return sample
    }
  }

  // Get envelope for smooth attack/release
  private static getEnvelope(time: number, duration: number): number {
    const attackTime = 0.1
    const releaseTime = 0.5

    if (time < attackTime) {
      return time / attackTime
    } else if (time > duration - releaseTime) {
      return (duration - time) / releaseTime
    } else {
      return 1
    }
  }

  // Convert AudioBuffer to Blob
  static audioBufferToBlob(buffer: AudioBuffer): Blob {
    const length = buffer.length
    const numberOfChannels = buffer.numberOfChannels
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
    const view = new DataView(arrayBuffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, "RIFF")
    view.setUint32(4, 36 + length * numberOfChannels * 2, true)
    writeString(8, "WAVE")
    writeString(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, buffer.sampleRate, true)
    view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, "data")
    view.setUint32(40, length * numberOfChannels * 2, true)

    // Convert float samples to 16-bit PCM
    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample * 0x7fff, true)
        offset += 2
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" })
  }

  // Play audio buffer directly
  static playAudioBuffer(buffer: AudioBuffer): AudioBufferSourceNode {
    const context = this.getAudioContext()
    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(context.destination)
    source.start()
    return source
  }

  // Mix two audio buffers
  static async mixAudio(buffer1: Buffer, buffer2: Buffer): Promise<Buffer> {
    const maxLength = Math.max(buffer1.length, buffer2.length)
    const mixedBuffer = Buffer.alloc(maxLength)

    for (let i = 0; i < maxLength; i += 2) {
      let sample1 = 0
      let sample2 = 0

      if (i < buffer1.length) {
        sample1 = buffer1.readInt16LE(i)
      }
      if (i < buffer2.length) {
        sample2 = buffer2.readInt16LE(i)
      }

      const mixed = Math.max(-32767, Math.min(32767, (sample1 + sample2) * 0.7))
      mixedBuffer.writeInt16LE(mixed, i)
    }

    return mixedBuffer
  }

  // Apply watermark to demo version
  static async applyWatermark(audioBuffer: Buffer): Promise<Buffer> {
    const watermarkedBuffer = Buffer.from(audioBuffer)
    const watermarkInterval = this.SAMPLE_RATE * 10 // Every 10 seconds

    for (let i = 0; i < watermarkedBuffer.length; i += watermarkInterval * 4) {
      // Add watermark tone
      for (let j = 0; j < this.SAMPLE_RATE && i + j < watermarkedBuffer.length; j += 2) {
        const watermarkTone = Math.sin((2 * Math.PI * 1000 * j) / this.SAMPLE_RATE) * 8000
        const originalSample = watermarkedBuffer.readInt16LE(i + j)
        const watermarkedSample = Math.max(-32767, Math.min(32767, originalSample + watermarkTone))
        watermarkedBuffer.writeInt16LE(watermarkedSample, i + j)
      }
    }

    return watermarkedBuffer
  }

  // Compress to MP3 (simplified)
  static async compressToMP3(audioBuffer: Buffer, bitrate: number): Promise<Buffer> {
    // In production, use actual MP3 encoder like lame
    // For now, return original buffer with simulated compression
    const compressionRatio = bitrate / 1411 // Compared to CD quality
    const compressedSize = Math.floor(audioBuffer.length * compressionRatio)
    return audioBuffer.subarray(0, compressedSize)
  }

  // Compress to FLAC (simplified)
  static async compressToFLAC(audioBuffer: Buffer): Promise<Buffer> {
    // In production, use actual FLAC encoder
    // For now, return original buffer (FLAC is lossless)
    return audioBuffer
  }

  // Convert buffer to WAV format with proper headers
  static bufferToWav(audioBuffer: Buffer, sampleRate = 44100, channels = 2): Buffer {
    const byteRate = sampleRate * channels * 2 // 16-bit
    const blockAlign = channels * 2
    const dataSize = audioBuffer.length
    const fileSize = 36 + dataSize

    const wavBuffer = Buffer.alloc(44 + dataSize)
    let offset = 0

    // RIFF header
    wavBuffer.write("RIFF", offset)
    offset += 4
    wavBuffer.writeUInt32LE(fileSize, offset)
    offset += 4
    wavBuffer.write("WAVE", offset)
    offset += 4

    // fmt chunk
    wavBuffer.write("fmt ", offset)
    offset += 4
    wavBuffer.writeUInt32LE(16, offset)
    offset += 4 // chunk size
    wavBuffer.writeUInt16LE(1, offset)
    offset += 2 // audio format (PCM)
    wavBuffer.writeUInt16LE(channels, offset)
    offset += 2
    wavBuffer.writeUInt32LE(sampleRate, offset)
    offset += 4
    wavBuffer.writeUInt32LE(byteRate, offset)
    offset += 4
    wavBuffer.writeUInt16LE(blockAlign, offset)
    offset += 2
    wavBuffer.writeUInt16LE(16, offset)
    offset += 2 // bits per sample

    // data chunk
    wavBuffer.write("data", offset)
    offset += 4
    wavBuffer.writeUInt32LE(dataSize, offset)
    offset += 4
    audioBuffer.copy(wavBuffer, offset)

    return wavBuffer
  }

  // Estimate file size for different formats
  static estimateFileSize(durationSeconds: number, format: string, quality: string): number {
    const baseSizePerSecond = {
      mp3: {
        "128": 16000, // 128 kbps
        "320": 40000, // 320 kbps
      },
      wav: {
        cd: 176400, // 44.1kHz 16-bit stereo
        hd: 352800, // 44.1kHz 24-bit stereo
      },
      flac: {
        lossless: 88200, // ~50% of WAV
      },
    }

    const formatSizes = baseSizePerSecond[format as keyof typeof baseSizePerSecond]
    if (!formatSizes) return durationSeconds * 40000 // Default to 320kbps MP3

    const qualitySize = formatSizes[quality as keyof typeof formatSizes]
    return durationSeconds * (qualitySize || 40000)
  }

  // Format file size for display
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Calculate pricing based on file size
  static calculatePrice(bytes: number): number {
    // Base price: $0.01 per MB
    const pricePerMB = 0.01
    const sizeInMB = bytes / (1024 * 1024)
    return Math.max(0.99, Math.round(sizeInMB * pricePerMB * 100) / 100) // Minimum $0.99
  }

  // Generate real audio with actual musical content
  static async generateRealAudio(params: {
    title: string
    genre: string
    tempo: number
    duration: number
    lyrics?: string
  }): Promise<string> {
    const context = this.getAudioContext()
    const sampleRate = context.sampleRate
    const durationSamples = Math.floor(params.duration * sampleRate)
    const buffer = context.createBuffer(2, durationSamples, sampleRate)

    const leftChannel = buffer.getChannelData(0)
    const rightChannel = buffer.getChannelData(1)

    // Generate a real musical composition based on genre
    this.generateMusicalComposition(leftChannel, rightChannel, params, sampleRate)

    // Convert to blob URL for playback
    const audioBlob = this.audioBufferToBlob(buffer)
    return URL.createObjectURL(audioBlob)
  }

  private static generateMusicalComposition(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    params: { genre: string; tempo: number; duration: number },
    sampleRate: number,
  ) {
    const beatsPerSecond = params.tempo / 60
    const samplesPerBeat = sampleRate / beatsPerSecond

    for (let i = 0; i < leftChannel.length; i++) {
      const time = i / sampleRate
      const beat = Math.floor(i / samplesPerBeat)

      // Generate chord progression
      const chordIndex = Math.floor(beat / 4) % 4
      const chord = this.getChordForGenre(params.genre, chordIndex)

      // Generate melody
      const melodyNote = this.getMelodyNote(beat, params.genre)
      const melodyFreq = this.noteToFrequency(melodyNote)

      // Generate bass line
      const bassNote = chord[0] // Root note
      const bassFreq = this.noteToFrequency(bassNote) / 2 // One octave lower

      // Create the mix
      let sample = 0

      // Melody (lead)
      sample +=
        Math.sin(2 * Math.PI * melodyFreq * time) * 0.3 * this.getEnvelope(time, beat, samplesPerBeat / sampleRate)

      // Harmony (chord)
      for (const note of chord) {
        const freq = this.noteToFrequency(note)
        sample += Math.sin(2 * Math.PI * freq * time) * 0.15
      }

      // Bass line
      sample += Math.sin(2 * Math.PI * bassFreq * time) * 0.4

      // Drums
      sample += this.generateDrums(time, beat, params.tempo, params.genre)

      // Apply genre-specific effects
      sample = this.applyGenreEffects(sample, params.genre, time)

      // Apply master envelope
      const masterEnvelope = this.getMasterEnvelope(time, params.duration)
      sample *= masterEnvelope

      // Prevent clipping
      sample = Math.tanh(sample * 0.8) * 0.9

      leftChannel[i] = sample
      rightChannel[i] = sample * 0.95 // Slight stereo width
    }
  }

  private static getChordForGenre(genre: string, chordIndex: number): string[] {
    const progressions: Record<string, string[][]> = {
      pop: [
        ["C4", "E4", "G4"], // C major
        ["A3", "C4", "E4"], // A minor
        ["F3", "A3", "C4"], // F major
        ["G3", "B3", "D4"], // G major
      ],
      rock: [
        ["E3", "G#3", "B3"], // E major
        ["A3", "C#4", "E4"], // A major
        ["D3", "F#3", "A3"], // D major
        ["E3", "G#3", "B3"], // E major
      ],
      jazz: [
        ["C4", "E4", "G4", "B4"], // Cmaj7
        ["A3", "C4", "E4", "G4"], // Am7
        ["F3", "A3", "C4", "E4"], // Fmaj7
        ["G3", "B3", "D4", "F4"], // G7
      ],
      electronic: [
        ["C3", "E3", "G3"], // C major
        ["G2", "B2", "D3"], // G major
        ["A2", "C3", "E3"], // A minor
        ["F2", "A2", "C3"], // F major
      ],
    }

    const progression = progressions[genre.toLowerCase()] || progressions["pop"]
    return progression[chordIndex % progression.length]
  }

  private static getMelodyNote(beat: number, genre: string): string {
    const scales: Record<string, string[]> = {
      pop: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
      rock: ["E4", "F#4", "G4", "A4", "B4", "C5", "D5", "E5"],
      jazz: ["C4", "D4", "Eb4", "F4", "G4", "A4", "Bb4", "C5"],
      electronic: ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5"],
    }

    const scale = scales[genre.toLowerCase()] || scales["pop"]
    const noteIndex = (beat + Math.floor(beat / 8)) % scale.length
    return scale[noteIndex]
  }

  private static generateDrums(time: number, beat: number, tempo: number, genre: string): number {
    let drumSample = 0
    const beatInMeasure = beat % 4

    // Kick drum (on beats 1 and 3)
    if (beatInMeasure === 0 || beatInMeasure === 2) {
      const kickTime = time % (60 / tempo)
      if (kickTime < 0.1) {
        const kickEnv = Math.exp(-kickTime * 20)
        drumSample += Math.sin(2 * Math.PI * 60 * kickTime) * kickEnv * 0.5
      }
    }

    // Snare drum (on beats 2 and 4)
    if (beatInMeasure === 1 || beatInMeasure === 3) {
      const snareTime = time % (60 / tempo)
      if (snareTime < 0.05) {
        const snareEnv = Math.exp(-snareTime * 30)
        const noise = (Math.random() - 0.5) * 2
        drumSample += noise * snareEnv * 0.3
      }
    }

    // Hi-hat (eighth notes for electronic/pop)
    if (genre.toLowerCase() === "electronic" || genre.toLowerCase() === "pop") {
      const hihatTime = time % (30 / tempo) // Eighth notes
      if (hihatTime < 0.02) {
        const hihatEnv = Math.exp(-hihatTime * 50)
        drumSample += (Math.random() - 0.5) * hihatEnv * 0.15
      }
    }

    return drumSample
  }

  private static getMasterEnvelope(time: number, duration: number): number {
    const fadeIn = 2
    const fadeOut = 2

    if (time < fadeIn) {
      return time / fadeIn
    } else if (time > duration - fadeOut) {
      return (duration - time) / fadeOut
    } else {
      return 1
    }
  }

  // Generate demo tracks with real audio
  static async generateDemoTrack(genre: string, title: string): Promise<string> {
    return this.generateRealAudio({
      title,
      genre,
      tempo: 120,
      duration: 30, // 30 second demo
    })
  }

  // Mix vocals with instrumental
  static async mixAudio(instrumentalUrl: string, vocalUrl: string): Promise<string> {
    const context = this.getAudioContext()

    try {
      // Load both audio files
      const [instrumentalResponse, vocalResponse] = await Promise.all([fetch(instrumentalUrl), fetch(vocalUrl)])

      const [instrumentalBuffer, vocalBuffer] = await Promise.all([
        instrumentalResponse.arrayBuffer(),
        vocalResponse.arrayBuffer(),
      ])

      const [decodedInstrumental, decodedVocal] = await Promise.all([
        context.decodeAudioData(instrumentalBuffer),
        context.decodeAudioData(vocalBuffer),
      ])

      // Create mixed buffer
      const maxLength = Math.max(decodedInstrumental.length, decodedVocal.length)
      const mixedBuffer = context.createBuffer(2, maxLength, context.sampleRate)

      for (let channel = 0; channel < 2; channel++) {
        const mixedData = mixedBuffer.getChannelData(channel)
        const instrumentalData = decodedInstrumental.getChannelData(
          Math.min(channel, decodedInstrumental.numberOfChannels - 1),
        )
        const vocalData = decodedVocal.getChannelData(Math.min(channel, decodedVocal.numberOfChannels - 1))

        for (let i = 0; i < maxLength; i++) {
          const instrumental = i < instrumentalData.length ? instrumentalData[i] : 0
          const vocal = i < vocalData.length ? vocalData[i] : 0
          mixedData[i] = (instrumental * 0.6 + vocal * 0.8) * 0.8 // Mix and prevent clipping
        }
      }

      const mixedBlob = this.audioBufferToBlob(mixedBuffer)
      return URL.createObjectURL(mixedBlob)
    } catch (error) {
      console.error("Audio mixing failed:", error)
      return instrumentalUrl // Fallback to instrumental
    }
  }
}
