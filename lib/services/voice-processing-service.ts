export interface VoiceProcessingOptions {
  sampleRate?: number
  bitDepth?: number
  channels?: number
  noiseReduction?: boolean
  normalize?: boolean
}

export interface VoiceCharacteristics {
  pitchRange: [number, number]
  timbre: string
  clarity: number
  stability: number
  dominantFrequencies: number[]
}

export class VoiceProcessingService {
  private static readonly DEFAULT_SAMPLE_RATE = 44100
  private static readonly DEFAULT_BIT_DEPTH = 16
  private static readonly DEFAULT_CHANNELS = 1 // Mono for voice

  static async processVoiceSample(
    audioBuffer: Buffer,
    options: VoiceProcessingOptions = {},
  ): Promise<{ processedBuffer: Buffer; characteristics: VoiceCharacteristics }> {
    try {
      console.log("🎤 Processing voice sample...")

      const sampleRate = options.sampleRate || this.DEFAULT_SAMPLE_RATE
      const channels = options.channels || this.DEFAULT_CHANNELS

      // Process the audio buffer
      let processedBuffer = audioBuffer

      // Apply noise reduction if requested
      if (options.noiseReduction) {
        processedBuffer = this.applyNoiseReduction(processedBuffer)
      }

      // Normalize audio if requested
      if (options.normalize) {
        processedBuffer = this.normalizeAudio(processedBuffer)
      }

      // Convert to mono if needed
      if (channels === 1) {
        processedBuffer = this.convertToMono(processedBuffer)
      }

      // Analyze voice characteristics
      const characteristics = this.analyzeVoiceCharacteristics(processedBuffer, sampleRate)

      console.log("✅ Voice processing completed")

      return {
        processedBuffer,
        characteristics,
      }
    } catch (error) {
      console.error("Voice processing failed:", error)
      throw new Error(`Voice processing failed: ${error}`)
    }
  }

  private static applyNoiseReduction(buffer: Buffer): Buffer {
    const processedBuffer = Buffer.alloc(buffer.length)

    // Simple noise gate - remove samples below threshold
    const threshold = 1000 // Adjust based on your needs

    for (let i = 0; i < buffer.length; i += 2) {
      const sample = buffer.readInt16LE(i)
      const absSample = Math.abs(sample)

      if (absSample > threshold) {
        processedBuffer.writeInt16LE(sample, i)
      } else {
        processedBuffer.writeInt16LE(0, i) // Silence below threshold
      }
    }

    return processedBuffer
  }

  private static normalizeAudio(buffer: Buffer): Buffer {
    // Find peak amplitude
    let peak = 0
    for (let i = 0; i < buffer.length; i += 2) {
      const sample = Math.abs(buffer.readInt16LE(i))
      if (sample > peak) peak = sample
    }

    if (peak === 0) return buffer

    // Calculate normalization factor
    const targetPeak = 32767 * 0.9 // 90% of max to avoid clipping
    const normalizationFactor = targetPeak / peak

    const normalizedBuffer = Buffer.alloc(buffer.length)

    for (let i = 0; i < buffer.length; i += 2) {
      const sample = buffer.readInt16LE(i)
      const normalizedSample = Math.max(-32767, Math.min(32767, sample * normalizationFactor))
      normalizedBuffer.writeInt16LE(normalizedSample, i)
    }

    return normalizedBuffer
  }

  private static convertToMono(buffer: Buffer): Buffer {
    // Assume input is stereo (2 channels)
    const monoBuffer = Buffer.alloc(buffer.length / 2)

    for (let i = 0, j = 0; i < buffer.length; i += 4, j += 2) {
      const leftSample = buffer.readInt16LE(i)
      const rightSample = buffer.readInt16LE(i + 2)

      // Average left and right channels
      const monoSample = Math.floor((leftSample + rightSample) / 2)
      monoBuffer.writeInt16LE(monoSample, j)
    }

    return monoBuffer
  }

  private static analyzeVoiceCharacteristics(buffer: Buffer, sampleRate: number): VoiceCharacteristics {
    // Analyze the audio buffer to extract voice characteristics
    const samples = []
    for (let i = 0; i < buffer.length; i += 2) {
      samples.push(buffer.readInt16LE(i))
    }

    // Calculate fundamental frequency (pitch)
    const fundamentalFreq = this.calculateFundamentalFrequency(samples, sampleRate)

    // Estimate pitch range (simplified)
    const pitchRange: [number, number] = [Math.max(80, fundamentalFreq - 50), Math.min(400, fundamentalFreq + 50)]

    // Calculate clarity (signal-to-noise ratio approximation)
    const clarity = this.calculateClarity(samples)

    // Calculate stability (pitch consistency)
    const stability = this.calculateStability(samples, sampleRate)

    // Find dominant frequencies
    const dominantFrequencies = this.findDominantFrequencies(samples, sampleRate)

    // Determine timbre based on frequency content
    const timbre = this.determineTimbre(dominantFrequencies, fundamentalFreq)

    return {
      pitchRange,
      timbre,
      clarity,
      stability,
      dominantFrequencies,
    }
  }

