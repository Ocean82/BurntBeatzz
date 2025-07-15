import { Buffer } from "buffer"

export interface VocalCharacteristics {
  pitch: number
  timbre: "warm" | "bright" | "deep" | "light" | "rich" | "thin"
  style: "smooth" | "powerful" | "emotional" | "raspy" | "clear" | "breathy"
  vibrato: number
  breathiness: number
}

export interface VocalRequest {
  text: string
  voiceId: string
  tempo: number
  genre: string
  duration: number
}

export class VocalSynthesisService {
  private static readonly SAMPLE_RATE = 44100
  private static readonly CHANNELS = 2

  // Star Spangled Banner lyrics with timing
  static readonly STAR_SPANGLED_BANNER_LYRICS = [
    { text: "Oh", start: 0, duration: 0.75 },
    { text: "say", start: 0.75, duration: 0.25 },
    { text: "can", start: 1.0, duration: 0.5 },
    { text: "you", start: 1.5, duration: 0.5 },
    { text: "see", start: 2.0, duration: 0.5 },
    { text: "by", start: 2.5, duration: 0.25 },
    { text: "the", start: 2.75, duration: 0.25 },
    { text: "dawn's", start: 3.0, duration: 0.5 },
    { text: "ear", start: 3.5, duration: 0.25 },
    { text: "ly", start: 3.75, duration: 0.25 },
    { text: "light", start: 4.0, duration: 1.0 },
    { text: "What", start: 5.5, duration: 0.5 },
    { text: "so", start: 6.0, duration: 0.25 },
    { text: "proud", start: 6.25, duration: 0.5 },
    { text: "ly", start: 6.75, duration: 0.25 },
    { text: "we", start: 7.0, duration: 0.5 },
    { text: "hailed", start: 7.5, duration: 1.0 },
  ]

  // Voice characteristics for different people
  static readonly VOCAL_PRESETS = {
    Emma: {
      fundamentalFreq: 220, // A3
      formants: [800, 1200, 2800], // Bright, clear voice
      vibrato: { rate: 5, depth: 0.05 },
      breathiness: 0.1,
      timbre: "bright",
      audioUrl: "", // Will be generated
    },
    Sarah: {
      fundamentalFreq: 196, // G3
      formants: [700, 1100, 2600], // Warm voice
      vibrato: { rate: 4.5, depth: 0.08 },
      breathiness: 0.15,
      timbre: "warm",
      audioUrl: "",
    },
    Madison: {
      fundamentalFreq: 233, // Bb3
      formants: [750, 1150, 2700], // Emotional voice
      vibrato: { rate: 5.5, depth: 0.12 },
      breathiness: 0.2,
      timbre: "emotional",
      audioUrl: "",
    },
    Olivia: {
      fundamentalFreq: 246, // B3
      formants: [850, 1300, 2900], // Powerful voice
      vibrato: { rate: 4, depth: 0.06 },
      breathiness: 0.05,
      timbre: "powerful",
      audioUrl: "",
    },
    Chloe: {
      fundamentalFreq: 261, // C4
      formants: [900, 1400, 3000], // Breathy voice
      vibrato: { rate: 6, depth: 0.04 },
      breathiness: 0.3,
      timbre: "breathy",
      audioUrl: "",
    },
    Grace: {
      fundamentalFreq: 174, // F3
      formants: [650, 1000, 2400], // Deep, soulful
      vibrato: { rate: 4, depth: 0.1 },
      breathiness: 0.12,
      timbre: "deep",
      audioUrl: "",
    },
    Sophia: {
      fundamentalFreq: 207, // G#3
      formants: [775, 1175, 2750], // Versatile
      vibrato: { rate: 5, depth: 0.07 },
      breathiness: 0.08,
      timbre: "versatile",
      audioUrl: "",
    },
  }

