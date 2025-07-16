"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coins, Plus, TrendingUp, Download } from "lucide-react"
import Link from "next/link"

interface CreditBalance {
  availableCredits: number
  lifetimeEarned: number
  usedCredits: number
}

export default function CreditBalanceWidget() {
  const [balance, setBalance] = useState<CreditBalance>({
    availableCredits: 285,
    lifetimeEarned: 420,
    usedCredits: 135,
  })

  const [showEarningTip, setShowEarningTip] = useState(false)

  // Load balance on mount
  useEffect(() => {
    loadBalance()
  }, [])

  const loadBalance = async () => {
    try {
      const response = await fetch("/api/purchase/credits?userId=current_user")
      const data = await response.json()
      if (data.balance) {
        setBalance(data.balance)
      }
    } catch (error) {
      console.error("Error loading balance:", error)
    }
  }

  // Calculate dollar value of credits
  const dollarValue = (balance.availableCredits / 100).toFixed(2)

  return (
    <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-green-300 flex items-center gap-2">
              <Coins className="w-5 h-5" />
              {balance.availableCredits.toLocaleString()}
            </div>
            <div className="text-green-400/80 text-sm">Available Credits (~${dollarValue} download value)</div>
          </div>

          <div className="text-right space-y-1">
            <Button
              size="sm"
              onClick={() => setShowEarningTip(!showEarningTip)}
              className="bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30"
            >
              <Plus className="w-4 h-4 mr-1" />
              Earn More
            </Button>
            <Link href="/downloads">
              <Button
                size="sm"
                className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 w-full"
              >
                <Download className="w-4 h-4 mr-1" />
                Use Credits
              </Button>
            </Link>
          </div>
        </div>

        {showEarningTip && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="text-blue-300 text-sm font-medium mb-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Ways to Earn Credits (For Downloads Only)
            </div>
            <div className="text-blue-400/80 text-xs space-y-1">
              <div>• Daily login: 5 credits ($0.05 value)</div>
              <div>• Vote on songs: 2 credits each ($0.02 value)</div>
              <div>• Share creations: 10 credits ($0.10 value)</div>
              <div>• Win contests: 50-500 credits ($0.50-$5.00 value)</div>
              <div>• Refer friends: 100 credits each ($1.00 value)</div>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-500/20">
              <div className="text-blue-300 text-xs font-medium">💡 Remember:</div>
              <div className="text-blue-400/80 text-xs">
                All features are FREE to use! Credits are only for downloading your songs.
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <span>Lifetime earned: {balance.lifetimeEarned}</span>
          <span>Used for downloads: {balance.usedCredits}</span>
        </div>
      </CardContent>
    </Card>
  )
}
