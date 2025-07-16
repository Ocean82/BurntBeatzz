<<<<<<< HEAD
// Pricing service for calculating upload costs
export interface PricingTier {
  tier: string
  tierName: string
  price: number
  maxSizeMB: number
  features: string[]
  emoji: string
}

const PRICING_TIERS: PricingTier[] = [
  {
    tier: "bonus",
    tierName: "Bonus Track",
    price: 0.99,
    maxSizeMB: 5,
    features: ["Demo Quality", "Watermarked", "Preview version"],
    emoji: "🧪",
  },
  {
    tier: "base",
    tierName: "Base Song",
    price: 1.99,
    maxSizeMB: 9,
    features: ["Standard Quality", "MP3 320kbps", "Personal use"],
    emoji: "🔉",
  },
  {
    tier: "premium",
    tierName: "Premium Song",
    price: 4.99,
    maxSizeMB: 20,
    features: ["High Quality", "WAV/FLAC", "Commercial ready"],
    emoji: "🎧",
  },
  {
    tier: "ultra",
    tierName: "Ultra Super Great Amazing Song",
    price: 8.99,
    maxSizeMB: Number.POSITIVE_INFINITY,
    features: ["Ultra Quality", "Uncompressed", "All stems included"],
    emoji: "💽",
  },
]

export function calculatePricing(fileSizeBytes: number) {
  const fileSizeMB = fileSizeBytes / (1024 * 1024)

  // Find the appropriate tier based on file size
  for (const tier of PRICING_TIERS) {
    if (fileSizeMB <= tier.maxSizeMB) {
      return {
        tier: tier.tier,
        tierName: tier.tierName,
        price: tier.price,
        fileSizeMB,
        features: tier.features,
        emoji: tier.emoji,
      }
    }
  }

  // Default to ultra tier for very large files
  const ultraTier = PRICING_TIERS[PRICING_TIERS.length - 1]
  return {
    tier: ultraTier.tier,
    tierName: ultraTier.tierName,
    price: ultraTier.price,
    fileSizeMB,
    features: ultraTier.features,
    emoji: ultraTier.emoji,
  }
}

export function getAllTiers() {
  return PRICING_TIERS
}

export function getTierByName(tierName: string) {
  return PRICING_TIERS.find((tier) => tier.tierName === tierName)
}

export function getFullLicensePrice() {
  return 10.0
}
=======
const PLAN_LIMITS = {
  free: {
    songsPerMonth: 2,
    maxSongLength: "0:30",
    features: {
      voiceCloning: false,
      textToSpeech: false,
      analytics: false,
      versionControl: false,
      collaboration: false,
      realTimeCollaboration: false,
      musicTheoryTools: false,
      socialFeatures: false,
      advancedEditing: false,
      multipleVoiceSamples: false,
      commercialUse: false,
      prioritySupport: false,
      apiAccess: false,
      customIntegrations: false,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: false,
      wav: false,
      flac: false,
    },
    genres: ["Pop", "Rock", "Electronic"],
    pricing: {
      monthly: 0,
      displayPrice: "Free",
    },
  },
  basic: {
    songsPerMonth: 4,
    maxSongLength: "5:30",
    features: {
      voiceCloning: true,
      textToSpeech: true,
      analytics: false,
      versionControl: false,
      collaboration: false,
      realTimeCollaboration: false,
      musicTheoryTools: false,
      socialFeatures: false,
      advancedEditing: true,
      multipleVoiceSamples: false,
      commercialUse: false,
      prioritySupport: false,
      apiAccess: false,
      customIntegrations: false,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: true,
      wav: false,
      flac: false,
    },
    genres: ["Pop", "Rock", "Electronic", "Jazz", "Classical"],
    pricing: {
      monthly: 6.99,
      displayPrice: "$6.99/month",
    },
  },
  pro: {
    songsPerMonth: 50,
    maxSongLength: "5:30",
    features: {
      voiceCloning: true,
      textToSpeech: true,
      analytics: true,
      versionControl: true,
      collaboration: true,
      realTimeCollaboration: false,
      musicTheoryTools: false,
      socialFeatures: false,
      advancedEditing: true,
      multipleVoiceSamples: true,
      commercialUse: false,
      prioritySupport: false,
      apiAccess: false,
      customIntegrations: false,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: true,
      wav: true,
      flac: false,
    },
    genres: ["Pop", "Rock", "Electronic", "Jazz", "Classical", "Hip-Hop", "Country", "R&B"],
    pricing: {
      monthly: 12.99,
      displayPrice: "$12.99/month",
    },
  },
  enterprise: {
    songsPerMonth: -1, // unlimited
    maxSongLength: "5:30",
    features: {
      voiceCloning: true,
      textToSpeech: true,
      analytics: true,
      versionControl: true,
      collaboration: true,
      realTimeCollaboration: true,
      musicTheoryTools: true,
      socialFeatures: true,
      advancedEditing: true,
      multipleVoiceSamples: true,
      commercialUse: true,
      prioritySupport: true,
      apiAccess: true,
      customIntegrations: true,
    },
    audioQuality: {
      mp3_128: true,
      mp3_320: true,
      wav: true,
      flac: true,
    },
    genres: ["Pop", "Rock", "Electronic", "Jazz", "Classical", "Hip-Hop", "Country", "R&B"],
    pricing: {
      monthly: 39.99,
      displayPrice: "$39.99/month",
    },
  },
}

