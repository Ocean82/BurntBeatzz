import { db } from "../database/connection"

export interface CreditReward {
  id: string
  userId: string
  amount: number
  type: "contest_winner" | "community_prize" | "daily_bonus" | "referral" | "achievement"
  source: string
  description: string
  awardedAt: string
  expiresAt?: string
  used: boolean
  usedAt?: string
  metadata?: {
    contestId?: string
    rank?: number
    achievementId?: string
  }
}

export interface CreditBalance {
  userId: string
  totalCredits: number
  availableCredits: number
  usedCredits: number
  expiredCredits: number
  lifetimeEarned: number
}

export interface CreditTransaction {
  id: string
  userId: string
  type: "earned" | "spent" | "expired" | "refunded"
  amount: number
  description: string
  source: string
  timestamp: string
  metadata?: any
}

export class CreditRewardService {
  // Award contest prizes as credits (SIGNIFICANTLY REDUCED)
  static async awardContestPrizes(contestId: string, winners: any[]): Promise<void> {
    try {
      console.log(`🏆 Awarding contest prizes for ${contestId}`)

      for (const winner of winners) {
        const creditAmount = this.calculateCreditReward(winner.rank)

        await this.awardCredits({
          userId: winner.userId,
          amount: creditAmount,
          type: "contest_winner",
          source: `Contest: ${contestId}`,
          description: `🏆 Contest Winner - Rank ${winner.rank}`,
          metadata: {
            contestId,
            rank: winner.rank,
          },
        })

        // Send notification
        await this.sendCreditNotification(winner.userId, creditAmount, `Contest Winner - Rank ${winner.rank}`)
      }

      console.log(`✅ Contest prizes awarded to ${winners.length} winners`)
    } catch (error) {
      console.error("Error awarding contest prizes:", error)
      throw error
    }
  }

  // Calculate credit amount (MUCH MORE CONSERVATIVE)
  private static calculateCreditReward(rank: number): number {
    // Much smaller, sustainable prize amounts
    switch (rank) {
      case 1:
        return 500 // 1st place: 500 credits (~$5 value)
      case 2:
        return 300 // 2nd place: 300 credits (~$3 value)
      case 3:
        return 200 // 3rd place: 200 credits (~$2 value)
      case 4:
      case 5:
        return 100 // 4th-5th: 100 credits (~$1 value)
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
        return 50 // 6th-10th: 50 credits (~$0.50 value)
      default:
        return 25 // Participation: 25 credits (~$0.25 value)
    }
  }

