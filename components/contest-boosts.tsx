"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Crown, Star, Zap, Timer, Eye, Trophy, Flame } from "lucide-react"

interface ContestBoostsProps {
  songId: number
  songTitle: string
  onBoostPurchase: (boostType: string) => void
}

function ContestBoosts({ songId, songTitle, onBoostPurchase }: ContestBoostsProps) {
  const [selectedBoost, setSelectedBoost] = useState<string | null>(null)

  const boostOptions = [
    {
      id: "trending",
      name: "Trending Boost",
      price: 5.99,
      duration: "24 hours",
      description: "Feature your track in the Trending feed",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "from-blue-500 to-cyan-500",
      features: ["Trending feed placement", "Increased visibility", "24h duration"],
    },
    {
      id: "top10",
      name: "Top 10 Boost",
      price: 9.99,
      duration: "48 hours",
      description: "Push your track into Top 10 charts",
      icon: <Crown className="w-5 h-5" />,
      color: "from-purple-500 to-pink-500",
      features: ["Top 10 chart placement", "Premium visibility", "48h duration"],
      popular: true,
    },
    {
      id: "featured",
      name: "Homepage Feature",
      price: 19.99,
      duration: "1 week",
      description: "Homepage spotlight for maximum exposure",
      icon: <Star className="w-5 h-5" />,
      color: "from-orange-500 via-red-500 to-green-500",
      features: ["Homepage feature", "Maximum exposure", "1 week duration"],
      premium: true,
    },
  ]

  return (
    <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
      <CardHeader>
        <CardTitle className="text-green-300 flex items-center gap-2">
          <Flame className="w-5 h-5" />
          Contest Boosts for "{songTitle}"
        </CardTitle>
        <p className="text-green-400/60 text-sm">Boost your track's visibility and climb the charts! 🚀</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {boostOptions.map((boost) => {
          const isSelected = selectedBoost === boost.id

          return (
            <div
              key={boost.id}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? "border-green-400 bg-green-500/10 shadow-lg shadow-green-400/30"
                  : "border-green-500/30 hover:border-green-400/50 bg-black/40"
              }`}
              onClick={() => setSelectedBoost(boost.id)}
            >
              {boost.popular && (
                <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Trophy className="w-3 h-3 mr-1" />
                  MOST POPULAR
                </Badge>
              )}

              {boost.premium && (
                <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  PREMIUM
                </Badge>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${boost.color}`}>{boost.icon}</div>
                  <div>
                    <h3 className="font-semibold text-green-100">{boost.name}</h3>
                    <p className="text-green-400/80 text-sm">{boost.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Timer className="w-3 h-3 text-green-400/60" />
                      <span className="text-green-400/60 text-xs">{boost.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-300">${boost.price}</div>
                  <div className="text-sm text-green-400/60">one-time</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {boost.features.map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-green-500/30 text-green-400">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )
        })}

        {/* Purchase Button */}
        {selectedBoost && (
          <div className="space-y-4">
            <div className="bg-black/60 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-green-300">{boostOptions.find((b) => b.id === selectedBoost)?.name}</span>
                <span className="text-2xl font-bold text-green-300">
                  ${boostOptions.find((b) => b.id === selectedBoost)?.price}
                </span>
              </div>
            </div>

            <Button
              onClick={() => onBoostPurchase(selectedBoost)}
              className="w-full h-12 bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30"
            >
              <Zap className="w-5 h-5 mr-2" />
              Purchase {boostOptions.find((b) => b.id === selectedBoost)?.name}
            </Button>
          </div>
        )}

        {/* Value Proposition */}
        <div className="text-center p-4 bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/20 rounded-lg">
          <Eye className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-orange-300 font-medium">Maximize Your Reach</p>
          <p className="text-orange-400/60 text-sm">
            Get discovered by thousands of music lovers and climb the charts!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export { ContestBoosts }