  private static calculateFundamentalFrequency(samples: number[], sampleRate: number): number {
    // Simplified autocorrelation method
    const minPeriod = Math.floor(sampleRate / 400) // 400 Hz max
    const maxPeriod = Math.floor(sampleRate / 80) // 80 Hz min

    let bestPeriod = minPeriod
    let maxCorrelation = 0

    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0
      let count = 0

      for (let i = 0; i < samples.length - period; i++) {
        correlation += samples[i] * samples[i + period]
        count++
      }

      correlation /= count

      if (correlation > maxCorrelation) {
        maxCorrelation = correlation
        bestPeriod = period
      }
    }

    return sampleRate / bestPeriod
  }

  private static calculateClarity(samples: number[]): number {
    // Calculate RMS (Root Mean Square) as a measure of signal strength
    let sumSquares = 0
    for (const sample of samples) {
      sumSquares += sample * sample
    }

    const rms = Math.sqrt(sumSquares / samples.length)

    // Normalize to 0-1 range (simplified)
    return Math.min(1, rms / 16384)
  }

  private static calculateStability(samples: number[], sampleRate: number): number {
    // Measure pitch consistency over time
    const windowSize = Math.floor(sampleRate * 0.1) // 100ms windows
    const pitches = []

    for (let i = 0; i < samples.length - windowSize; i += windowSize) {
      const window = samples.slice(i, i + windowSize)
      const pitch = this.calculateFundamentalFrequency(window, sampleRate)
      pitches.push(pitch)
    }

    if (pitches.length < 2) return 1

    // Calculate variance
    const mean = pitches.reduce((sum, pitch) => sum + pitch, 0) / pitches.length
    const variance = pitches.reduce((sum, pitch) => sum + Math.pow(pitch - mean, 2), 0) / pitches.length

    // Convert to stability score (lower variance = higher stability)
    return Math.max(0, 1 - variance / (mean * mean))
  }

  private static findDominantFrequencies(samples: number[], sampleRate: number): number[] {
    // Simplified frequency analysis
    const frequencies = []
    const binSize = sampleRate / samples.length

    // Find peaks in frequency spectrum (simplified)
    for (let i = 1; i < 20; i++) {
      // Check first 20 harmonics
      const freq = i * binSize
      if (freq > 80 && freq < 4000) {
        // Voice frequency range
        frequencies.push(freq)
      }
    }

    return frequencies.slice(0, 5) // Return top 5
  }

  private static determineTimbre(dominantFrequencies: number[], fundamentalFreq: number): string {
    if (dominantFrequencies.length === 0) return "neutral"

    const highFreqRatio = dominantFrequencies.filter((f) => f > fundamentalFreq * 2).length / dominantFrequencies.length

    if (highFreqRatio > 0.6) return "bright"
    if (highFreqRatio < 0.3) return "warm"
    return "balanced"
  }

  // Generate voice synthesis parameters
  static generateSynthesisParams(characteristics: VoiceCharacteristics) {
    return {
      fundamentalFreq: (characteristics.pitchRange[0] + characteristics.pitchRange[1]) / 2,
      formants: this.calculateFormants(characteristics),
      breathiness: 1 - characteristics.clarity,
      vibrato: {
        rate: 5 + Math.random() * 3, // 5-8 Hz
        depth: characteristics.stability * 0.1,
      },
      resonance: characteristics.timbre === "bright" ? 1.2 : characteristics.timbre === "warm" ? 0.8 : 1.0,
    }
  }

  private static calculateFormants(characteristics: VoiceCharacteristics) {
    // Simplified formant calculation based on pitch range
    const avgPitch = (characteristics.pitchRange[0] + characteristics.pitchRange[1]) / 2

    return {
      f1: avgPitch * 2.5, // First formant
      f2: avgPitch * 4.5, // Second formant
      f3: avgPitch * 7.0, // Third formant
    }
  }

  // Create voice model for synthesis
  static async createVoiceModel(processedBuffer: Buffer, characteristics: VoiceCharacteristics) {
    const synthParams = this.generateSynthesisParams(characteristics)

    return {
      id: `voice_${Date.now()}`,
      audioSample: processedBuffer,
      characteristics,
      synthParams,
      createdAt: new Date(),
    }
  }
}
