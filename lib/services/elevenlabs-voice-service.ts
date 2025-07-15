// ElevenLabs Voice Cloning & TTS Service
interface ElevenLabsVoice {
  voice_id: string
  name: string
  samples: any[]
  category: string
  fine_tuning: {
    is_allowed_to_fine_tune: boolean
  }
}

interface VoiceCloneRequest {
  name: string
  description?: string
  files: File[]
  labels?: Record<string, string>
}

export class ElevenLabsService {
  private static readonly BASE_URL = "https://api.elevenlabs.io/v1"
  private static readonly API_KEY = process.env.ELEVENLABS_API_KEY!

  // Clone a voice from audio samples
  static async cloneVoice(request: VoiceCloneRequest): Promise<string> {
    try {
      const formData = new FormData()
      formData.append("name", request.name)

      if (request.description) {
        formData.append("description", request.description)
      }

      // Add audio files
      request.files.forEach((file, index) => {
        formData.append("files", file, `sample_${index}.wav`)
      })

      // Add labels if provided
      if (request.labels) {
        formData.append("labels", JSON.stringify(request.labels))
      }

      const response = await fetch(`${this.BASE_URL}/voices/add`, {
        method: "POST",
        headers: {
          "xi-api-key": this.API_KEY,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`ElevenLabs API error: ${error.detail?.message || response.statusText}`)
      }

      const result = await response.json()
      return result.voice_id
    } catch (error) {
      console.error("ElevenLabs voice cloning failed:", error)
      throw new Error(`Voice cloning failed: ${error}`)
    }
  }

  // Generate speech from text using cloned voice
  static async textToSpeech(
    text: string,
    voiceId: string,
    options?: {
      model_id?: string
      voice_settings?: {
        stability?: number
        similarity_boost?: number
        style?: number
        use_speaker_boost?: boolean
      }
    },
  ): Promise<Buffer> {
    try {
      const requestBody = {
        text,
        model_id: options?.model_id || "eleven_multilingual_v2",
        voice_settings: {
          stability: options?.voice_settings?.stability || 0.5,
          similarity_boost: options?.voice_settings?.similarity_boost || 0.75,
          style: options?.voice_settings?.style || 0.0,
          use_speaker_boost: options?.voice_settings?.use_speaker_boost || true,
        },
      }

      const response = await fetch(`${this.BASE_URL}/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": this.API_KEY,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`ElevenLabs TTS error: ${error}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error("ElevenLabs TTS failed:", error)
      throw new Error(`Text-to-speech failed: ${error}`)
    }
  }

  // Get all available voices
  static async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/voices`, {
        headers: {
          "xi-api-key": this.API_KEY,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`)
      }

      const result = await response.json()
      return result.voices
    } catch (error) {
      console.error("Failed to get ElevenLabs voices:", error)
      throw new Error(`Failed to get voices: ${error}`)
    }
  }

  // Delete a cloned voice
  static async deleteVoice(voiceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.BASE_URL}/voices/${voiceId}`, {
        method: "DELETE",
        headers: {
          "xi-api-key": this.API_KEY,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete voice: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Failed to delete voice:", error)
      throw new Error(`Failed to delete voice: ${error}`)
    }
  }

  // Get voice info
  static async getVoiceInfo(voiceId: string): Promise<ElevenLabsVoice> {
    try {
      const response = await fetch(`${this.BASE_URL}/voices/${voiceId}`, {
        headers: {
          "xi-api-key": this.API_KEY,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get voice info: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to get voice info:", error)
      throw new Error(`Failed to get voice info: ${error}`)
    }
  }
}
