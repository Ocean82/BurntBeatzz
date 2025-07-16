import rateLimit from "express-rate-limit"

// Rate limiting for uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 uploads per 15 minutes
  message: "Too many uploads, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
})

export class UploadValidation {
  // Validate file upload
  static async validateUpload(
    file: File,
    userId: string,
  ): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      errors.push("File size must be less than 50MB")
    }

    // Check file type
    const allowedTypes = [
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/m4a",
      "audio/aac",
      "audio/ogg",
      "audio/webm",
    ]

    if (!allowedTypes.includes(file.type)) {
      errors.push("Unsupported file type. Please use WAV, MP3, M4A, or AAC")
    }

    // Check filename
    if (file.name.length > 100) {
      errors.push("Filename too long")
    }

    // Check for suspicious content in filename
    const suspiciousPatterns = [/[<>:"/\\|?*]/, /\.(exe|bat|cmd|scr|pif|com)$/i]
    if (suspiciousPatterns.some((pattern) => pattern.test(file.name))) {
      errors.push("Invalid filename")
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  // Content moderation check
  static async moderateContent(
    audioBuffer: Buffer,
    metadata: any,
  ): Promise<{
    approved: boolean
    flags: string[]
    confidence: number
  }> {
    const flags: string[] = []
    let confidence = 0.8

    // Basic content checks
    if (metadata.duration < 3) {
      flags.push("too_short")
      confidence -= 0.2
    }

    if (metadata.quality === "poor") {
      flags.push("low_quality")
      confidence -= 0.1
    }

    // In production, integrate with content moderation APIs
    // - Google Cloud Video Intelligence API
    // - AWS Rekognition
    // - Azure Content Moderator
    // - Custom ML models for audio content

    const approved = flags.length === 0 && confidence > 0.6

    return {
      approved,
      flags,
      confidence,
    }
  }

  // Check user upload limits
  static async checkUploadLimits(userId: string): Promise<{
    canUpload: boolean
    reason?: string
    resetTime?: Date
  }> {
    // In production, check database for user's upload history
    // For now, return basic limits

    const dailyLimit = 10
    const monthlyLimit = 100

    // Mock check - implement real database queries
    const todayUploads = 0 // await getUserUploadsToday(userId)
    const monthUploads = 0 // await getUserUploadsThisMonth(userId)

    if (todayUploads >= dailyLimit) {
      return {
        canUpload: false,
        reason: "Daily upload limit reached",
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }
    }

    if (monthUploads >= monthlyLimit) {
      return {
        canUpload: false,
        reason: "Monthly upload limit reached",
        resetTime: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      }
    }

    return { canUpload: true }
  }
}
