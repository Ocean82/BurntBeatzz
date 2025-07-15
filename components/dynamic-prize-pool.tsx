"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Trophy,
  DollarSign,
  Users,
  Music,
  Clock,
  TrendingUp,
  Zap,
  Crown,
  Star,
  Flame,
  Target,
  Gift,
  Coins,
  Award,
} from "lucide-react"

interface PrizePoolData {
  total: number
  basePool: number
  communityContributions: number
  entryFees: number
  sponsorships: number
  contributors: number
  entries: number
  timeLeft: string
  daysRemaining: number
  prizes: {
    first: number
    second: number
    third: number
    community: number
    bonus: number
  }
  milestones: {
    target: number
    reward: string
    reached: boolean
  }[]
  recentContributions: {
    amount: number
    contributor: string
    timestamp: string
    type: "entry" | "donation" | "sponsor"
  }[]
}

export default function DynamicPrizePool() {
  const [prizeData, setPrizeData] = useState<PrizePoolData>({
    total: 1247.5,
    basePool: 500,
    communityContributions: 347.5,
    entryFees: 400,
    sponsorships: 0,
    contributors: 89,
    entries: 80,
    timeLeft: "12 days, 14 hours",
    daysRemaining: 12,
    prizes: {
      first: 750,
      second: 300,
      third: 150,
      community: 47.5,
      bonus: 0,
    },
    milestones: [
      { target: 1000, reward: "+$100 Bonus Prize", reached: true },
      { target: 1500, reward: "Studio Time Package", reached: false },
      { target: 2000, reward: "Equipment Voucher", reached: false },
      { target: 2500, reward: "Record Label Meeting", reached: false },
    ],
    recentContributions: [
      { amount: 5, contributor: "BeatMaker23", timestamp: "2 mins ago", type: "entry" },
      { amount: 25, contributor: "MusicLover", timestamp: "15 mins ago", type: "donation" },
      { amount: 5, contributor: "FireProducer", timestamp: "1 hour ago", type: "entry" },
      { amount: 10, contributor: "Anonymous", timestamp: "2 hours ago", type: "donation" },
    ],
  })

  const [isAnimating, setIsAnimating] = useState(false)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPrizeData((prev) => {
        // Randomly add small contributions
        if (Math.random() < 0.3) {
          const newAmount = Math.random() < 0.7 ? 5 : Math.floor(Math.random() * 20) + 5
          const newContribution = {
            amount: newAmount,
            contributor: `User${Math.floor(Math.random() * 1000)}`,
            timestamp: "just now",
            type: Math.random() < 0.8 ? "entry" : ("donation" as "entry" | "donation"),
          }

          setIsAnimating(true)
          setTimeout(() => setIsAnimating(false), 1000)

          return {
            ...prev,
            total: prev.total + newAmount,
            [newContribution.type === "entry" ? "entryFees" : "communityContributions"]:
              prev[newContribution.type === "entry" ? "entryFees" : "communityContributions"] + newAmount,
            contributors: prev.contributors + 1,
            entries: newContribution.type === "entry" ? prev.entries + 1 : prev.entries,
            recentContributions: [newContribution, ...prev.recentContributions.slice(0, 9)],
            prizes: {
              first: Math.floor((prev.total + newAmount) * 0.6),
              second: Math.floor((prev.total + newAmount) * 0.24),
              third: Math.floor((prev.total + newAmount) * 0.12),
              community: Math.floor((prev.total + newAmount) * 0.038),
              bonus: Math.floor((prev.total + newAmount) * 0.002),
            },
          }
        }
        return prev
      })
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const nextMilestone = prizeData.milestones.find((m) => !m.reached)
  const progressToNext = nextMilestone ? (prizeData.total / nextMilestone.target) * 100 : 100

  return (
    <div className="space-y-6">
      {/* Main Prize Pool Display */}
      <Card className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/30 shadow-xl shadow-yellow-500/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full animate-pulse">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent">
                LIVE PRIZE POOL
              </CardTitle>
              <p className="text-yellow-400/80">Growing in real-time!</p>
            </div>
          </div>

          <div
            className={`text-6xl font-bold text-yellow-300 transition-all duration-500 ${isAnimating ? "scale-110 text-green-300" : ""}`}
          >
            ${prizeData.total.toFixed(2)}
          </div>

          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge className="bg-green-500/20 text-green-300 text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {prizeData.contributors} Contributors
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300 text-lg px-4 py-2">
              <Music className="w-4 h-4 mr-2" />
              {prizeData.entries} Entries
            </Badge>
            <Badge className="bg-red-500/20 text-red-300 text-lg px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              {prizeData.timeLeft}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Prize Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
              <CardContent className="p-4 text-center">
                <Crown className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-300">${prizeData.prizes.first}</div>
                <div className="text-yellow-400/80 text-sm">🥇 1st Place</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-400/20 to-gray-500/20 border border-gray-400/30">
              <CardContent className="p-4 text-center">
                <Award className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-300">${prizeData.prizes.second}</div>
                <div className="text-gray-400/80 text-sm">🥈 2nd Place</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-600/20 to-yellow-600/20 border border-orange-500/30">
              <CardContent className="p-4 text-center">
                <Star className="w-6 h-6 text-orange-300 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-300">${prizeData.prizes.third}</div>
                <div className="text-orange-400/80 text-sm">🥉 3rd Place</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-purple-300 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-300">${prizeData.prizes.community}</div>
                <div className="text-purple-400/80 text-sm">🎵 Community</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30">
              <CardContent className="p-4 text-center">
                <Gift className="w-6 h-6 text-green-300 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-300">${prizeData.prizes.bonus}</div>
                <div className="text-green-400/80 text-sm">🎁 Bonus</div>
              </CardContent>
            </Card>
          </div>

          {/* Pool Composition */}
          <Card className="bg-black/40 border border-green-500/20">
            <CardHeader>
              <CardTitle className="text-green-300 text-lg">Prize Pool Composition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-300">${prizeData.basePool}</div>
                  <div className="text-blue-400/80 text-sm">Base Pool</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-300">${prizeData.entryFees}</div>
                  <div className="text-green-400/80 text-sm">Entry Fees ($5 each)</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-300">${prizeData.communityContributions}</div>
                  <div className="text-purple-400/80 text-sm">Community Donations</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Milestone Progress */}
      {nextMilestone && (
        <Card className="bg-black/80 border border-blue-500/30 shadow-xl shadow-blue-500/10">
          <CardHeader>
            <CardTitle className="text-blue-300 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Next Milestone: ${nextMilestone.target}
            </CardTitle>
            <p className="text-blue-400/80">Unlock: {nextMilestone.reward}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-300">${prizeData.total.toFixed(2)} raised</span>
                <span className="text-blue-300">${(nextMilestone.target - prizeData.total).toFixed(2)} to go</span>
              </div>
              <Progress value={progressToNext} className="h-3 bg-black/60" />
              <p className="text-blue-400/60 text-xs text-center">{Math.round(progressToNext)}% complete</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestone History */}
      <Card className="bg-black/80 border border-purple-500/30 shadow-xl shadow-purple-500/10">
        <CardHeader>
          <CardTitle className="text-purple-300 flex items-center gap-2">
            <Flame className="w-5 h-5" />
            Milestone Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {prizeData.milestones.map((milestone, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  milestone.reached ? "bg-green-500/10 border-green-500/30" : "bg-gray-500/10 border-gray-500/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${milestone.reached ? "bg-green-500/20" : "bg-gray-500/20"}`}>
                    {milestone.reached ? (
                      <Zap className="w-4 h-4 text-green-400" />
                    ) : (
                      <Target className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className={`font-semibold ${milestone.reached ? "text-green-300" : "text-gray-300"}`}>
                      ${milestone.target} Goal
                    </div>
                    <div className={`text-sm ${milestone.reached ? "text-green-400/80" : "text-gray-400/80"}`}>
                      {milestone.reward}
                    </div>
                  </div>
                </div>
                <Badge
                  className={milestone.reached ? "bg-green-500/20 text-green-300" : "bg-gray-500/20 text-gray-400"}
                >
                  {milestone.reached ? "✓ Unlocked" : "Locked"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-black/80 border border-orange-500/30 shadow-xl shadow-orange-500/10">
        <CardHeader>
          <CardTitle className="text-orange-300 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {prizeData.recentContributions.map((contribution, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-black/40 rounded border border-orange-500/20"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1 rounded-full ${
                      contribution.type === "entry" ? "bg-blue-500/20" : "bg-green-500/20"
                    }`}
                  >
                    {contribution.type === "entry" ? (
                      <Music className="w-3 h-3 text-blue-400" />
                    ) : (
                      <Coins className="w-3 h-3 text-green-400" />
                    )}
                  </div>
                  <span className="text-orange-300 text-sm">{contribution.contributor}</span>
                  <span className="text-orange-400/60 text-xs">
                    {contribution.type === "entry" ? "entered contest" : "donated"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300 font-semibold">+${contribution.amount}</span>
                  <span className="text-orange-400/60 text-xs">{contribution.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Community Contribution */}
      <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 shadow-xl shadow-green-500/10">
        <CardContent className="p-6 text-center">
          <h3 className="text-2xl font-bold text-green-300 mb-2">🚀 Boost the Prize Pool! 🚀</h3>
          <p className="text-green-400/80 mb-4">Help grow the community prize pool and support amazing creators!</p>
          <div className="flex justify-center gap-4">
            <Button className="bg-green-500/20 text-green-300 hover:bg-green-500/30">
              <DollarSign className="w-4 h-4 mr-2" />
              Donate $5
            </Button>
            <Button className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30">
              <DollarSign className="w-4 h-4 mr-2" />
              Donate $10
            </Button>
            <Button className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30">
              <DollarSign className="w-4 h-4 mr-2" />
              Custom Amount
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
