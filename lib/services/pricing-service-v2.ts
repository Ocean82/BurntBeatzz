// BURNT BEATS PRICING MODEL - Updated from pricing guide
export interface DownloadTier {
  name: string
  maxSize: number // in MB
  price: number
  quality: string
  description: string
  features: string[]
  emoji: string
}

export interface LicensingOption {
  type: "standard" | "full"
  price: number
  description: string
  rights: string[]
  emoji: string
}

const DOWNLOAD_TIERS: DownloadTier[] = [
  {
    name: "Bonus Track",
    maxSize: 5,
    price: 0.99,
    quality: "Demo Quality",
    description: "Demo version with watermark overlay. Test the vibe before you commit. Perfect for previewing.",
    features: ["MP3 128kbps", "Watermarked", "Preview quality"],
    emoji: "🧪",
  },
  {
    name: "Base Song",
    maxSize: 9,
    price: 1.99,
    quality: "Standard Quality",
    description: "Tracks under 9MB",
    features: ["MP3 320kbps", "Standard quality", "Personal use"],
    emoji: "🔉",
  },
  {
    name: "Premium Song",
    maxSize: 20,
    price: 4.99,
    quality: "High Quality",
    description: "Generated tracks between 9MB and 20MB",
    features: ["WAV/FLAC", "High quality", "Professional use"],
    emoji: "🎧",
  },
  {
    name: "Ultra Super Great Amazing Song",
    maxSize: Number.POSITIVE_INFINITY,
    price: 8.99,
    quality: "Ultra Quality",
    description: "High-quality track over 20MB. Perfect for deluxe or multitrack creations.",
    features: ["Uncompressed WAV", "Ultra quality", "Multitrack ready", "Deluxe edition"],
    emoji: "💽",
  },
]

const LICENSING_OPTIONS: LicensingOption[] = [
  {
    type: "standard",
    price: 0,
    description: "Standard download rights",
    rights: ["Personal use", "Social media", "Non-commercial projects"],
    emoji: "📄",
  },
  {
    type: "full",
    price: 10.0,
    description:
      "Includes 1 full license per generated track. Once purchased, this grants you complete ownership of your track. You're free to use, modify, distribute, and monetize your music on any platform—streaming services, social media, film, games, and commercial projects. Burnt Beats retains zero rights and will never require additional payments or royalties.",
    rights: [
      "Complete ownership of your track",
      "Use, modify, distribute, and monetize",
      "Streaming services, social media, film, games",
      "Commercial projects",
      "Burnt Beats retains zero rights",
      "No additional payments or royalties ever",
    ],
    emoji: "🪪",
  },
]

export class PricingServiceV2 {
  // Calculate download price based on file size
  static calculateDownloadPrice(fileSizeMB: number): { tier: DownloadTier; price: number } {
    let selectedTier = DOWNLOAD_TIERS[0] // Default to Bonus Track

    // Find the appropriate tier based on file size
    if (fileSizeMB <= 5) {
      selectedTier = DOWNLOAD_TIERS[0] // Bonus Track - $0.99
    } else if (fileSizeMB <= 9) {
      selectedTier = DOWNLOAD_TIERS[1] // Base Song - $1.99
    } else if (fileSizeMB <= 20) {
      selectedTier = DOWNLOAD_TIERS[2] // Premium Song - $4.99
    } else {
      selectedTier = DOWNLOAD_TIERS[3] // Ultra Super Great Amazing Song - $8.99
    }

    return { tier: selectedTier, price: selectedTier.price }
  }

  // Get all download tiers
  static getDownloadTiers(): DownloadTier[] {
    return DOWNLOAD_TIERS
  }

  // Get licensing options
  static getLicensingOptions(): LicensingOption[] {
    return LICENSING_OPTIONS
  }

  // Calculate total price with licensing
  static calculateTotalPrice(
    fileSizeMB: number,
    includeLicense = false,
  ): {
    downloadPrice: number
    licensePrice: number
    totalPrice: number
    tier: DownloadTier
  } {
    const { tier, price: downloadPrice } = this.calculateDownloadPrice(fileSizeMB)
    const licensePrice = includeLicense ? LICENSING_OPTIONS[1].price : 0
    const totalPrice = downloadPrice + licensePrice

    return {
      downloadPrice,
      licensePrice,
      totalPrice,
      tier,
    }
  }

  // Get tier by name
  static getTierByName(tierName: string): DownloadTier | null {
    return DOWNLOAD_TIERS.find((tier) => tier.name === tierName) || null
  }

  // Get recommended tier for file size
  static getRecommendedTier(fileSizeMB: number): DownloadTier {
    // Recommend Premium Song for most users (good balance of quality and price)
    if (fileSizeMB <= 20) {
      return DOWNLOAD_TIERS[2] // Premium Song
    }
    return DOWNLOAD_TIERS[3] // Ultra Super Great Amazing Song
  }

  // Validate purchase
  static validatePurchase(songId: number, userId: string, tier: string): boolean {
    const tierExists = DOWNLOAD_TIERS.some((t) => t.name === tier)
    return tierExists && songId > 0 && userId.length > 0
  }

  // Generate download token
  static generateDownloadToken(songId: number, userId: string, tier: string): string {
    const timestamp = Date.now()
    const tierCode = tier.replace(/\s+/g, "_").toLowerCase()
    return `download_${songId}_${userId}_${tierCode}_${timestamp}`
  }

  // Get tier description for UI
  static getTierDescription(tier: DownloadTier): string {
    return `${tier.emoji} ${tier.name} — $${tier.price.toFixed(2)}`
  }

  // Get full license description
  static getFullLicenseDescription(): string {
    const fullLicense = LICENSING_OPTIONS[1]
    return `${fullLicense.emoji} Full License — $${fullLicense.price.toFixed(2)}`
  }

  // Test function to demonstrate pricing logic
  static testPricingLogic(): void {
    const testSizes = [2.5, 7.3, 15.8, 25.4, 45.2]

    console.log("=== PRICING SYSTEM TEST ===")
    testSizes.forEach((size) => {
      const result = this.calculateTotalPrice(size, false)
      const resultWithLicense = this.calculateTotalPrice(size, true)

      console.log(`\nFile Size: ${size}MB`)
      console.log(`Tier: ${result.tier.emoji} ${result.tier.name}`)
      console.log(`Price: $${result.downloadPrice}`)
      console.log(`With License: $${resultWithLicense.totalPrice}`)
    })
  }
}
