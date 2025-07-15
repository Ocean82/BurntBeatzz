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