  // Award credits to user
  static async awardCredits(reward: Omit<CreditReward, "id" | "awardedAt" | "used" | "usedAt">): Promise<CreditReward> {
    try {
      const creditReward: CreditReward = {
        id: `credit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...reward,
        awardedAt: new Date().toISOString(),
        used: false,
      }

      // Save to database
      await db.creditRewards.create({
        data: creditReward,
      })

      // Update user's credit balance
      await this.updateCreditBalance(reward.userId, reward.amount, "earned")

      // Log transaction
      await this.logCreditTransaction({
        userId: reward.userId,
        type: "earned",
        amount: reward.amount,
        description: reward.description,
        source: reward.source,
        metadata: reward.metadata,
      })

      console.log(`✅ Awarded ${reward.amount} credits to user ${reward.userId}`)
      return creditReward
    } catch (error) {
      console.error("Error awarding credits:", error)
      throw error
    }
  }

  // Daily activity rewards (small amounts)
  static async awardDailyBonus(userId: string, activityType: string): Promise<void> {
    const bonusAmounts = {
      daily_login: 5, // 5 credits for daily login
      vote_cast: 2, // 2 credits per vote
      song_share: 10, // 10 credits for sharing
      profile_complete: 25, // 25 credits for completing profile
      first_generation: 50, // 50 credits for first AI generation
    }

    const amount = bonusAmounts[activityType as keyof typeof bonusAmounts] || 1

    await this.awardCredits({
      userId,
      amount,
      type: "daily_bonus",
      source: "Daily Activity",
      description: `Daily bonus: ${activityType.replace("_", " ")}`,
      metadata: { activityType },
    })
  }

  // Referral rewards (moderate amounts)
  static async awardReferralBonus(referrerId: string, newUserId: string): Promise<void> {
    // Referrer gets 100 credits
    await this.awardCredits({
      userId: referrerId,
      amount: 100,
      type: "referral",
      source: "Referral Program",
      description: "Friend referral bonus",
      metadata: { referredUserId: newUserId },
    })

    // New user gets 50 credits welcome bonus
    await this.awardCredits({
      userId: newUserId,
      amount: 50,
      type: "referral",
      source: "Welcome Bonus",
      description: "New user welcome bonus",
      metadata: { referredBy: referrerId },
    })
  }

  // Spend credits
  static async spendCredits(userId: string, amount: number, description: string, source: string): Promise<boolean> {
    try {
      const balance = await this.getCreditBalance(userId)

      if (balance.availableCredits < amount) {
        throw new Error(`Insufficient credits. Available: ${balance.availableCredits}, Required: ${amount}`)
      }

      // Update balance
      await this.updateCreditBalance(userId, -amount, "spent")

      // Log transaction
      await this.logCreditTransaction({
        userId,
        type: "spent",
        amount: -amount,
        description,
        source,
        metadata: { spentAt: new Date().toISOString() },
      })

      console.log(`✅ User ${userId} spent ${amount} credits on ${description}`)
      return true
    } catch (error) {
      console.error("Error spending credits:", error)
      return false
    }
  }

  // Get user's credit balance
  static async getCreditBalance(userId: string): Promise<CreditBalance> {
    try {
      const transactions = await db.creditTransactions.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
      })

      const earned = transactions.filter((t) => t.type === "earned").reduce((sum, t) => sum + t.amount, 0)

      const spent = transactions.filter((t) => t.type === "spent").reduce((sum, t) => sum + Math.abs(t.amount), 0)

      const expired = transactions.filter((t) => t.type === "expired").reduce((sum, t) => sum + Math.abs(t.amount), 0)

      const refunded = transactions.filter((t) => t.type === "refunded").reduce((sum, t) => sum + t.amount, 0)

      const availableCredits = earned - spent - expired + refunded

      return {
        userId,
        totalCredits: earned + refunded,
        availableCredits: Math.max(0, availableCredits),
        usedCredits: spent,
        expiredCredits: expired,
        lifetimeEarned: earned,
      }
    } catch (error) {
      console.error("Error getting credit balance:", error)
      return {
        userId,
        totalCredits: 0,
        availableCredits: 0,
        usedCredits: 0,
        expiredCredits: 0,
        lifetimeEarned: 0,
      }
    }
  }

  // Update credit balance
  private static async updateCreditBalance(userId: string, amount: number, type: "earned" | "spent"): Promise<void> {
    try {
      await db.userCreditBalances.upsert({
        where: { userId },
        update: {
          totalCredits: type === "earned" ? { increment: amount } : { decrement: Math.abs(amount) },
          updatedAt: new Date(),
        },
        create: {
          userId,
          totalCredits: Math.max(0, amount),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    } catch (error) {
      console.error("Error updating credit balance:", error)
      throw error
    }
  }

  // Log credit transaction
  private static async logCreditTransaction(transaction: Omit<CreditTransaction, "id" | "timestamp">): Promise<void> {
    try {
      await db.creditTransactions.create({
        data: {
          id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...transaction,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error("Error logging credit transaction:", error)
      throw error
    }
  }

  // Send credit notification
  private static async sendCreditNotification(userId: string, amount: number, reason: string): Promise<void> {
    try {
      // Email notification
      await this.sendEmail({
        to: userId,
        subject: "🎉 Credits Awarded - Burnt Beats",
        template: "credit-award",
        data: {
          amount,
          reason,
          awardDate: new Date().toLocaleDateString(),
          ctaUrl: "/credits/spend",
        },
      })

      // Push notification
      await this.sendPushNotification(userId, {
        title: "🏆 Credits Earned!",
        body: `You've earned ${amount} credits for ${reason}!`,
        icon: "/icons/credits.png",
        data: { type: "credit_award", amount, reason },
      })
    } catch (error) {
      console.error("Error sending credit notification:", error)
    }
  }

  // Get credit spending options (REDUCED COSTS)
  static getCreditSpendingOptions(): Array<{
    id: string
    name: string
    description: string
    cost: number
    category: string
    icon: string
    popular?: boolean
  }> {
    return [
      // AI Generation Credits (reduced costs)
      {
        id: "ai_generation_basic",
        name: "AI Song Generation",
        description: "Generate 1 AI song with basic settings",
        cost: 25, // Reduced from 50
        category: "generation",
        icon: "🎵",
      },
      {
        id: "ai_generation_premium",
        name: "Premium AI Generation",
        description: "Generate 1 AI song with advanced settings & voice cloning",
        cost: 50, // Reduced from 100
        category: "generation",
        icon: "🎤",
        popular: true,
      },
      {
        id: "ai_generation_bulk",
        name: "Bulk Generation Pack",
        description: "Generate 5 AI songs with premium features",
        cost: 200, // Reduced from 800, and reduced quantity
        category: "generation",
        icon: "🎼",
      },

      // Download Credits (reduced costs)
      {
        id: "download_standard",
        name: "Standard Quality Download",
        description: "Download song in MP3 format (320kbps)",
        cost: 10, // Reduced from 25
        category: "downloads",
        icon: "⬇️",
      },
      {
        id: "download_premium",
        name: "Premium Download Pack",
        description: "WAV + MP3 + stems + commercial license",
        cost: 75, // Reduced from 150
        category: "downloads",
        icon: "💎",
        popular: true,
      },

      // Contest Boosts (reduced costs)
      {
        id: "contest_boost_visibility",
        name: "Visibility Boost",
        description: "Feature your song on homepage for 24 hours",
        cost: 100, // Reduced from 200
        category: "contest",
        icon: "🚀",
      },
      {
        id: "contest_boost_votes",
        name: "Vote Multiplier",
        description: "1.5x vote weight for your contest entry",
        cost: 150, // Reduced from 300, and reduced multiplier
        category: "contest",
        icon: "⭐",
      },

      // Premium Features (reduced costs)
      {
        id: "premium_week",
        name: "Premium Membership (1 Week)",
        description: "Unlimited generations, priority support, exclusive features",
        cost: 100, // Much shorter duration, lower cost
        category: "premium",
        icon: "👑",
        popular: true,
      },
      {
        id: "storage_upgrade",
        name: "Storage Upgrade",
        description: "Additional 5GB cloud storage for your songs",
        cost: 50, // Reduced from 100, and reduced storage
        category: "premium",
        icon: "💾",
      },

      // Customization (reduced costs)
      {
        id: "custom_avatar",
        name: "Custom Profile Avatar",
        description: "Upload custom avatar and profile themes",
        cost: 30, // Reduced from 75
        category: "customization",
        icon: "🎨",
      },
      {
        id: "username_change",
        name: "Username Change",
        description: "Change your username (once per month)",
        cost: 25, // Reduced from 50
        category: "customization",
        icon: "✏️",
      },
    ]
  }

  // Placeholder methods
  private static async sendEmail(params: any): Promise<void> {
    console.log("📧 Sending email:", params)
  }

  private static async sendPushNotification(userId: string, notification: any): Promise<void> {
    console.log("📱 Sending push notification:", notification)
  }
}
