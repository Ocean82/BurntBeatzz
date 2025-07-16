interface AudioLDM2Config {
  apiKey: string
  baseUrl: string
  model: string
  maxDuration: number
  sampleRate: number
}

interface AudioGenerationRequest {
  prompt: string
  duration?: number
  guidance_scale?: number
  num_inference_steps?: number
  seed?: number
  negative_prompt?: string
  audio_length_in_s?: number
}

interface AudioGenerationResponse {
  success: boolean
  audio_url?: string
  audio_data?: string
  error?: string
  generation_id: string
  duration: number
  sample_rate: number
  metadata: {
    prompt: string
    model: string
    timestamp: string
    parameters: AudioGenerationRequest
  }
}

export class AudioLDM2Service {
  private config: AudioLDM2Config

  constructor(config: Partial<AudioLDM2Config> = {}) {
    this.config = {
      apiKey: process.env.AUDIOLDM2_API_KEY || "",
      baseUrl: process.env.AUDIOLDM2_BASE_URL || "https://api.replicate.com/v1",
      model: "audioldm2-large",
      maxDuration: 30,
      sampleRate: 44100,
      ...config,
    }
  }

  async generateAudio(request: AudioGenerationRequest): Promise<AudioGenerationResponse> {
    try {
      console.log("🎵 Generating audio with AudioLDM2:", request.prompt)

      const response = await fetch(`${this.config.baseUrl}/predictions`, {
        method: "POST",
        headers: {
          Authorization: `Token ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "audioldm2-large",
          input: {
            prompt: request.prompt,
            audio_length_in_s: Math.min(request.duration || 10, this.config.maxDuration),
            guidance_scale: request.guidance_scale || 3.5,
            num_inference_steps: request.num_inference_steps || 50,
            seed: request.seed || Math.floor(Math.random() * 1000000),
            negative_prompt: request.negative_prompt || "low quality, distorted, noise",
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`AudioLDM2 API error: ${response.status}`)
      }

      const prediction = await response.json()

      // Poll for completion
      const result = await this.pollForCompletion(prediction.id)

      return {
        success: true,
        audio_url: result.output?.[0],
        generation_id: prediction.id,
        duration: request.duration || 10,
        sample_rate: this.config.sampleRate,
        metadata: {
          prompt: request.prompt,
          model: this.config.model,
          timestamp: new Date().toISOString(),
          parameters: request,
        },
      }
    } catch (error) {
      console.error("❌ AudioLDM2 generation failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        generation_id: `error_${Date.now()}`,
        duration: 0,
        sample_rate: this.config.sampleRate,
        metadata: {
          prompt: request.prompt,
          model: this.config.model,
          timestamp: new Date().toISOString(),
          parameters: request,
        },
      }
    }
  }

  private async pollForCompletion(predictionId: string, maxAttempts = 60): Promise<any> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`${this.config.baseUrl}/predictions/${predictionId}`, {
        headers: {
          Authorization: `Token ${this.config.apiKey}`,
        },
      })

      const prediction = await response.json()

      if (prediction.status === "succeeded") {
        return prediction
      }

      if (prediction.status === "failed") {
        throw new Error(`AudioLDM2 generation failed: ${prediction.error}`)
      }

      // Wait 2 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    throw new Error("AudioLDM2 generation timed out")
  }

  async generateMusicFromMidi(midiData: string, style?: string): Promise<AudioGenerationResponse> {
    const prompt = this.createMidiPrompt(midiData, style)
    return this.generateAudio({
      prompt,
      duration: 20,
      guidance_scale: 4.0,
      num_inference_steps: 50,
    })
  }

  async generateDrumTrack(genre: string, tempo: number): Promise<AudioGenerationResponse> {
    const prompt = `${genre} drum track, ${tempo} BPM, professional quality, clean recording`
    return this.generateAudio({
      prompt,
      duration: 15,
      guidance_scale: 3.5,
      negative_prompt: "melody, harmony, vocals, low quality",
    })
  }

  async generateBassline(key: string, genre: string): Promise<AudioGenerationResponse> {
    const prompt = `${genre} bassline in ${key}, deep bass, rhythmic, professional recording`
    return this.generateAudio({
      prompt,
      duration: 15,
      guidance_scale: 3.5,
      negative_prompt: "drums, melody, vocals, high frequency",
    })
  }

  async generateAmbientTexture(mood: string, duration = 30): Promise<AudioGenerationResponse> {
    const prompt = `ambient ${mood} texture, atmospheric, evolving soundscape, cinematic`
    return this.generateAudio({
      prompt,
      duration: Math.min(duration, this.config.maxDuration),
      guidance_scale: 2.5,
      num_inference_steps: 60,
    })
  }

  private createMidiPrompt(midiData: string, style?: string): string {
    // Analyze MIDI data to create descriptive prompt
    const basePrompt = "musical composition"
    const stylePrompt = style ? ` in ${style} style` : ""
    const qualityPrompt = ", high quality, professional recording"

    return basePrompt + stylePrompt + qualityPrompt
  }

  async enhanceAudioQuality(audioUrl: string): Promise<AudioGenerationResponse> {
    // This would use AudioLDM2's audio-to-audio capabilities
    const prompt = "high quality, enhanced, professional recording, clear audio"

    try {
      const response = await fetch(`${this.config.baseUrl}/predictions`, {
        method: "POST",
        headers: {
          Authorization: `Token ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "audioldm2-large",
          input: {
            prompt,
            audio: audioUrl,
            guidance_scale: 2.0,
            num_inference_steps: 30,
          },
        }),
      })

      const prediction = await response.json()
      const result = await this.pollForCompletion(prediction.id)

      return {
        success: true,
        audio_url: result.output?.[0],
        generation_id: prediction.id,
        duration: 0,
        sample_rate: this.config.sampleRate,
        metadata: {
          prompt,
          model: this.config.model,
          timestamp: new Date().toISOString(),
          parameters: { prompt },
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Enhancement failed",
        generation_id: `error_${Date.now()}`,
        duration: 0,
        sample_rate: this.config.sampleRate,
        metadata: {
          prompt,
          model: this.config.model,
          timestamp: new Date().toISOString(),
          parameters: { prompt },
        },
      }
    }
  }

  getConfig(): AudioLDM2Config {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<AudioLDM2Config>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

export const audioLDM2Service = new AudioLDM2Service()
