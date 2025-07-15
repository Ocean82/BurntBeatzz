import { StripeService } from "./stripe-service"
import { GoogleCloudStorageService } from "./google-cloud-storage"
import { db } from "../database/connection"

export interface ContestEntry {
  id: string
  songId: string
  userId: string
  title: string
  artist: string
  genre: string
  audioUrl: string
  generationMetadata: {
    generatedAt: string
    aiProvider: string
    generationId: string
    voiceCloneUsed: boolean
    platformGenerated: true
  }
  votes: number
  plays: number
  score: number
  submittedAt: string
  verified: boolean
  disqualified: boolean
  disqualificationReason?: string
}

export interface PrizeDistribution {
  contestId: string
  totalPool: number
  winners: {
    rank: number
    userId: string
    songId: string
    amount: number
    payoutStatus: "pending" | "processing" | "completed" | "failed"
    payoutId?: string
    payoutDate?: string
  }[]
  communityPrizes: {
    userId: string
    amount: number
    reason: string
    payoutStatus: "pending" | "processing" | "completed" | "failed"
  }[]
}

export class PrizePoolService {
  // Verify song was generated on platform
  static async verifySongGeneration(songId: string): Promise<boolean> {
    try {
      // Check database for generation record
      const song = await db.songs.findUnique({
        where: { id: songId },
        include: {
          generationLog: true,
          voiceCloning: true,
        },
      })

      if (!song) {
        console.log(`❌ Song ${songId} not found in database`)
        return false
      }

      // Must have generation metadata
      if (!song.generationLog || !song.generationLog.generatedAt) {
        console.log(`❌ Song ${songId} missing generation metadata`)
        return false
      }

      // Check if generated within contest period
      const contestStartDate = new Date("2024-01-01") // Current contest start
      if (new Date(song.generationLog.generatedAt) < contestStartDate) {
        console.log(`❌ Song ${songId} generated before contest period`)
        return false
      }

      // Verify AI generation fingerprint
      const hasValidFingerprint = await this.verifyAIFingerprint(song)
      if (!hasValidFingerprint) {
        console.log(`❌ Song ${songId} failed AI fingerprint verification`)
        return false
      }

      console.log(`✅ Song ${songId} verified as platform-generated`)
      return true
    } catch (error) {
      console.error(`Error verifying song generation:`, error)
      return false
    }
  }

  // Verify AI generation fingerprint
  private static async verifyAIFingerprint(song: any): Promise<boolean> {
    try {
      // Check for AI generation markers in metadata
      const requiredMarkers = ["aiProvider", "generationId", "modelVersion", "generationTimestamp"]

      const metadata = song.generationLog.metadata
      const hasAllMarkers = requiredMarkers.every((marker) => metadata[marker])

      if (!hasAllMarkers) {
        return false
      }

      // Verify generation ID format matches our system
      const generationIdPattern = /^gen_[a-zA-Z0-9]{16}_\d{13}$/
      if (!generationIdPattern.test(metadata.generationId)) {
        return false
      }

      // Check audio file for embedded watermark
      const audioBuffer = await GoogleCloudStorageService.downloadFile(song.audioUrl)
      const hasWatermark = await this.detectAudioWatermark(audioBuffer)

      return hasWatermark
    } catch (error) {
      console.error("Error verifying AI fingerprint:", error)
      return false
    }
  }

  // Detect embedded audio watermark
  private static async detectAudioWatermark(audioBuffer: Buffer): Promise<boolean> {
    try {
      // Convert buffer to frequency domain for watermark detection
      // This would use a real audio processing library like node-fft

      // Check for our unique frequency signature at specific intervals
      const watermarkFrequencies = [440, 880, 1320] // Hz
      const expectedPattern = "BURNT_BEATS_AI_GEN"

      // Simplified watermark detection (in production, use proper audio analysis)
      const audioString = audioBuffer.toString("hex")
      const hasWatermark = audioString.includes(Buffer.from(expectedPattern).toString("hex"))

      return hasWatermark
    } catch (error) {
      console.error("Error detecting audio watermark:", error)
      return false
    }
  }

