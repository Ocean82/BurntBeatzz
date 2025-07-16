"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coins, Download, Crown, Palette, Music, Star, Trophy, Gift, ShoppingCart, Wallet } from "lucide-react"

interface CreditBalance {
  totalCredits: number
  availableCredits: number
  usedCredits: number
  lifetimeEarned: number
}

interface SpendingOption {
  id: string
  name: string
  description: string
  cost: number
  category: string
  icon: string
  popular?: boolean
}

export default function CreditStore() {
  const [balance, setBalance] = useState<CreditBalance>({
    totalCredits: 350, // Much more realistic starting balance
    availableCredits: 285,
    usedCredits: 65,
    lifetimeEarned: 420,
  })

  const [selectedCategory, setSelectedCategory] = useState("all")
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([])

  const spendingOptions: SpendingOption[] = [
    // AI Generation (reduced costs)
    {
      id: "ai_generation_basic",
      name: "AI Song Generation",
      description: "Generate 1 AI song with basic settings",
      cost: 25, // Much more affordable
      category: "generation",
      icon: "🎵",
    },
    {
      id: "ai_generation_premium",
      name: "Premium AI Generation",
      description: "Generate 1 AI song with advanced settings & voice cloning",
      cost: 50,
      category: "generation",
      icon: "🎤",
      popular: true,
    },
    {
      id: "ai_generation_bulk",
      name: "Bulk Generation Pack",
      description: "Generate 5 AI songs with premium features",
      cost: 200,
      category: "generation",
      icon: "🎼",
    },

    // Downloads (reduced costs)
    {
      id: "download_standard",
      name: "Standard Quality Download",
      description: "Download song in MP3 format (320kbps)",
      cost: 10,
      category: "downloads",
      icon: "⬇️",
    },
    {
      id: "download_premium",
      name: "Premium Download Pack",
      description: "WAV + MP3 + stems + commercial license",
      cost: 75,
      category: "downloads",
      icon: "💎",
      popular: true,
    },

    // Contest Boosts (reduced costs)
    {
      id: "contest_boost_visibility",
      name: "Visibility Boost",
      description: "Feature your song on homepage for 24 hours",
      cost: 100,
      category: "contest",
      icon: "🚀",
    },
    {
      id: "contest_boost_votes",
      name: "Vote Multiplier",
      description: "1.5x vote weight for your contest entry",
      cost: 150,
      category: "contest",
      icon: "⭐",
    },

    // Premium Features (reduced costs)
    {
      id: "premium_week",
      name: "Premium Membership (1 Week)",
      description: "Unlimited generations, priority support, exclusive features",
      cost: 100,
      category: "premium",
      icon: "👑",
      popular: true,
    },
    {
      id: "storage_upgrade",
      name: "Storage Upgrade",
      description: "Additional 5GB cloud storage for your songs",
      cost: 50,
      category: "premium",
      icon: "💾",
    },

    // Customization (reduced costs)
    {
      id: "custom_avatar",
      name: "Custom Profile Avatar",
      description: "Upload custom avatar and profile themes",
      cost: 30,
      category: "customization",
      icon: "🎨",
    },
    {
      id: "username_change",
      name: "Username Change",
      description: "Change your username (once per month)",
      cost: 25,
      category: "customization",
      icon: "✏️",
    },
  ]

  const categories = [
    { id: "all", name: "All Items", icon: ShoppingCart },
    { id: "generation", name: "AI Generation", icon: Music },
    { id: "downloads", name: "Downloads", icon: Download },
    { id: "contest", name: "Contest Boosts", icon: Trophy },
    { id: "premium", name: "Premium", icon: Crown },
    { id: "customization", name: "Customization", icon: Palette },
  ]

  const filteredOptions =
    selectedCategory === "all"
      ? spendingOptions
      : spendingOptions.filter((option) => option.category === selectedCategory)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "generation":
        return <Music className="w-4 h-4" />
      case "downloads":
        return <Download className="w-4 h-4" />
      case "contest":
        return <Trophy className="w-4 h-4" />
      case "premium":
        return <Crown className="w-4 h-4" />
      case "customization":
        return <Palette className="w-4 h-4" />
      default:
        return <Star className="w-4 h-4" />
    }
  }

  const handlePurchase = async (option: SpendingOption) => {
    if (balance.availableCredits < option.cost) {
      alert("Insufficient credits!")
      return
    }

    // Simulate purchase
    setBalance((prev) => ({
      ...prev,
      availableCredits: prev.availableCredits - option.cost,
      usedCredits: prev.usedCredits + option.cost,
    }))

    // Add to purchase history
    setPurchaseHistory((prev) => [
      {
        id: Date.now(),
        item: option.name,
        cost: option.cost,
        purchasedAt: new Date().toISOString(),
        status: "completed",
      },
      ...prev,
    ])

    alert(`Successfully purchased ${option.name}!`)
  }

  return (
    <div className="space-y-6">
      {/* Credit Balance Overview */}
      <Card className="bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 border border-green-500/30">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Your Credit Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="text-3xl font-bold text-green-300 flex items-center justify-center gap-2">
                <Coins className="w-6 h-6" />
                {balance.availableCredits.toLocaleString()}
              </div>
              <div className="text-green-400/80 text-sm">Available Credits</div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-300">{balance.usedCredits.toLocaleString()}</div>
              <div className="text-blue-400/80 text-sm">Credits Used</div>
            </div>
            <div className="text-center p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-300">{balance.lifetimeEarned.toLocaleString()}</div>
              <div className="text-purple-400/80 text-sm">Lifetime Earned</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="text-2xl font-bold text-yellow-300">
                {Math.floor((balance.usedCredits / balance.lifetimeEarned) * 100)}%
              </div>
              <div className="text-yellow-400/80 text-sm">Usage Rate</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Credits Used</span>
              <span>
                {balance.usedCredits} / {balance.lifetimeEarned}
              </span>
            </div>
            <Progress value={(balance.usedCredits / balance.lifetimeEarned) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Credit Store */}
      <Card className="bg-black/80 border border-green-500/30">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Credit Store
          </CardTitle>
          <p className="text-green-400/80">Spend your credits on premium features and services</p>
        </CardHeader>
        <CardContent>
          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
            <TabsList className="bg-black/60 border border-green-500/30 grid grid-cols-6">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 flex items-center gap-1 text-xs"
                >
                  <category.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOptions.map((option) => (
                  <Card
                    key={option.id}
                    className={`bg-black/60 border transition-all hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 ${
                      option.popular ? "border-yellow-500/50 shadow-yellow-500/10" : "border-gray-500/30"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{option.icon}</span>
                          <div>
                            <CardTitle className="text-green-300 text-lg">{option.name}</CardTitle>
                            {option.popular && (
                              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </div>
                        </div>
                        {getCategoryIcon(option.category)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-400 text-sm">{option.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-green-400" />
                          <span className="text-green-300 font-bold">{option.cost.toLocaleString()}</span>
                          <span className="text-gray-400 text-sm">credits</span>
                        </div>
                        <Button
                          onClick={() => handlePurchase(option)}
                          disabled={balance.availableCredits < option.cost}
                          className={`${
                            balance.availableCredits >= option.cost
                              ? "bg-green-500/20 text-green-300 hover:bg-green-500/30 border-green-500/30"
                              : "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                          }`}
                          size="sm"
                        >
                          {balance.availableCredits >= option.cost ? "Purchase" : "Insufficient Credits"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* How to Earn More Credits */}
      <Card className="bg-black/80 border border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-blue-300 flex items-center gap-2">
            <Gift className="w-5 h-5" />
            How to Earn More Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-green-300 font-semibold mb-3">🏆 Contest Rewards (REDUCED)</h4>
              <ul className="space-y-2 text-green-400/80 text-sm">
                <li>
                  • <strong>1st Place:</strong> 500 credits (~$5 value)
                </li>
                <li>
                  • <strong>2nd Place:</strong> 300 credits (~$3 value)
                </li>
                <li>
                  • <strong>3rd Place:</strong> 200 credits (~$2 value)
                </li>
                <li>
                  • <strong>Top 10:</strong> 50-100 credits (~$0.50-$1 value)
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-blue-300 font-semibold mb-3">⚡ Daily Activities</h4>
              <ul className="space-y-2 text-blue-400/80 text-sm">
                <li>• Daily login bonus: 5 credits</li>
                <li>• Vote on songs: 2 credits each</li>
                <li>• Share your creations: 10 credits</li>
                <li>• Refer friends: 100 credits per signup</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
