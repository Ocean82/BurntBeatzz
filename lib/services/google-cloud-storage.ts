import { Storage } from "@google-cloud/storage"
import { env } from "../config/env"

// Validate Google Cloud configuration
if (!env.GOOGLE_CLOUD_PROJECT_ID) {
  throw new Error("GOOGLE_CLOUD_PROJECT_ID environment variable is required")
}

if (!env.GOOGLE_CLOUD_BUCKET_NAME) {
  throw new Error("GOOGLE_CLOUD_BUCKET_NAME environment variable is required")
}

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: env.GOOGLE_CLOUD_KEY_FILE || undefined,
})

const bucket = storage.bucket(env.GOOGLE_CLOUD_BUCKET_NAME)

export class GoogleCloudStorageService {
  // Upload file to Google Cloud Storage
  static async uploadFile(fileName: string, fileBuffer: Buffer, contentType?: string, folder?: string) {
    try {
      const fullPath = folder ? `${folder}/${fileName}` : fileName
      const file = bucket.file(fullPath)

      const stream = file.createWriteStream({
        metadata: {
          contentType: contentType || "application/octet-stream",
        },
        resumable: false,
      })

      return new Promise<string>((resolve, reject) => {
        stream.on("error", (error) => {
          reject(new Error(`Upload failed: ${error.message}`))
        })

        stream.on("finish", () => {
          const publicUrl = `https://storage.googleapis.com/${env.GOOGLE_CLOUD_BUCKET_NAME}/${fullPath}`
          resolve(publicUrl)
        })

        stream.end(fileBuffer)
      })
    } catch (error) {
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Download file from Google Cloud Storage
  static async downloadFile(fileName: string, folder?: string): Promise<Buffer> {
    try {
      const fullPath = folder ? `${folder}/${fileName}` : fileName
      const file = bucket.file(fullPath)

      const [fileBuffer] = await file.download()
      return fileBuffer
    } catch (error) {
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Delete file from Google Cloud Storage
  static async deleteFile(fileName: string, folder?: string) {
    try {
      const fullPath = folder ? `${folder}/${fileName}` : fileName
      const file = bucket.file(fullPath)

      await file.delete()
      return { success: true, message: "File deleted successfully" }
    } catch (error) {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // List files in bucket
  static async listFiles(folder?: string) {
    try {
      const options = folder ? { prefix: `${folder}/` } : {}
      const [files] = await bucket.getFiles(options)

      return files.map((file) => ({
        name: file.name,
        size: file.metadata.size,
        updated: file.metadata.updated,
        contentType: file.metadata.contentType,
        publicUrl: `https://storage.googleapis.com/${env.GOOGLE_CLOUD_BUCKET_NAME}/${file.name}`,
      }))
    } catch (error) {
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Check if file exists
  static async fileExists(fileName: string, folder?: string): Promise<boolean> {
    try {
      const fullPath = folder ? `${folder}/${fileName}` : fileName
      const file = bucket.file(fullPath)
      const [exists] = await file.exists()
      return exists
    } catch (error) {
      return false
    }
  }

  // Get storage health status
  static async getStorageHealth() {
    try {
      const [metadata] = await bucket.getMetadata()
      return {
        success: true,
        bucketName: env.GOOGLE_CLOUD_BUCKET_NAME,
        location: metadata.location,
        storageClass: metadata.storageClass,
        created: metadata.timeCreated,
        projectId: env.GOOGLE_CLOUD_PROJECT_ID,
      }
    } catch (error) {
      throw new Error(`Storage health check failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
}

export default GoogleCloudStorageService
