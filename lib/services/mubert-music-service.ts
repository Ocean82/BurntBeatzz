// Mubert AI Music Generation Service
interface MubertTrack {
  track_id: string
  download_link: string
  status: "processing" | "ready" | "error"
  duration: number
}

interface MusicGenerationRequest {
  prompt: string
  duration: number // in seconds
  format?: "wav" | "mp3"
  mood?: string
  genre?: string
  tempo?: "slow" | "medium" | "fast"
}

export class MubertService {
  private static readonly BASE_URL = "https://api-b2b.mubert.com/v2"
  private static readonly API_KEY = process.env.MUBERT_API_KEY!
  private static readonly EMAIL = process.env.MUBERT_EMAIL!

  // Generate music track
  static async generateMusic(request: MusicGenerationRequest): Promise<MubertTrack> {
    try {
      // First, get access token
      const token = await this.getAccessToken()

      // Create generation request
      const response = await fetch(`${this.BASE_URL}/GetTrackByTags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "GetTrackByTags",
          params: {
            pat: token,
            tags: this.buildTags(request),
            duration: request.duration,
            format: request.format || "wav",
            bitrate: 320,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Mubert API error: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(`Mubert error: ${result.error}`)
      }

      return {
        track_id: result.data.id,
        download_link: result.data.download_link,
        status: "ready",
        duration: request.duration,
      }
    } catch (error) {
      console.error("Mubert music generation failed:", error)
      throw new Error(`Music generation failed: ${error}`)
    }
  }

  // Generate music with custom prompt
  static async generateWithPrompt(prompt: string, duration: number): Promise<MubertTrack> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${this.BASE_URL}/RecordTrack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "RecordTrack",
          params: {
            pat: token,
            mode: "track",
            prompt: prompt,
            duration: duration,
            format: "wav",
            bitrate: 320,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Mubert API error: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(`Mubert error: ${result.error}`)
      }

      // Poll for completion
      return await this.pollTrackStatus(result.data.id, token)
    } catch (error) {
      console.error("Mubert prompt generation failed:", error)
      throw new Error(`Prompt generation failed: ${error}`)
    }
  }

  // Get access token
  private static async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(`${this.BASE_URL}/GetServiceAccess`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "GetServiceAccess",
          params: {
            email: this.EMAIL,
            license: this.API_KEY,
            token: this.API_KEY,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to get Mubert token: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(`Mubert auth error: ${result.error}`)
      }

      return result.data.pat
    } catch (error) {
      console.error("Mubert authentication failed:", error)
      throw new Error(`Authentication failed: ${error}`)
    }
  }

  // Build tags from request
  private static buildTags(request: MusicGenerationRequest): string {
    const tags = []

    if (request.genre) tags.push(request.genre.toLowerCase())
    if (request.mood) tags.push(request.mood.toLowerCase())
    if (request.tempo) tags.push(request.tempo)

    // Add default tags if none provided
    if (tags.length === 0) {
      tags.push("electronic", "upbeat")
    }

    return tags.join(",")
  }

  // Poll track status until ready
  private static async pollTrackStatus(trackId: string, token: string): Promise<MubertTrack> {
    const maxAttempts = 30 // 5 minutes max
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.BASE_URL}/CheckTrack`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method: "CheckTrack",
            params: {
              pat: token,
              id: trackId,
            },
          }),
        })

        const result = await response.json()

        if (result.data.status === "ready") {
          return {
            track_id: trackId,
            download_link: result.data.download_link,
            status: "ready",
            duration: result.data.duration || 0,
          }
        }

        if (result.data.status === "error") {
          throw new Error("Track generation failed")
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

  // Download track
  static async downloadTrack(downloadLink: string): Promise<Buffer> {
    try {
      const response = await fetch(downloadLink)

      if (!response.ok) {
        throw new Error(`Failed to download track: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error("Track download failed:", error)
      throw new Error(`Track download failed: ${error}`)
    }
  }
}