  // Calculate final contest results
  static async calculateContestResults(contestId: string): Promise<PrizeDistribution> {
    try {
      console.log(`🏆 Calculating contest results for ${contestId}`)

      // Get all verified entries
      const entries = await db.contestEntries.findMany({
        where: {
          contestId,
          verified: true,
          disqualified: false,
        },
        include: {
          song: true,
          user: true,
          votes: true,
        },
      })

      // Calculate scores (weighted algorithm)
      const scoredEntries = entries.map((entry) => ({
        ...entry,
        score: this.calculateEntryScore(entry),
      }))

      // Sort by score (highest first)
      const rankedEntries = scoredEntries.sort((a, b) => b.score - a.score)

      // Get current prize pool
      const prizePool = await this.getCurrentPrizePool(contestId)

      // Calculate prize distribution
      const winners = [
        {
          rank: 1,
          userId: rankedEntries[0]?.userId || "",
          songId: rankedEntries[0]?.songId || "",
          amount: Math.floor(prizePool.total * 0.6), // 60% to first
          payoutStatus: "pending" as const,
        },
        {
          rank: 2,
          userId: rankedEntries[1]?.userId || "",
          songId: rankedEntries[1]?.songId || "",
          amount: Math.floor(prizePool.total * 0.24), // 24% to second
          payoutStatus: "pending" as const,
        },
        {
          rank: 3,
          userId: rankedEntries[2]?.userId || "",
          songId: rankedEntries[2]?.songId || "",
          amount: Math.floor(prizePool.total * 0.12), // 12% to third
          payoutStatus: "pending" as const,
        },
      ].filter((winner) => winner.userId) // Only include if we have enough entries

      // Community prizes (top 10 get small amounts)
      const communityPrizes = rankedEntries.slice(3, 13).map((entry, index) => ({
        userId: entry.userId,
        amount: Math.floor(prizePool.total * 0.004), // 0.4% each
        reason: `Top ${index + 4} Community Prize`,
        payoutStatus: "pending" as const,
      }))

      const distribution: PrizeDistribution = {
        contestId,
        totalPool: prizePool.total,
        winners,
        communityPrizes,
      }

      // Save results to database
      await db.contestResults.create({
        data: {
          contestId,
          results: distribution,
          calculatedAt: new Date(),
          status: "calculated",
        },
      })

      console.log(
        `✅ Contest results calculated: ${winners.length} winners, ${communityPrizes.length} community prizes`,
      )
      return distribution
    } catch (error) {
      console.error("Error calculating contest results:", error)
      throw error
    }
  }

  // Calculate entry score using weighted algorithm
  private static calculateEntryScore(entry: any): number {
    const weights = {
      votes: 0.4, // 40% - Community voting
      plays: 0.3, // 30% - Engagement/popularity
      quality: 0.2, // 20% - AI quality metrics
      recency: 0.1, // 10% - Submission timing bonus
    }

    const maxVotes = 1000 // Normalize against max possible
    const maxPlays = 5000
    const maxQuality = 100

    const voteScore = Math.min(entry.votes / maxVotes, 1) * weights.votes * 100
    const playScore = Math.min(entry.plays / maxPlays, 1) * weights.plays * 100
    const qualityScore = ((entry.song.qualityScore || 80) / maxQuality) * weights.quality * 100

    // Recency bonus - earlier submissions get slight bonus
    const submissionDate = new Date(entry.submittedAt)
    const contestStart = new Date("2024-01-01")
    const daysSinceStart = Math.floor((submissionDate.getTime() - contestStart.getTime()) / (1000 * 60 * 60 * 24))
    const recencyScore = Math.max(0, (30 - daysSinceStart) / 30) * weights.recency * 100

    return voteScore + playScore + qualityScore + recencyScore
  }

