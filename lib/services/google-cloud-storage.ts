import { Storage } from "@google-cloud/storage"

interface UploadOptions {
  destination: string
  metadata?: Record<string, any>
  makePublic?: boolean
}

interface UploadResult {
  fileName: string
  publicUrl: string
  gsUrl: string
  metadata: Record<string, any>
}

export class GoogleCloudStorageService {
  private storage: Storage
  private bucketName: string

  constructor() {
    // Initialize Google Cloud Storage
    this.storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    })

    this.bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || process.env.burnt_beats_bucket || "burnt-beats-storage"
  }

  /**
   * Upload a file to Google Cloud Storage
   */
  async uploadFile(fileBuffer: Buffer, fileName: string, options: UploadOptions): Promise<UploadResult> {
    try {
      const bucket = this.storage.bucket(this.bucketName)
      const file = bucket.file(options.destination || fileName)

      // Upload the file
      await file.save(fileBuffer, {
        metadata: {
          contentType: this.getContentType(fileName),
          metadata: options.metadata || {},
        },
        public: options.makePublic || false,
      })

      // Make public if requested
      if (options.makePublic) {
        await file.makePublic()
      }

      const publicUrl = options.makePublic
        ? `https://storage.googleapis.com/${this.bucketName}/${options.destination || fileName}`
        : await this.getSignedUrl(options.destination || fileName)

      return {
        fileName: options.destination || fileName,
        publicUrl,
        gsUrl: `gs://${this.bucketName}/${options.destination || fileName}`,
        metadata: options.metadata || {},
      }
    } catch (error) {
      console.error("Upload error:", error)
      throw new Error(`Failed to upload file: ${error}`)
    }
  }

  /**
   * Upload voice sample
   */
  async uploadVoiceSample(
    audioBuffer: Buffer,
    userId: string,
    fileName: string,
    metadata?: Record<string, any>,
  ): Promise<UploadResult> {
    const destination = `voice-samples/${userId}/${Date.now()}-${fileName}`

    return this.uploadFile(audioBuffer, fileName, {
      destination,
      metadata: {
        type: "voice-sample",
        userId,
        uploadedAt: new Date().toISOString(),
        ...metadata,
      },
      makePublic: false, // Voice samples are private
    })
  }

  /**
   * Upload generated song
   */
  async uploadGeneratedSong(
    audioBuffer: Buffer,
    userId: string,
    songId: string,
    fileName: string,
    metadata?: Record<string, any>,
  ): Promise<UploadResult> {
    const destination = `songs/${userId}/${songId}/${fileName}`

    return this.uploadFile(audioBuffer, fileName, {
      destination,
      metadata: {
        type: "generated-song",
        userId,
        songId,
        generatedAt: new Date().toISOString(),
        ...metadata,
      },
      makePublic: false, // Songs are private until purchased
    })
  }

  /**
   * Upload song stems (individual tracks)
   */
  async uploadSongStems(
    stemsData: Record<string, Buffer>,
    userId: string,
    songId: string,
  ): Promise<Record<string, UploadResult>> {
    const results: Record<string, UploadResult> = {}

    for (const [stemType, buffer] of Object.entries(stemsData)) {
      const fileName = `${stemType}.wav`
      const destination = `songs/${userId}/${songId}/stems/${fileName}`

      results[stemType] = await this.uploadFile(buffer, fileName, {
        destination,
        metadata: {
          type: "song-stem",
          stemType,
          userId,
          songId,
          generatedAt: new Date().toISOString(),
        },
        makePublic: false,
      })
    }

    return results
  }

  /**
   * Get signed URL for private file access
   */
  async getSignedUrl(fileName: string, expiresInMinutes = 60): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName)
      const file = bucket.file(fileName)

      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + expiresInMinutes * 60 * 1000,
      })

      return signedUrl
    } catch (error) {
      console.error("Signed URL error:", error)
      throw new Error(`Failed to get signed URL: ${error}`)
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName)
      const file = bucket.file(fileName)

      await file.delete()
    } catch (error) {
      console.error("Delete error:", error)
      throw new Error(`Failed to delete file: ${error}`)
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(prefix: string): Promise<string[]> {
    try {
      const bucket = this.storage.bucket(this.bucketName)
      const [files] = await bucket.getFiles({ prefix })

      return files.map((file) => file.name)
    } catch (error) {
      console.error("List files error:", error)
      throw new Error(`Failed to list files: ${error}`)
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileName: string): Promise<any> {
    try {
      const bucket = this.storage.bucket(this.bucketName)
      const file = bucket.file(fileName)
      const [metadata] = await file.getMetadata()

      return metadata
    } catch (error) {
      console.error("Metadata error:", error)
      throw new Error(`Failed to get file metadata: ${error}`)
    }
  }

  /**
   * Generate different quality versions of audio
   */
  async uploadMultipleQualities(
    originalBuffer: Buffer,
    userId: string,
    songId: string,
    baseName: string,
  ): Promise<Record<string, UploadResult>> {
    const qualities = {
      demo: { quality: "128k", watermark: true },
      standard: { quality: "320k", watermark: false },
      high: { quality: "wav", watermark: false },
      ultra: { quality: "flac", watermark: false },
    }

    const results: Record<string, UploadResult> = {}

    for (const [tier, config] of Object.entries(qualities)) {
      // In a real implementation, you'd convert the audio quality here
      // For now, we'll simulate by using the original buffer
      const fileName = `${baseName}-${tier}.${config.quality === "wav" ? "wav" : config.quality === "flac" ? "flac" : "mp3"}`
      const destination = `songs/${userId}/${songId}/${tier}/${fileName}`

      results[tier] = await this.uploadFile(originalBuffer, fileName, {
        destination,
        metadata: {
          type: "song-quality-variant",
          tier,
          quality: config.quality,
          hasWatermark: config.watermark,
          userId,
          songId,
          generatedAt: new Date().toISOString(),
        },
        makePublic: false,
      })
    }

    return results
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(fileName: string): string {
    const ext = fileName.toLowerCase().split(".").pop()

    const contentTypes: Record<string, string> = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      flac: "audio/flac",
      ogg: "audio/ogg",
      webm: "audio/webm",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      json: "application/json",
      txt: "text/plain",
    }

    return contentTypes[ext || ""] || "application/octet-stream"
  }

  /**
   * Clean up old files (for maintenance)
   */
  async cleanupOldFiles(olderThanDays = 30): Promise<number> {
    try {
      const bucket = this.storage.bucket(this.bucketName)
      const [files] = await bucket.getFiles()

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      let deletedCount = 0

      for (const file of files) {
        const [metadata] = await file.getMetadata()
        const createdDate = new Date(metadata.timeCreated)

        if (createdDate < cutoffDate && metadata.metadata?.type === "temporary") {
          await file.delete()
          deletedCount++
        }
      }

      return deletedCount
    } catch (error) {
      console.error("Cleanup error:", error)
      throw new Error(`Failed to cleanup files: ${error}`)
    }
  }
}

// Export singleton instance
export const cloudStorage = new GoogleCloudStorageService()
