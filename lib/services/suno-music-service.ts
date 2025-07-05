// Suno AI Music Generation Service (Unofficial API)
interface SunoTrack {
  id: string
  title: string
  audio_url: string
  video_url: string
  image_url: string
  lyric: string
  prompt: string
  style: string
  status: "submitted" | "queued" | "streaming" | "complete" | "error"
  created_at: string
  duration: number
}

interface SunoGenerationRequest {
  prompt: string
  make_instrumental?: boolean
  wait_audio?: boolean
  model?: "chirp-v3-0" | "chirp-v3-5"
  tags?: string
  title?: string
  continue_at?: number
  continue_clip_id?: string
}

export class SunoService {
  private static readonly BASE_URL = "https://api.sunoaiapi.com"
  private static readonly API_KEY = process.env.SUNO_API_KEY!

  // Generate music with Suno AI
  static async generateMusic(request: SunoGenerationRequest): Promise<SunoTrack[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.API_KEY,
        },
        body: JSON.stringify({
          prompt: request.prompt,
          make_instrumental: request.make_instrumental || false,
          wait_audio: request.wait_audio || false,
          model: request.model || "chirp-v3-5",
          tags: request.tags || "",
          title: request.title || "",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Suno API error: ${error.error || response.statusText}`)
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error("Suno music generation failed:", error)
      throw new Error(`Music generation failed: ${error}`)
    }
  }

  // Generate custom music with lyrics
  static async generateCustomMusic(
    lyrics: string,
    style: string,
    title: string,
    instrumental = false,
  ): Promise<SunoTrack[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/custom_generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.API_KEY,
        },
        body: JSON.stringify({
          prompt: lyrics,
          tags: style,
          title: title,
          make_instrumental: instrumental,
          wait_audio: false,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Suno custom generation error: ${error.error || response.statusText}`)
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error("Suno custom generation failed:", error)
      throw new Error(`Custom generation failed: ${error}`)
    }
  }

  // Get track info by ID
  static async getTrack(trackId: string): Promise<SunoTrack> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/get?ids=${trackId}`, {
        headers: {
          "api-key": this.API_KEY,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get track: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data[0]
    } catch (error) {
      console.error("Failed to get Suno track:", error)
      throw new Error(`Failed to get track: ${error}`)
    }
  }

  // Poll track until complete
  static async waitForCompletion(trackIds: string[]): Promise<SunoTrack[]> {
    const maxAttempts = 60 // 10 minutes max
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.BASE_URL}/api/get?ids=${trackIds.join(",")}`, {
          headers: {
            "api-key": this.API_KEY,
          },
        })

        const result = await response.json()
        const tracks = result.data || []

        // Check if all tracks are complete
        const allComplete = tracks.every((track: SunoTrack) => track.status === "complete" || track.status === "error")

        if (allComplete) {
          return tracks.filter((track: SunoTrack) => track.status === "complete")
        }

        // Wait 10 seconds before next check
        await new Promise((resolve) => setTimeout(resolve, 10000))
        attempts++
      } catch (error) {
        console.error("Error checking track status:", error)
        attempts++
      }
    }

    throw new Error("Track generation timeout")
  }

  // Download audio from Suno
  static async downloadAudio(audioUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(audioUrl)

      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error("Audio download failed:", error)
      throw new Error(`Audio download failed: ${error}`)
    }
  }

  // Get account info
  static async getAccountInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/get_limit`, {
        headers: {
          "api-key": this.API_KEY,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get account info: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to get account info:", error)
      throw new Error(`Failed to get account info: ${error}`)
    }
  }
}
