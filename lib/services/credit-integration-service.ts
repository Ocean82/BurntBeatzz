import { db } from "../database/connection"
import { PricingServiceV2 } from "./pricing-service-v2"

export interface ContestCycle {
  id: string
  startDate: string
  endDate: string
  status: "upcoming" | "active" | "ended" | "archived"
  totalPrizePool: number
  participantCount: number
  winnersAnnounced: boolean
  resetDate: string
}

export interface CreditSettings {
  maxCreditsPerUser: number
  creditExpirationDays: number
  dailyEarningLimit: number
  monthlyEarningLimit: number
  minCreditBalance: number
  creditToCashRatio: number
}

export class CreditIntegrationService {
  // Credit system settings - ALIGNED WITH PAY-PER-DOWNLOAD MODEL
  private static readonly CREDIT_SETTINGS: CreditSettings = {
    maxCreditsPerUser: 5000,
    creditExpirationDays: 365, // 1 year expiration
    dailyEarningLimit: 50,
    monthlyEarningLimit: 1000,
    minCreditBalance: 0,
    creditToCashRatio: 100, // 100 credits = $1 USD (for easy conversion)
  }

  // AUTOMATIC CREDIT DISTRIBUTION - happens immediately after contests
  static async distributeContestCreditsAutomatically(): Promise<void> {
    try {
      console.log("🏆 Starting automatic credit distribution...")

      const currentContest = await this.getCurrentContestCycle()
      if (!currentContest || currentContest.status !== "ended") {
        console.log("No contest ready for credit distribution")
        return
      }

      const topSongs = await db.songs.findMany({
        orderBy: [{ likes: "desc" }, { playCount: "desc" }, { rating: "desc" }],
        take: 10,
        include: {
          user: true,
        },
      })

      if (topSongs.length === 0) {
        console.log("No songs found for contest")
        return
      }

      const winners = topSongs.map((song, index) => ({
        userId: song.userId,
        songId: song.id,
        rank: index + 1,
        likes: song.likes,
        plays: song.playCount,
      }))

      // AUTOMATICALLY AWARD CREDITS TO USER ACCOUNTS
      for (const winner of winners) {
        const creditAmount = this.calculateCreditReward(winner.rank)

        await this.addCreditsToUserAccount(winner.userId, creditAmount, "contest_winner", {
          contestId: currentContest.id,
          rank: winner.rank,
          songId: winner.songId,
        })

        await this.sendCreditNotification(winner.userId, creditAmount, `🏆 Contest Winner - Rank ${winner.rank}`)

        console.log(`✅ Awarded ${creditAmount} credits to user ${winner.userId} (Rank ${winner.rank})`)
      }

      await db.contestCycles.update({
        where: { id: currentContest.id },
        data: {
          winnersAnnounced: true,
          status: "archived",
        },
      })

      console.log(`🎉 Automatically distributed credits to ${winners.length} contest winners`)
    } catch (error) {
      console.error("Error distributing contest credits:", error)
    }
  }