export class PricingService {
  static checkUsageLimit(user: any) {
    const planLimits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS]
    if (!planLimits) {
      return { canCreate: false, reason: "Invalid plan" }
    }

    if (planLimits.songsPerMonth === -1) {
      return { canCreate: true }
    }

    if ((user.songsThisMonth || 0) >= planLimits.songsPerMonth) {
      return {
        canCreate: false,
        reason: `Monthly limit reached (${planLimits.songsPerMonth} songs per month on ${user.plan} plan)`,
      }
    }

    return { canCreate: true }
  }

  static hasFeatureAccess(userPlan: string, feature: keyof typeof PLAN_LIMITS.free.features) {
    const planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS]
    return planLimits?.features[feature] || false
  }

  static getAvailableGenres(userPlan: string) {
    const planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS]
    return planLimits?.genres || []
  }

  static getMaxSongLength(userPlan: string) {
    const planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS]
    return planLimits?.maxSongLength || "0:30"
  }

  static getAudioQualityOptions(userPlan: string) {
    const planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS]
    if (!planLimits) return ["MP3 128kbps"]

    const options = []
    if (planLimits.audioQuality.mp3_128) options.push("MP3 128kbps")
    if (planLimits.audioQuality.mp3_320) options.push("MP3 320kbps")
    if (planLimits.audioQuality.wav) options.push("WAV")
    if (planLimits.audioQuality.flac) options.push("FLAC")
    return options
  }

  static getPlanLimits(userPlan: string) {
    return PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || null
  }

  static getUpgradeMessage(currentPlan: string, requiredFeature: string) {
    const messages = {
      free: "This feature is available starting with Basic plan ($6.99/month)",
      basic: "This feature is available with Pro plan ($12.99/month)",
      pro: "This feature is available with Enterprise plan ($39.99/month)",
    }

    if (requiredFeature === "voiceCloning" || requiredFeature === "textToSpeech") {
      return "Voice features are available starting with Basic plan ($6.99/month)"
    }
    if (
      requiredFeature === "analytics" ||
      requiredFeature === "versionControl" ||
      requiredFeature === "collaboration"
    ) {
      return "Advanced tools are available with Pro plan ($12.99/month)"
    }
    if (
      requiredFeature === "realTimeCollaboration" ||
      requiredFeature === "musicTheoryTools" ||
      requiredFeature === "socialFeatures"
    ) {
      return "Professional features are available with Enterprise plan ($39.99/month)"
    }

    return messages[currentPlan as keyof typeof messages] || "Upgrade required for this feature"
  }
}
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