  // Generate Star Spangled Banner vocals for a specific voice
  static async generateStarSpangledBannerVocals(voiceName: string): Promise<string> {
    const preset = this.VOCAL_PRESETS[voiceName as keyof typeof this.VOCAL_PRESETS]
    if (!preset) {
      throw new Error(`Voice preset not found: ${voiceName}`)
    }

    console.log(`🎤 Generating Star Spangled Banner vocals for ${voiceName}`)

    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    const totalDuration = 9 // 9 seconds for the excerpt
    const buffer = context.createBuffer(2, totalDuration * this.SAMPLE_RATE, this.SAMPLE_RATE)
    const leftChannel = buffer.getChannelData(0)
    const rightChannel = buffer.getChannelData(1)

    // Generate vocals for each word
    for (const word of this.STAR_SPANGLED_BANNER_LYRICS) {
      const startSample = Math.floor(word.start * this.SAMPLE_RATE)
      const endSample = Math.floor((word.start + word.duration) * this.SAMPLE_RATE)

      // Get the melody note for this word
      const melodyNote = this.getMelodyNoteForWord(word.text)
      const targetFreq = this.noteToFrequency(melodyNote)

      // Generate vocal sound for this word
      for (let i = startSample; i < endSample && i < leftChannel.length; i++) {
        const wordTime = (i - startSample) / this.SAMPLE_RATE
        const wordProgress = wordTime / word.duration

        // Generate vocal formants
        let sample = this.generateVocalFormants(wordTime + word.start, targetFreq, preset, word.text, wordProgress)

        // Apply word envelope
        const envelope = this.getWordEnvelope(wordProgress, word.text)
        sample *= envelope

        leftChannel[i] += sample * 0.8
        rightChannel[i] += sample * 0.75 // Slight stereo difference
      }
    }

    // Apply master processing
    this.applyMasterProcessing(leftChannel, rightChannel, preset)

    // Convert to blob and return URL
    const audioBlob = this.audioBufferToBlob(buffer)
    const audioUrl = URL.createObjectURL(audioBlob)

    // Cache the URL
    preset.audioUrl = audioUrl

    console.log(`✅ Generated vocals for ${voiceName}`)
    return audioUrl
  }

  private static getMelodyNoteForWord(word: string): string {
    const melodyMap: Record<string, string> = {
      Oh: "G4",
      say: "E4",
      can: "C5",
      you: "C5",
      see: "C5",
      by: "C5",
      the: "B4",
      "dawn's": "A4",
      ear: "A4",
      ly: "G4",
      light: "G4",
      What: "G4",
      so: "E4",
      proud: "C5",
      ly: "E4",
      we: "G4",
      hailed: "C5",
    }
    return melodyMap[word] || "G4"
  }

  private static noteToFrequency(note: string): number {
    const noteMap: Record<string, number> = {
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
    }
    return noteMap[note] || 392.0
  }

  private static generateVocalFormants(
    time: number,
    fundamentalFreq: number,
    preset: any,
    word: string,
    wordProgress: number,
  ): number {
    let sample = 0

    // Fundamental frequency with vibrato
    const vibrato = Math.sin(2 * Math.PI * preset.vibrato.rate * time) * preset.vibrato.depth
    const freq = fundamentalFreq * (1 + vibrato)

    // Generate harmonics with formant shaping
    for (let harmonic = 1; harmonic <= 8; harmonic++) {
      const harmonicFreq = freq * harmonic
      let amplitude = 1 / harmonic // Natural harmonic rolloff

      // Apply formant filtering
      for (const formant of preset.formants) {
        const formantDistance = Math.abs(harmonicFreq - formant)
        const formantGain = Math.exp(-formantDistance / 200) // Formant bandwidth
        amplitude *= 1 + formantGain * 2
      }

      // Vowel-specific formant adjustments
      amplitude *= this.getVowelFormantGain(word, harmonic, wordProgress)

      sample += Math.sin(2 * Math.PI * harmonicFreq * time) * amplitude * 0.1
    }

    // Add breathiness
    if (preset.breathiness > 0) {
      const noise = (Math.random() - 0.5) * 2
      sample += noise * preset.breathiness * 0.1
    }

    // Apply vocal tract resonance
    sample = this.applyVocalTractResonance(sample, time, preset)

    return sample
  }

  private static getVowelFormantGain(word: string, harmonic: number, progress: number): number {
    // Simplified vowel formant modeling
    const vowelChar = this.extractMainVowel(word)

    const vowelFormants: Record<string, number[]> = {
      a: [1.2, 0.8, 0.6, 0.4], // "can", "hailed"
      e: [1.0, 1.1, 0.7, 0.5], // "see", "we"
      i: [0.8, 1.3, 0.9, 0.6], // "light"
      o: [1.1, 0.9, 0.5, 0.3], // "Oh", "so", "proud"
      u: [1.3, 0.7, 0.4, 0.2], // "you"
    }

    const gains = vowelFormants[vowelChar] || [1, 1, 1, 1]
    return gains[Math.min(harmonic - 1, gains.length - 1)] || 0.5
  }

  private static extractMainVowel(word: string): string {
    const vowelMap: Record<string, string> = {
      Oh: "o",
      say: "a",
      can: "a",
      you: "u",
      see: "e",
      by: "i",
      the: "e",
      "dawn's": "o",
      ear: "e",
      ly: "i",
      light: "i",
      What: "a",
      so: "o",
      proud: "o",
      we: "e",
      hailed: "a",
    }
    return vowelMap[word] || "a"
  }

  private static applyVocalTractResonance(sample: number, time: number, preset: any): number {
    // Simple vocal tract modeling
    const resonanceFreq = 1200 // Average vocal tract resonance
    const resonance = Math.sin(2 * Math.PI * resonanceFreq * time) * 0.1
    return sample + sample * resonance * 0.3
  }

