<<<<<<< HEAD
// BURNT BEATS PRICING MODEL - Exact pricing from guide
=======
// BURNT BEATS PRICING MODEL - Updated from pricing guide
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
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
<<<<<<< HEAD
    features: ["MP3 128kbps", "Watermarked", "Preview quality", "Demo version"],
=======
    features: ["MP3 128kbps", "Watermarked", "Preview quality"],
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
    emoji: "🧪",
  },
  {
    name: "Base Song",
    maxSize: 9,
    price: 1.99,
    quality: "Standard Quality",
    description: "Tracks under 9MB",
<<<<<<< HEAD
    features: ["MP3 320kbps", "Standard quality", "Personal use", "No watermark"],
=======
    features: ["MP3 320kbps", "Standard quality", "Personal use"],
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
    emoji: "🔉",
  },
  {
    name: "Premium Song",
    maxSize: 20,
    price: 4.99,
    quality: "High Quality",
    description: "Generated tracks between 9MB and 20MB",
<<<<<<< HEAD
    features: ["WAV/FLAC", "High quality", "Professional use", "Commercial ready"],
=======
    features: ["WAV/FLAC", "High quality", "Professional use"],
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
    emoji: "🎧",
  },
  {
    name: "Ultra Super Great Amazing Song",
    maxSize: Number.POSITIVE_INFINITY,
    price: 8.99,
    quality: "Ultra Quality",
    description: "High-quality track over 20MB. Perfect for deluxe or multitrack creations.",
<<<<<<< HEAD
    features: ["Uncompressed WAV", "Ultra quality", "Multitrack ready", "Deluxe edition", "All stems included"],
=======
    features: ["Uncompressed WAV", "Ultra quality", "Multitrack ready", "Deluxe edition"],
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
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
<<<<<<< HEAD
  // Calculate download price based on file size - EXACT logic from pricing guide
  static calculateDownloadPrice(fileSizeMB: number): { tier: DownloadTier; price: number } {
    let selectedTier: DownloadTier

    // Exact pricing logic from guide with precise boundary handling
    if (fileSizeMB <= 5.0) {
      // Files 5MB and under get Bonus Track
      selectedTier = DOWNLOAD_TIERS[0] // 🧪 Bonus Track - $0.99
    } else if (fileSizeMB < 9.0) {
      // Files over 5MB but under 9MB get Base Song
      selectedTier = DOWNLOAD_TIERS[1] // 🔉 Base Song - $1.99 (tracks under 9MB)
    } else if (fileSizeMB >= 9.0 && fileSizeMB <= 20.0) {
      // Files from 9MB to 20MB (inclusive) get Premium Song
      selectedTier = DOWNLOAD_TIERS[2] // 🎧 Premium Song - $4.99 (between 9MB and 20MB)
    } else {
      // Files over 20MB get Ultra Super Great Amazing Song
      selectedTier = DOWNLOAD_TIERS[3] // 💽 Ultra Super Great Amazing Song - $8.99 (over 20MB)
=======
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
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
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

<<<<<<< HEAD
  // Get tier description for UI - matches exact format from pricing guide
=======
  // Get tier description for UI
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
  static getTierDescription(tier: DownloadTier): string {
    return `${tier.emoji} ${tier.name} — $${tier.price.toFixed(2)}`
  }

<<<<<<< HEAD
  // Get full license description - matches exact format from pricing guide
=======
  // Get full license description
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
  static getFullLicenseDescription(): string {
    const fullLicense = LICENSING_OPTIONS[1]
    return `${fullLicense.emoji} Full License — $${fullLicense.price.toFixed(2)}`
  }

<<<<<<< HEAD
  // Get pricing display text exactly as in the guide
  static getPricingDisplayText(): string[] {
    return [
      "🪪 Full License — $10.00",
      "Includes 1 full license per generated track.",
      "Once purchased, this grants you complete ownership of your track. You're free to use, modify, distribute, and monetize your music on any platform—streaming services, social media, film, games, and commercial projects. Burnt Beats retains zero rights and will never require additional payments or royalties.",
      "",
      "💽 Ultra Super Great Amazing Song — $8.99",
      "High-quality track over 20MB",
      "Perfect for deluxe or multitrack creations.",
      "",
      "🎧 Premium Song — $4.99",
      "Generated tracks between 9MB and 20MB",
      "",
      "🔉 Base Song — $1.99",
      "Tracks under 9MB",
      "",
      "🧪 Bonus Track — $0.99",
      "Demo version with watermark overlay",
      "Test the vibe before you commit. Perfect for previewing.",
    ]
  }

  // Test function to demonstrate exact pricing logic with boundary cases
  static testBoundaryLogic(): void {
    const boundaryTests = [
      { size: 4.99, expected: "Bonus Track" },
      { size: 5.0, expected: "Bonus Track" },
      { size: 5.01, expected: "Base Song" },
      { size: 8.99, expected: "Base Song" },
      { size: 9.0, expected: "Premium Song" },
      { size: 9.01, expected: "Premium Song" },
      { size: 19.99, expected: "Premium Song" },
      { size: 20.0, expected: "Premium Song" },
      { size: 20.01, expected: "Ultra Super Great Amazing Song" },
    ]

    console.log("=== BOUNDARY PRICING TESTS ===")
    boundaryTests.forEach((test) => {
      const result = this.calculateDownloadPrice(test.size)
      const passed = result.tier.name === test.expected
      console.log(`${test.size}MB → ${result.tier.name} (${passed ? "✅ PASS" : "❌ FAIL"})`)
=======
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
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
    })
  }
}
