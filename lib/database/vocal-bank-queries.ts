import { db } from "./connection"
import { vocalSampleBank } from "@/shared/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import type { InsertVocalBank } from "@/shared/schema"

export class VocalBankQueries {
  // Get approved vocal samples with rotation
  static async getApprovedSamples(limit = 50, offset = 0) {
    try {
      const samples = await db
        .select({
          id: vocalSampleBank.id,
          anonymousName: vocalSampleBank.anonymousName,
          publicUrl: vocalSampleBank.publicUrl,
          duration: vocalSampleBank.duration,
          characteristics: vocalSampleBank.characteristics,
          tags: vocalSampleBank.tags,
          usageCount: vocalSampleBank.usageCount,
          quality: vocalSampleBank.quality,
          createdAt: vocalSampleBank.createdAt,
        })
        .from(vocalSampleBank)
        .where(and(eq(vocalSampleBank.isApproved, true), eq(vocalSampleBank.isActive, true)))
        .orderBy(desc(vocalSampleBank.usageCount), desc(vocalSampleBank.createdAt))
        .limit(limit)
        .offset(offset)

      return samples
    } catch (error) {
      console.error("Error fetching approved samples:", error)
      throw new Error("Failed to fetch vocal samples")
    }
  }

  // Get samples by filter
  static async getSamplesByFilter(filter: string, value: string, limit = 20) {
    try {
      let whereCondition = and(eq(vocalSampleBank.isApproved, true), eq(vocalSampleBank.isActive, true))

      if (filter === "gender") {
        whereCondition = and(whereCondition, sql`${vocalSampleBank.characteristics}->>'gender' = ${value}`)
      } else if (filter === "style") {
        whereCondition = and(whereCondition, sql`${vocalSampleBank.characteristics}->>'style' = ${value}`)
      } else if (filter === "genre") {
        whereCondition = and(whereCondition, sql`${vocalSampleBank.tags} ? ${value}`)
      }

      const samples = await db
        .select({
          id: vocalSampleBank.id,
          anonymousName: vocalSampleBank.anonymousName,
          publicUrl: vocalSampleBank.publicUrl,
          duration: vocalSampleBank.duration,
          characteristics: vocalSampleBank.characteristics,
          tags: vocalSampleBank.tags,
          usageCount: vocalSampleBank.usageCount,
          quality: vocalSampleBank.quality,
        })
        .from(vocalSampleBank)
        .where(whereCondition)
        .orderBy(desc(vocalSampleBank.usageCount))
        .limit(limit)

      return samples
    } catch (error) {
      console.error("Error fetching filtered samples:", error)
      throw new Error("Failed to fetch filtered samples")
    }
  }

  // Insert new vocal sample
  static async insertVocalSample(sampleData: InsertVocalBank) {
    try {
      const [newSample] = await db.insert(vocalSampleBank).values(sampleData).returning()
      return newSample
    } catch (error) {
      console.error("Error inserting vocal sample:", error)
      throw new Error("Failed to save vocal sample")
    }
  }

  // Update usage count
  static async incrementUsageCount(sampleId: number) {
    try {
      await db
        .update(vocalSampleBank)
        .set({
          usageCount: sql`${vocalSampleBank.usageCount} + 1`,
        })
        .where(eq(vocalSampleBank.id, sampleId))
    } catch (error) {
      console.error("Error updating usage count:", error)
    }
  }

  // Get pending samples for moderation
  static async getPendingSamples(limit = 20) {
    try {
      const samples = await db
        .select({
          id: vocalSampleBank.id,
          anonymousName: vocalSampleBank.anonymousName,
          publicUrl: vocalSampleBank.publicUrl,
          duration: vocalSampleBank.duration,
          characteristics: vocalSampleBank.characteristics,
          tags: vocalSampleBank.tags,
          quality: vocalSampleBank.quality,
          createdAt: vocalSampleBank.createdAt,
          uploadedBy: vocalSampleBank.uploadedBy,
        })
        .from(vocalSampleBank)
        .where(and(eq(vocalSampleBank.isApproved, false), eq(vocalSampleBank.isActive, true)))
        .orderBy(desc(vocalSampleBank.createdAt))
        .limit(limit)

      return samples
    } catch (error) {
      console.error("Error fetching pending samples:", error)
      throw new Error("Failed to fetch pending samples")
    }
  }

  // Approve/reject sample
  static async moderateSample(sampleId: number, approved: boolean, moderatorId: string) {
    try {
      await db
        .update(vocalSampleBank)
        .set({
          isApproved: approved,
          isActive: approved,
          approvedAt: approved ? new Date() : null,
        })
        .where(eq(vocalSampleBank.id, sampleId))

      return true
    } catch (error) {
      console.error("Error moderating sample:", error)
      throw new Error("Failed to moderate sample")
    }
  }

  // Get user's uploaded samples
  static async getUserSamples(userId: string) {
    try {
      const samples = await db
        .select({
          id: vocalSampleBank.id,
          anonymousName: vocalSampleBank.anonymousName,
          duration: vocalSampleBank.duration,
          quality: vocalSampleBank.quality,
          isApproved: vocalSampleBank.isApproved,
          usageCount: vocalSampleBank.usageCount,
          createdAt: vocalSampleBank.createdAt,
        })
        .from(vocalSampleBank)
        .where(eq(vocalSampleBank.uploadedBy, userId))
        .orderBy(desc(vocalSampleBank.createdAt))

      return samples
    } catch (error) {
      console.error("Error fetching user samples:", error)
      throw new Error("Failed to fetch user samples")
    }
  }
}