  // Process prize payouts
  static async processPayouts(distribution: PrizeDistribution): Promise<void> {
    try {
      console.log(`💰 Processing payouts for contest ${distribution.contestId}`)

      // Process winner payouts
      for (const winner of distribution.winners) {
        try {
          await this.processIndividualPayout(winner.userId, winner.amount, `Contest Winner - Rank ${winner.rank}`)

          // Update payout status
          await db.contestResults.update({
            where: { contestId: distribution.contestId },
            data: {
              [`winners.${winner.rank - 1}.payoutStatus`]: "completed",
              [`winners.${winner.rank - 1}.payoutDate`]: new Date().toISOString(),
            },
          })

          console.log(`✅ Payout completed for rank ${winner.rank}: $${winner.amount}`)
        } catch (error) {
          console.error(`❌ Payout failed for rank ${winner.rank}:`, error)

          await db.contestResults.update({
            where: { contestId: distribution.contestId },
            data: {
              [`winners.${winner.rank - 1}.payoutStatus`]: "failed",
            },
          })
        }
      }

      // Process community prizes
      for (const communityPrize of distribution.communityPrizes) {
        try {
          await this.processIndividualPayout(communityPrize.userId, communityPrize.amount, communityPrize.reason)
          console.log(`✅ Community payout completed: $${communityPrize.amount}`)
        } catch (error) {
          console.error(`❌ Community payout failed:`, error)
        }
      }

      console.log(`🎉 All payouts processed for contest ${distribution.contestId}`)
    } catch (error) {
      console.error("Error processing payouts:", error)
      throw error
    }
  }

  // Process individual payout
  private static async processIndividualPayout(userId: string, amount: number, description: string): Promise<void> {
    try {
      // Get user's payout information
      const user = await db.users.findUnique({
        where: { id: userId },
        include: { payoutInfo: true },
      })

      if (!user || !user.payoutInfo) {
        throw new Error(`User ${userId} missing payout information`)
      }

      // Create Stripe transfer to user's connected account
      const transfer = await StripeService.createTransfer({
        amount: Math.floor(amount * 100), // Convert to cents
        currency: "usd",
        destination: user.payoutInfo.stripeAccountId,
        description: `Burnt Beats Contest Prize: ${description}`,
        metadata: {
          userId,
          contestPrize: "true",
          amount: amount.toString(),
        },
      })

      // Record payout in database
      await db.payouts.create({
        data: {
          userId,
          amount,
          description,
          stripeTransferId: transfer.id,
          status: "completed",
          processedAt: new Date(),
        },
      })

      // Send notification to user
      await this.sendPayoutNotification(userId, amount, description)
    } catch (error) {
      console.error(`Error processing individual payout for user ${userId}:`, error)
      throw error
    }
  }

  // Send payout notification
  private static async sendPayoutNotification(userId: string, amount: number, description: string): Promise<void> {
    try {
      // Send email notification
      await this.sendEmail({
        to: userId,
        subject: "🎉 Contest Prize Payout - Burnt Beats",
        template: "contest-payout",
        data: {
          amount,
          description,
          payoutDate: new Date().toLocaleDateString(),
        },
      })

      // Send push notification if enabled
      await this.sendPushNotification(userId, {
        title: "🏆 Prize Won!",
        body: `Congratulations! You've received $${amount} for ${description}`,
        icon: "/icons/trophy.png",
      })
    } catch (error) {
      console.error("Error sending payout notification:", error)
    }
  }

  // Get current prize pool
  private static async getCurrentPrizePool(contestId: string): Promise<{ total: number }> {
    const contest = await db.contests.findUnique({
      where: { id: contestId },
      include: {
        entries: true,
        donations: true,
      },
    })

    if (!contest) {
      throw new Error(`Contest ${contestId} not found`)
    }

    const basePool = 500 // Guaranteed base
    const entryFees = contest.entries.length * 5 // $5 per entry
    const donations = contest.donations.reduce((sum, donation) => sum + donation.amount, 0)

    return {
      total: basePool + entryFees + donations,
    }
  }

  // Placeholder methods (implement with your email/push services)
  private static async sendEmail(params: any): Promise<void> {
    console.log("📧 Sending email:", params)
  }

  private static async sendPushNotification(userId: string, notification: any): Promise<void> {
    console.log("📱 Sending push notification:", notification)
  }
}