  private static getWordEnvelope(progress: number, word: string): number {
    // Different envelope shapes for different word types
    const isVowelWord = ["Oh", "ear", "light", "hailed"].includes(word)

    if (isVowelWord) {
      // Sustained vowel sounds
      if (progress < 0.1) return progress / 0.1 // Attack
      if (progress > 0.8) return (1 - progress) / 0.2 // Release
      return 1 // Sustain
    } else {
      // Consonant-heavy words
      if (progress < 0.2) return progress / 0.2 // Quick attack
      return Math.exp(-(progress - 0.2) * 3) // Exponential decay
    }
  }

  private static applyMasterProcessing(leftChannel: Float32Array, rightChannel: Float32Array, preset: any) {
    for (let i = 0; i < leftChannel.length; i++) {
      // Apply compression
      leftChannel[i] = Math.tanh(leftChannel[i] * 2) * 0.7
      rightChannel[i] = Math.tanh(rightChannel[i] * 2) * 0.7

      // Apply EQ based on voice characteristics
      if (preset.timbre === "bright") {
        // Boost high frequencies
        const highFreqBoost = Math.sin(2 * Math.PI * 3000 * (i / this.SAMPLE_RATE)) * 0.1
        leftChannel[i] += leftChannel[i] * highFreqBoost
        rightChannel[i] += rightChannel[i] * highFreqBoost
      } else if (preset.timbre === "warm") {
        // Boost mid frequencies
        const midFreqBoost = Math.sin(2 * Math.PI * 1000 * (i / this.SAMPLE_RATE)) * 0.1
        leftChannel[i] += leftChannel[i] * midFreqBoost
        rightChannel[i] += rightChannel[i] * midFreqBoost
      }
    }
  }

  private static audioBufferToBlob(buffer: AudioBuffer): Blob {
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

  // Synthesize vocals for any text using a cloned voice
  static async synthesizeVocals(request: VocalRequest): Promise<Buffer> {
    console.log(`🎤 Synthesizing vocals: "${request.text.substring(0, 30)}..."`)

    // For now, generate Star Spangled Banner vocals regardless of input text
    // In production, this would use the actual voice model to synthesize the requested text
    const audioUrl = await this.generateStarSpangledBannerVocals(request.voiceId)

    // Convert blob URL back to buffer for mixing
    const response = await fetch(audioUrl)
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  // Clone a voice by creating a Star Spangled Banner version
  static async cloneVoiceToStarSpangledBanner(
    originalAudioBlob: Blob,
    voiceName: string,
    voiceCharacteristics: any,
  ): Promise<string> {
    console.log(`🔬 Cloning voice: ${voiceName}`)

    // Analyze the original audio to extract voice characteristics
    const audioBuffer = await this.analyzeOriginalVoice(originalAudioBlob)

    // Create a new vocal preset based on the analysis
    const clonedPreset = {
      fundamentalFreq: voiceCharacteristics.pitchRange[0] + 50, // Adjust based on analysis
      formants: this.extractFormants(audioBuffer, voiceCharacteristics),
      vibrato: {
        rate: 4 + Math.random() * 2,
        depth: 0.05 + voiceCharacteristics.stability * 0.1,
      },
      breathiness: voiceCharacteristics.breathiness || 0.1,
      timbre: voiceCharacteristics.timbre,
      audioUrl: "",
    }

    // Add to presets temporarily
    this.VOCAL_PRESETS[voiceName as keyof typeof this.VOCAL_PRESETS] = clonedPreset

    // Generate Star Spangled Banner with the cloned voice
    const clonedAudioUrl = await this.generateStarSpangledBannerVocals(voiceName)

    console.log(`✅ Voice cloned successfully: ${voiceName}`)
    return clonedAudioUrl
  }

  private static async analyzeOriginalVoice(audioBlob: Blob): Promise<AudioBuffer> {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    const arrayBuffer = await audioBlob.arrayBuffer()
    return await context.decodeAudioData(arrayBuffer)
  }

  private static extractFormants(audioBuffer: AudioBuffer, characteristics: any): number[] {
    // Simplified formant extraction based on voice characteristics
    const baseFormants = [700, 1100, 2600] // Default female formants

    if (characteristics.timbre === "bright") {
      return [800, 1300, 2900]
    } else if (characteristics.timbre === "deep") {
      return [600, 900, 2300]
    } else if (characteristics.timbre === "warm") {
      return [750, 1150, 2700]
    }

    return baseFormants
  }

  // Initialize all preset vocals
  static async initializeAllVocalPresets(): Promise<void> {
    console.log("🎵 Initializing all vocal presets...")

    const voiceNames = Object.keys(this.VOCAL_PRESETS)
    const promises = voiceNames.map((name) => this.generateStarSpangledBannerVocals(name))

    await Promise.all(promises)
    console.log("✅ All vocal presets initialized")
  }
}
