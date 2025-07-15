import { type NextRequest, NextResponse } from "next/server"
import { VocalBankService } from "@/lib/services/vocal-bank-service"
import { AudioAnalysisService } from "@/lib/services/audio-analysis-service"
import { UploadValidation } from "@/lib/middleware/upload-validation"
import { VocalBankQueries } from "@/lib/database/vocal-bank-queries"
import { cloudStorage } from "@/lib/services/google-cloud-storage"
import { requireAuth } from "@/lib/middleware/auth-middleware"
import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const { user } = authResult

  try {
    const formData = await request.formData()
    const audio = formData.get("audio") as File
    const agreedToShare = formData.get("agreedToShare") === "true"

    if (!audio) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
    }

    if (!agreedToShare) {
      return NextResponse.json({ error: "Must agree to share vocal sample with community" }, { status: 400 })
    }

    // Check upload limits
    const limitCheck = await UploadValidation.checkUploadLimits(user.id)
    if (!limitCheck.canUpload) {
      return NextResponse.json({ error: limitCheck.reason }, { status: 429 })
    }

    // Validate file upload
    const validation = await UploadValidation.validateUpload(audio, user.id)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join(", ") }, { status: 400 })
    }

    // Save file temporarily for analysis
    const tempDir = "/tmp"
    const tempFileName = `${uuidv4()}.${audio.name.split(".").pop()}`
    const tempFilePath = path.join(tempDir, tempFileName)

    const arrayBuffer = await audio.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await fs.writeFile(tempFilePath, buffer)

    try {
      // Analyze audio file
      const audioAnalysis = await AudioAnalysisService.analyzeAudioFile(tempFilePath)

      // Validate audio content
      const audioValidation = await AudioAnalysisService.validateAudioFile(tempFilePath)
      if (!audioValidation.isValid) {
        return NextResponse.json({ error: audioValidation.errors.join(", ") }, { status: 400 })
      }

      // Convert to standard format if needed
      const standardFilePath = path.join(tempDir, `${uuidv4()}.wav`)
      await AudioAnalysisService.convertToStandardFormat(tempFilePath, standardFilePath)

      // Read converted file
      const standardBuffer = await fs.readFile(standardFilePath)

      // Content moderation
      const moderation = await UploadValidation.moderateContent(standardBuffer, audioAnalysis)

      // Generate anonymous name and tags
      const anonymousName = VocalBankService.generateAnonymousName()
      const tags = VocalBankService.generateTags(audioAnalysis.characteristics)

      // Upload to cloud storage
      const fileName = `vocal-bank/${anonymousName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.wav`
      const uploadResult = await cloudStorage.uploadVoiceSample(standardBuffer, "vocal-bank", fileName, {
        anonymousName,
        uploadedBy: user.id,
        characteristics: audioAnalysis.characteristics,
        tags,
        quality: audioAnalysis.quality,
      })

      // Save to database
      const vocalSample = await VocalBankQueries.insertVocalSample({
        uploadedBy: user.id,
        anonymousName,
        filePath: fileName,
        gsUrl: uploadResult.gsUrl,
        publicUrl: uploadResult.publicUrl,
        duration: audioAnalysis.duration,
        sampleRate: audioAnalysis.sampleRate,
        characteristics: audioAnalysis.characteristics,
        tags,
        quality: audioAnalysis.quality,
        isApproved: moderation.approved,
        isActive: true,
        usageCount: 0,
      })

      // Clean up temp files
      await fs.unlink(tempFilePath).catch(() => {})
      await fs.unlink(standardFilePath).catch(() => {})

      const message = moderation.approved
        ? `🎤 Vocal sample "${anonymousName}" uploaded and approved!`
        : `🎤 Vocal sample "${anonymousName}" uploaded and pending review.`

      return NextResponse.json({
        success: true,
        sample: {
          id: vocalSample.id,
          anonymousName: vocalSample.anonymousName,
          quality: vocalSample.quality,
          isApproved: vocalSample.isApproved,
          duration: vocalSample.duration,
        },
        message,
        warnings: audioValidation.warnings,
      })
    } finally {
      // Ensure temp files are cleaned up
      await fs.unlink(tempFilePath).catch(() => {})
    }
  } catch (error) {
    console.error("Vocal bank upload error:", error)
    return NextResponse.json({ error: "Failed to upload vocal sample" }, { status: 500 })
  }
}