  // AUTOMATICALLY ADD CREDITS TO USER ACCOUNT
  static async addCreditsToUserAccount(userId: string, amount: number, source: string, metadata?: any): Promise<void> {
    try {
      const isAtCap = await this.isAtCreditCap(userId)
      if (isAtCap) {
        console.log(`User ${userId} is at credit cap, cannot add more credits`)
        return
      }

      const creditReward = {
        id: `credit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        amount,
        type: source as any,
        source: `Auto Award: ${source}`,
        description: `Automatically awarded ${amount} credits`,
        awardedAt: new Date().toISOString(),
        used: false,
        metadata,
      }

      await db.creditRewards.create({
        data: creditReward,
      })

      await db.userCreditBalances.upsert({
        where: { userId },
        update: {
          totalCredits: { increment: amount },
          availableCredits: { increment: amount },
          lifetimeEarned: { increment: amount },
          updatedAt: new Date(),
        },
        create: {
          userId,
          totalCredits: amount,
          availableCredits: amount,
          usedCredits: 0,
          lifetimeEarned: amount,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      await db.creditTransactions.create({
        data: {
          id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          type: "earned",
          amount,
          description: `Auto award: ${source}`,
          source: `System: ${source}`,
          timestamp: new Date().toISOString(),
          metadata,
        },
      })

      console.log(`✅ Automatically added ${amount} credits to user ${userId} account`)
    } catch (error) {
      console.error("Error adding credits to user account:", error)
      throw error
    }
  }

  // CREDITS CAN ONLY BE USED FOR DOWNLOADS - ALIGNED WITH PRICING MODEL
  static getCreditSpendingOptions(): Array<{
    id: string
    name: string
    description: string
    cashPrice: number // Price in USD cents
    creditPrice: number // Price in credits (same value as cash)
    category: string
    icon: string
    popular?: boolean
    tier: string
  }> {
    return [
      // DOWNLOAD TIERS - Credits can be used instead of cash for downloads
      {
        id: "bonus_track_download",
        name: "🧪 Bonus Track Download",
        description: "Demo version with watermark overlay - Test the vibe before you commit",
        cashPrice: 99, // $0.99 in cash
        creditPrice: 99, // 99 credits (same value as cash)
        category: "downloads",
        icon: "🧪",
        tier: "Bonus Track",
      },
      {
        id: "base_song_download",
        name: "🔉 Base Song Download",
        description: "Standard quality MP3 download - Tracks under 9MB",
        cashPrice: 199, // $1.99 in cash
        creditPrice: 199, // 199 credits (same value as cash)
        category: "downloads",
        icon: "🔉",
        tier: "Base Song",
      },
      {
        id: "premium_song_download",
        name: "🎧 Premium Song Download",
        description: "High quality WAV/FLAC download - Tracks between 9MB and 20MB",
        cashPrice: 499, // $4.99 in cash
        creditPrice: 499, // 499 credits (same value as cash)
        category: "downloads",
        icon: "🎧",
        tier: "Premium Song",
        popular: true,
      },
      {
        id: "ultra_song_download",
        name: "💽 Ultra Super Great Amazing Song Download",
        description: "Ultra quality uncompressed download - Tracks over 20MB with all stems",
        cashPrice: 899, // $8.99 in cash
        creditPrice: 899, // 899 credits (same value as cash)
        category: "downloads",
        icon: "💽",
        tier: "Ultra Super Great Amazing Song",
      },
      {
        id: "full_license",
        name: "🪪 Full Commercial License",
        description: "Complete ownership rights - Use, modify, distribute, and monetize anywhere",
        cashPrice: 1000, // $10.00 in cash
        creditPrice: 1000, // 1000 credits (same value as cash)
        category: "licensing",
        icon: "🪪",
        tier: "Full License",
        popular: true,
      },
    ]
  }

  // Calculate credit reward (REASONABLE amounts for contest prizes)
  private static calculateCreditReward(rank: number): number {
    // Contest prizes in credits - equivalent to cash value
    switch (rank) {
      case 1:
        return 500 // 1st place: 500 credits ($5.00 value)
      case 2:
        return 300 // 2nd place: 300 credits ($3.00 value)
      case 3:
        return 200 // 3rd place: 200 credits ($2.00 value)
      case 4:
      case 5:
        return 100 // 4th-5th: 100 credits ($1.00 value)
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
        return 50 // 6th-10th: 50 credits ($0.50 value)
      default:
        return 25 // Participation: 25 credits ($0.25 value)
    }
  }

  // DAILY ACTIVITY REWARDS - Small amounts to encourage engagement
  static async awardDailyActivityCredits(userId: string, activityType: string): Promise<void> {
    const bonusAmounts = {
      daily_login: 5, // 5 credits for daily login ($0.05 value)
      vote_cast: 2, // 2 credits per vote ($0.02 value)
      song_share: 10, // 10 credits for sharing ($0.10 value)
      profile_complete: 25, // 25 credits for completing profile ($0.25 value)
      first_generation: 50, // 50 credits for first AI generation ($0.50 value)
    }

    const amount = bonusAmounts[activityType as keyof typeof bonusAmounts] || 1

    const todayEarned = await this.getTodayEarnedCredits(userId)
    if (todayEarned >= this.CREDIT_SETTINGS.dailyEarningLimit) {
      console.log(`User ${userId} has reached daily earning limit`)
      return
    }

    await this.addCreditsToUserAccount(userId, amount, activityType, { activityType })
  }

  // Check if user can use credits for download
  static async canUseCreditsForDownload(
    userId: string,
    songId: number,
    tier: string,
    includeLicense = false,
  ): Promise<{
    canUse: boolean
    availableCredits: number
    requiredCredits: number
    reason?: string
  }> {
    try {
      // Get song details to determine file size and pricing
      const song = await db.songs.findUnique({
        where: { id: songId },
      })

      if (!song) {
        return {
          canUse: false,
          availableCredits: 0,
          requiredCredits: 0,
          reason: "Song not found",
        }
      }

      // Calculate required credits using existing pricing service
      const pricing = PricingServiceV2.calculateTotalPrice(song.fileSizeMB || 5, includeLicense)
      const requiredCredits = Math.round(pricing.totalPrice * 100) // Convert dollars to credits

      const balance = await this.getCreditBalance(userId)

      if (balance.availableCredits < requiredCredits) {
        return {
          canUse: false,
          availableCredits: balance.availableCredits,
          requiredCredits,
          reason: `Insufficient credits. You have ${balance.availableCredits}, need ${requiredCredits}`,
        }
      }

      return {
        canUse: true,
        availableCredits: balance.availableCredits,
        requiredCredits,
      }
    } catch (error) {
      console.error("Error checking credit usage for download:", error)
      return {
        canUse: false,
        availableCredits: 0,
        requiredCredits: 0,
        reason: "Error checking credit balance",
      }
    }
  }

  // Use credits for download purchase
  static async useCreditsForDownload(
    userId: string,
    songId: number,
    tier: string,
    includeLicense = false,
  ): Promise<{
    success: boolean
    downloadToken?: string
    transactionId?: string
    remainingCredits?: number
    error?: string
  }> {
    try {
      // Verify user can use credits
      const canUse = await this.canUseCreditsForDownload(userId, songId, tier, includeLicense)
      if (!canUse.canUse) {
        return {
          success: false,
          error: canUse.reason,
        }
      }

      // Deduct credits from user account
      await db.userCreditBalances.update({
        where: { userId },
        data: {
          availableCredits: { decrement: canUse.requiredCredits },
          usedCredits: { increment: canUse.requiredCredits },
          updatedAt: new Date(),
        },
      })

      // Generate download token
      const downloadToken = PricingServiceV2.generateDownloadToken(songId, userId, tier)

      // Log transaction
      const transactionId = `credit_download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await db.creditTransactions.create({
        data: {
          id: transactionId,
          userId,
          type: "spent",
          amount: -canUse.requiredCredits,
          description: `Download: ${tier}${includeLicense ? " + Full License" : ""}`,
          source: "Download Purchase",
          timestamp: new Date().toISOString(),
          metadata: { songId, tier, includeLicense, downloadToken },
        },
      })

      // Store purchase record
      await db.purchaseRecords.create({
        data: {
          id: transactionId,
          userId,
          songId,
          purchaseType: "download",
          tier,
          includeLicense,
          amount: canUse.requiredCredits / 100, // Convert back to dollars for record
          downloadToken,
          paymentMethod: "credits",
          createdAt: new Date(),
        },
      })

      const updatedBalance = await this.getCreditBalance(userId)

      console.log(`✅ User ${userId} used ${canUse.requiredCredits} credits for ${tier} download`)

      return {
        success: true,
        downloadToken,
        transactionId,
        remainingCredits: updatedBalance.availableCredits,
      }
    } catch (error) {
      console.error("Error using credits for download:", error)
      return {
        success: false,
        error: "Transaction failed",
      }
    }
  }

  // Get user's credit balance
  static async getCreditBalance(userId: string): Promise<{
    totalCredits: number
    availableCredits: number
    usedCredits: number
    lifetimeEarned: number
  }> {
    try {
      const balance = await db.userCreditBalances.findUnique({
        where: { userId },
      })

      if (!balance) {
        return {
          totalCredits: 0,
          availableCredits: 0,
          usedCredits: 0,
          lifetimeEarned: 0,
        }
      }

      return {
        totalCredits: balance.totalCredits,
        availableCredits: balance.availableCredits,
        usedCredits: balance.usedCredits,
        lifetimeEarned: balance.lifetimeEarned,
      }
    } catch (error) {
      console.error("Error getting credit balance:", error)
      return {
        totalCredits: 0,
        availableCredits: 0,
        usedCredits: 0,
        lifetimeEarned: 0,
      }
    }
  }

  // Get today's earned credits (for daily limit)
  private static async getTodayEarnedCredits(userId: string): Promise<number> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayTransactions = await db.creditTransactions.findMany({
        where: {
          userId,
          type: "earned",
          timestamp: {
            gte: today.toISOString(),
            lt: tomorrow.toISOString(),
          },
        },
      })

      return todayTransactions.reduce((sum, txn) => sum + txn.amount, 0)
    } catch (error) {
      console.error("Error getting today's earned credits:", error)
      return 0
    }
  }

  // Check if user is at credit cap
  static async isAtCreditCap(userId: string): Promise<boolean> {
    try {
      const balance = await this.getCreditBalance(userId)
      return balance.availableCredits >= this.CREDIT_SETTINGS.maxCreditsPerUser
    } catch (error) {
      console.error("Error checking credit cap:", error)
      return false
    }
  }

  // Get current contest cycle
  static async getCurrentContestCycle(): Promise<ContestCycle | null> {
    try {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const startDate = new Date(currentYear, currentMonth, 1)
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)

      const contestId = `contest_${currentYear}_${currentMonth + 1}`

      let contest = await db.contestCycles.findUnique({
        where: { id: contestId },
      })

      if (!contest) {
        contest = await db.contestCycles.create({
          data: {
            id: contestId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: now >= startDate && now <= endDate ? "active" : "upcoming",
            totalPrizePool: 0,
            participantCount: 0,
            winnersAnnounced: false,
            resetDate: endDate.toISOString(),
          },
        })
      }

      return contest
    } catch (error) {
      console.error("Error getting current contest cycle:", error)
      return null
    }
  }

  // Send credit notification
  private static async sendCreditNotification(userId: string, amount: number, reason: string): Promise<void> {
    try {
      console.log(`📧 Sending credit notification to ${userId}: ${amount} credits for ${reason}`)
      // Implementation would send actual email/push notification
    } catch (error) {
      console.error("Error sending credit notification:", error)
    }
  }

  // Get credit settings
  static getCreditSettings(): CreditSettings {
    return this.CREDIT_SETTINGS
  }
}
