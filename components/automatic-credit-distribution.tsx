"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Coins, Trophy, Clock, CheckCircle, AlertCircle, Users, TrendingUp } from "lucide-react"

interface ContestStatus {
  id: string
  status: "active" | "ended" | "distributing" | "completed"
  endDate: string
  participantCount: number
  winnersCount: number
  totalCreditsAwarded: number
  distributionProgress: number
}

interface Winner {
  rank: number
  userId: string
  username: string
  songTitle: string
  likes: number
  plays: number
  creditsAwarded: number
  distributionStatus: "pending" | "completed" | "failed"
}

export default function AutomaticCreditDistribution() {
  const [contestStatus, setContestStatus] = useState<ContestStatus>({
    id: "contest_2024_7",
    status: "ended",
    endDate: "2024-07-31T23:59:59Z",
    participantCount: 156,
    winnersCount: 10,
    totalCreditsAwarded: 0,
    distributionProgress: 0,
  })

  const [winners, setWinners] = useState<Winner[]>([
    {
      rank: 1,
      userId: "user_123",
      username: "BeatMaster2024",
      songTitle: "Neon Dreams",
      likes: 847,
      plays: 2341,
      creditsAwarded: 200,
      distributionStatus: "completed",
    },
    {
      rank: 2,
      userId: "user_456",
      username: "SynthWave_Pro",
      songTitle: "Digital Horizon",
      likes: 623,
      plays: 1876,
      creditsAwarded: 120,
      distributionStatus: "completed",
    },
    {
      rank: 3,
      userId: "user_789",
      username: "MelodyMaker",
      songTitle: "Cosmic Journey",
      likes: 445,
      plays: 1234,
      creditsAwarded: 80,
      distributionStatus: "completed",
    },
    {
      rank: 4,
      userId: "user_101",
      username: "RhythmKing",
      songTitle: "Bass Drop City",
      likes: 334,
      plays: 987,
      creditsAwarded: 40,
      distributionStatus: "completed",
    },
    {
      rank: 5,
      userId: "user_202",
      username: "ElectroVibes",
      songTitle: "Future Funk",
      likes: 298,
      plays: 876,
      creditsAwarded: 40,
      distributionStatus: "completed",
    },
  ])

  const [isDistributing, setIsDistributing] = useState(false)
  const [distributionComplete, setDistributionComplete] = useState(true)

  // Simulate automatic credit distribution
  const simulateDistribution = async () => {
    setIsDistributing(true)
    setDistributionComplete(false)

    // Reset distribution status
    setWinners((prev) => prev.map((w) => ({ ...w, distributionStatus: "pending" as const })))
    setContestStatus((prev) => ({ ...prev, status: "distributing", distributionProgress: 0 }))

    // Simulate distribution process
    for (let i = 0; i < winners.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800)) // Simulate processing time

      // Update winner status
      setWinners((prev) =>
        prev.map((w, index) => (index === i ? { ...w, distributionStatus: "completed" as const } : w)),
      )

      // Update progress
      const progress = ((i + 1) / winners.length) * 100
      setContestStatus((prev) => ({
        ...prev,
        distributionProgress: progress,
        totalCreditsAwarded: prev.totalCreditsAwarded + winners[i].creditsAwarded,
      }))
    }

    // Complete distribution
    setContestStatus((prev) => ({
      ...prev,
      status: "completed",
      distributionProgress: 100,
    }))
    setIsDistributing(false)
    setDistributionComplete(true)
  }

  const totalCreditsDistributed = winners.reduce((sum, w) => sum + w.creditsAwarded, 0)
  const completedDistributions = winners.filter((w) => w.distributionStatus === "completed").length

  return (
    <div className="space-y-6">
      {/* Contest Status Overview */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-300 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Monthly Contest - July 2024
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-300">{contestStatus.participantCount}</div>
              <div className="text-purple-400/80 text-sm">Total Participants</div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-300">{contestStatus.winnersCount}</div>
              <div className="text-blue-400/80 text-sm">Winners</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="text-2xl font-bold text-green-300 flex items-center justify-center gap-1">
                <Coins className="w-5 h-5" />
                {totalCreditsDistributed}
              </div>
              <div className="text-green-400/80 text-sm">Credits Awarded</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="text-2xl font-bold text-yellow-300">${(totalCreditsDistributed / 20).toFixed(2)}</div>
              <div className="text-yellow-400/80 text-sm">Total Value</div>
            </div>
          </div>

          {/* Distribution Status */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Credit Distribution Status</span>
              <Badge
                className={`${
                  contestStatus.status === "completed"
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : contestStatus.status === "distributing"
                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                      : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                }`}
              >
                {contestStatus.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                {contestStatus.status === "distributing" && <Clock className="w-3 h-3 mr-1" />}
                {contestStatus.status.charAt(0).toUpperCase() + contestStatus.status.slice(1)}
              </Badge>
            </div>
            <Progress value={contestStatus.distributionProgress} className="h-2" />
            <div className="text-sm text-gray-400 mt-1">
              {completedDistributions} of {winners.length} winners credited
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winners List */}
      <Card className="bg-black/80 border border-gray-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Contest Winners & Credit Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {winners.map((winner) => (
              <div
                key={winner.userId}
                className={`p-4 border rounded-lg transition-all ${
                  winner.distributionStatus === "completed"
                    ? "border-green-500/30 bg-green-500/5"
                    : winner.distributionStatus === "pending"
                      ? "border-yellow-500/30 bg-yellow-500/5"
                      : "border-gray-500/30 bg-gray-500/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">#{winner.rank}</div>
                      <div className="text-xs text-gray-400">Rank</div>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{winner.username}</div>
                      <div className="text-gray-400 text-sm">"{winner.songTitle}"</div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>❤️ {winner.likes} likes</span>
                        <span>▶️ {winner.plays} plays</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-green-300 font-bold flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      {winner.creditsAwarded} credits
                    </div>
                    <div className="text-gray-400 text-sm">~${(winner.creditsAwarded / 20).toFixed(2)} value</div>
                    <Badge
                      className={`mt-2 ${
                        winner.distributionStatus === "completed"
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : winner.distributionStatus === "pending"
                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            : "bg-red-500/20 text-red-300 border-red-500/30"
                      }`}
                    >
                      {winner.distributionStatus === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {winner.distributionStatus === "pending" && <Clock className="w-3 h-3 mr-1" />}
                      {winner.distributionStatus === "failed" && <AlertCircle className="w-3 h-3 mr-1" />}
                      {winner.distributionStatus.charAt(0).toUpperCase() + winner.distributionStatus.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Distribution Controls */}
          <div className="mt-6 pt-6 border-t border-gray-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-semibold">Automatic Distribution</h4>
                <p className="text-gray-400 text-sm">
                  Credits are automatically added to winner accounts when contests end
                </p>
              </div>
              <Button
                onClick={simulateDistribution}
                disabled={isDistributing || distributionComplete}
                className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30"
              >
                {isDistributing
                  ? "Distributing..."
                  : distributionComplete
                    ? "Distribution Complete"
                    : "Start Distribution"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Model Info */}
      <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Profitable Credit Economy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-green-300 font-semibold mb-3">💰 Revenue Model</h4>
              <ul className="space-y-2 text-green-400/80 text-sm">
                <li>• Credits cost 25% more than cash equivalent</li>
                <li>• Contest prizes: ~$15/month total cost</li>
                <li>• Daily rewards: ~$5/month total cost</li>
                <li>• Credit purchases generate 25% profit margin</li>
              </ul>
            </div>
            <div>
              <h4 className="text-blue-300 font-semibold mb-3">📊 Key Metrics</h4>
              <ul className="space-y-2 text-blue-400/80 text-sm">
                <li>• 20 credits = $1.00 USD value</li>
                <li>• Credits expire after 6 months</li>
                <li>• Max 50 credits earned per day</li>
                <li>• Automatic distribution ensures engagement</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
