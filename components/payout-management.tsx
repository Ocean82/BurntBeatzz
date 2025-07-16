"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Trophy,
  Users,
  Send,
  Eye,
  Download,
  Wallet,
} from "lucide-react"

interface PayoutInfo {
  userId: string
  username: string
  email: string
  rank: number
  amount: number
  status: "pending" | "processing" | "completed" | "failed" | "on_hold"
  stripeAccountId?: string
  payoutMethod: "stripe" | "paypal" | "bank_transfer" | "crypto"
  submittedAt: string
  processedAt?: string
  failureReason?: string
}

interface ContestPayout {
  contestId: string
  contestName: string
  totalPool: number
  totalWinners: number
  payoutDate: string
  status: "calculated" | "processing" | "completed" | "failed"
  winners: PayoutInfo[]
  communityPrizes: PayoutInfo[]
}

export default function PayoutManagement() {
  const [payouts, setPayouts] = useState<ContestPayout[]>([])
  const [selectedPayout, setSelectedPayout] = useState<ContestPayout | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)

  useEffect(() => {
    // Load payout data
    setPayouts([
      {
        contestId: "contest_jan_2024",
        contestName: "January 2024 Beat Battle",
        totalPool: 1247.5,
        totalWinners: 13,
        payoutDate: "2024-02-01",
        status: "calculated",
        winners: [
          {
            userId: "user_123",
            username: "BeatMaker23",
            email: "beatmaker23@email.com",
            rank: 1,
            amount: 748.5,
            status: "pending",
            stripeAccountId: "acct_1234567890",
            payoutMethod: "stripe",
            submittedAt: "2024-01-31T23:59:59Z",
          },
          {
            userId: "user_456",
            username: "FireProducer",
            email: "fire@producer.com",
            rank: 2,
            amount: 299.4,
            status: "pending",
            stripeAccountId: "acct_0987654321",
            payoutMethod: "stripe",
            submittedAt: "2024-01-31T23:45:00Z",
          },
          {
            userId: "user_789",
            username: "SynthWave",
            email: "synth@wave.com",
            rank: 3,
            amount: 149.7,
            status: "pending",
            payoutMethod: "paypal",
            submittedAt: "2024-01-31T23:30:00Z",
          },
        ],
        communityPrizes: [
          {
            userId: "user_101",
            username: "CommunityFav",
            email: "community@fav.com",
            rank: 4,
            amount: 12.48,
            status: "pending",
            payoutMethod: "stripe",
            submittedAt: "2024-01-31T23:15:00Z",
          },
        ],
      },
    ])
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-300 bg-green-500/20 border-green-500/30"
      case "processing":
        return "text-blue-300 bg-blue-500/20 border-blue-500/30"
      case "pending":
        return "text-yellow-300 bg-yellow-500/20 border-yellow-500/30"
      case "failed":
        return "text-red-300 bg-red-500/20 border-red-500/30"
      case "on_hold":
        return "text-orange-300 bg-orange-500/20 border-orange-500/30"
      default:
        return "text-gray-300 bg-gray-500/20 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "processing":
        return <Clock className="w-4 h-4 animate-spin" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "failed":
        return <XCircle className="w-4 h-4" />
      case "on_hold":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const processAllPayouts = async (contestPayout: ContestPayout) => {
    setIsProcessing(true)
    setProcessingProgress(0)
    setSelectedPayout(contestPayout)

    const allPayouts = [...contestPayout.winners, ...contestPayout.communityPrizes]

    for (let i = 0; i < allPayouts.length; i++) {
      const payout = allPayouts[i]

      // Simulate processing each payout
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update progress
      setProcessingProgress(((i + 1) / allPayouts.length) * 100)

      // Update payout status
      setPayouts((prev) =>
        prev.map((p) => {
          if (p.contestId === contestPayout.contestId) {
            return {
              ...p,
              winners: p.winners.map((w) =>
                w.userId === payout.userId
                  ? { ...w, status: "completed" as const, processedAt: new Date().toISOString() }
                  : w,
              ),
              communityPrizes: p.communityPrizes.map((c) =>
                c.userId === payout.userId
                  ? { ...c, status: "completed" as const, processedAt: new Date().toISOString() }
                  : c,
              ),
              status: i === allPayouts.length - 1 ? ("completed" as const) : p.status,
            }
          }
          return p
        }),
      )
    }

    setIsProcessing(false)
    setProcessingProgress(0)
  }

  return (
    <div className="space-y-6">
      {/* Payout Overview */}
      <Card className="bg-black/80 border border-green-500/30 shadow-xl shadow-green-500/10">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Contest Payout Management
          </CardTitle>
          <p className="text-green-400/80">Manage and process prize payouts for contest winners</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="text-2xl font-bold text-green-300">
                ${payouts.reduce((sum, p) => sum + p.totalPool, 0).toFixed(2)}
              </div>
              <div className="text-green-400/80 text-sm">Total Prize Pool</div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-300">
                {payouts.reduce((sum, p) => sum + p.totalWinners, 0)}
              </div>
              <div className="text-blue-400/80 text-sm">Total Winners</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="text-2xl font-bold text-yellow-300">
                {payouts.filter((p) => p.status === "pending" || p.status === "calculated").length}
              </div>
              <div className="text-yellow-400/80 text-sm">Pending Payouts</div>
            </div>
            <div className="text-center p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-300">
                {payouts.filter((p) => p.status === "completed").length}
              </div>
              <div className="text-purple-400/80 text-sm">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {isProcessing && selectedPayout && (
        <Card className="bg-blue-500/10 border border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
              <h3 className="text-blue-300 font-semibold">Processing Payouts: {selectedPayout.contestName}</h3>
            </div>
            <Progress value={processingProgress} className="h-3 mb-2" />
            <p className="text-blue-400/80 text-sm text-center">{Math.round(processingProgress)}% Complete</p>
          </CardContent>
        </Card>
      )}

      {/* Contest Payouts */}
      <div className="space-y-4">
        {payouts.map((contestPayout) => (
          <Card key={contestPayout.contestId} className="bg-black/80 border border-green-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <div>
                    <h3 className="font-semibold text-green-300">{contestPayout.contestName}</h3>
                    <p className="text-green-400/80 text-sm">
                      {contestPayout.totalWinners} winners • ${contestPayout.totalPool.toFixed(2)} total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(contestPayout.status)}>
                    {getStatusIcon(contestPayout.status)}
                    <span className="ml-2">{contestPayout.status.toUpperCase()}</span>
                  </Badge>
                  {(contestPayout.status === "calculated" || contestPayout.status === "processing") && (
                    <Button
                      onClick={() => processAllPayouts(contestPayout)}
                      disabled={isProcessing}
                      className="bg-green-500/20 text-green-300 hover:bg-green-500/30"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Process All Payouts
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Winners */}
              <div>
                <h4 className="text-green-300 font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Contest Winners
                </h4>
                <div className="space-y-2">
                  {contestPayout.winners.map((winner) => (
                    <div
                      key={winner.userId}
                      className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-green-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            winner.rank === 1
                              ? "bg-yellow-500/20 text-yellow-300"
                              : winner.rank === 2
                                ? "bg-gray-400/20 text-gray-300"
                                : "bg-orange-500/20 text-orange-300"
                          }`}
                        >
                          {winner.rank}
                        </div>
                        <div>
                          <div className="font-medium text-green-300">{winner.username}</div>
                          <div className="text-green-400/80 text-sm">{winner.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-green-300">${winner.amount.toFixed(2)}</div>
                          <div className="text-green-400/80 text-xs">{winner.payoutMethod}</div>
                        </div>
                        <Badge className={getStatusColor(winner.status)}>
                          {getStatusIcon(winner.status)}
                          <span className="ml-1">{winner.status}</span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Prizes */}
              {contestPayout.communityPrizes.length > 0 && (
                <div>
                  <h4 className="text-purple-300 font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Community Prizes
                  </h4>
                  <div className="space-y-2">
                    {contestPayout.communityPrizes.map((prize) => (
                      <div
                        key={prize.userId}
                        className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-purple-500/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm">
                            {prize.rank}
                          </div>
                          <div>
                            <div className="font-medium text-purple-300">{prize.username}</div>
                            <div className="text-purple-400/80 text-sm">{prize.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-bold text-purple-300">${prize.amount.toFixed(2)}</div>
                            <div className="text-purple-400/80 text-xs">{prize.payoutMethod}</div>
                          </div>
                          <Badge className={getStatusColor(prize.status)}>
                            {getStatusIcon(prize.status)}
                            <span className="ml-1">{prize.status}</span>
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payout Summary */}
              <div className="flex items-center justify-between pt-4 border-t border-green-500/20">
                <div className="text-green-400/80 text-sm">
                  Contest ended: {new Date(contestPayout.payoutDate).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-green-300 border-green-500/30 bg-transparent">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button size="sm" variant="outline" className="text-blue-300 border-blue-500/30 bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payout Methods Info */}
      <Card className="bg-black/80 border border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-blue-300 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Supported Payout Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-green-300 font-semibold mb-3">✅ Available Methods</h4>
              <ul className="space-y-2 text-green-400/80 text-sm">
                <li>
                  • <strong>Stripe Connect:</strong> Direct bank transfer (1-2 business days)
                </li>
                <li>
                  • <strong>PayPal:</strong> Instant transfer to PayPal account
                </li>
                <li>
                  • <strong>Bank Transfer:</strong> ACH transfer (3-5 business days)
                </li>
                <li>
                  • <strong>Crypto:</strong> USDC/ETH payments (coming soon)
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-blue-300 font-semibold mb-3">📋 Requirements</h4>
              <ul className="space-y-2 text-blue-400/80 text-sm">
                <li>• Valid government-issued ID</li>
                <li>• Verified email address</li>
                <li>• Tax information (for prizes over $600)</li>
                <li>• Connected payout account</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
