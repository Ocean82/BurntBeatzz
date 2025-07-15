"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Music, Mic, Database, Crown, Zap, Star } from "lucide-react"

interface UserPlanDisplayProps {
  currentPlan: "free" | "basic" | "pro" | "enterprise"
  songsGenerated: number
  monthlyLimit: number
  onUpgrade: () => void
}

const PLAN_FEATURES = {
  free: {
    name: "Free Plan",
    color: "from-gray-500 to-gray-600",
    icon: <Music className="w-5 h-5" />,
    features: [
      "2 full-length songs/month",
      "No voice cloning",
      "No storage",
      "No editing tools",
      "No TTS functionality",
    ],
  },
  basic: {
    name: "Basic Plan",
    color: "from-blue-500 to-blue-600",
    icon: <Mic className="w-5 h-5" />,
    price: "$6.99/month",
    features: [
      "4 songs per month",
      "Basic editing tools",
      "1 voice clone sample",
      "Basic TTS functionality",
      "5 songs storage",
      "Song library access",
    ],
  },
  pro: {
    name: "Pro Plan",
    color: "from-purple-500 to-purple-600",
    icon: <Star className="w-5 h-5" />,
    price: "$12.99/month",
    features: [
      "Unlimited song generation",
      "Advanced editing tools",
      "Multiple voice samples",
      "Advanced TTS with emotions",
      "Analytics dashboard",
      "Version control",
      "Basic collaboration",
      "50 songs storage",
      "Multiple download formats",
    ],
  },
  enterprise: {
    name: "Enterprise Plan",
    color: "from-orange-500 via-red-500 to-green-500",
    icon: <Crown className="w-5 h-5" />,
    price: "$39.99/month",
    features: [
      "All Pro features",
      "Priority support",
      "Custom integrations",
      "API access",
      "Real-time collaboration",
      "Music theory tools",
      "Social features",
      "Unlimited storage",
      "Commercial use rights",
    ],
  },
}

function UserPlanDisplay({ currentPlan, songsGenerated, monthlyLimit, onUpgrade }: UserPlanDisplayProps) {
  const plan = PLAN_FEATURES[currentPlan]
  const usagePercentage = monthlyLimit > 0 ? (songsGenerated / monthlyLimit) * 100 : 0

  return (
    <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${plan.color}`}>{plan.icon}</div>
            <div>
              <CardTitle className="text-green-300">{plan.name}</CardTitle>
              {plan.price && <p className="text-green-400/60 text-sm">{plan.price}</p>}
            </div>
          </div>
          {currentPlan !== "enterprise" && (
            <Button
              onClick={onUpgrade}
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Zap className="w-4 h-4 mr-1" />
              Upgrade
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Display for Free/Basic Plans */}
        {currentPlan !== "pro" && currentPlan !== "enterprise" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-400/60">Songs this month</span>
              <span className="text-green-300">
                {songsGenerated} / {monthlyLimit}
              </span>
            </div>
            <div className="w-full bg-black/60 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${
                  usagePercentage >= 100
                    ? "from-red-500 to-red-600"
                    : usagePercentage >= 75
                      ? "from-orange-500 to-red-500"
                      : "from-green-500 to-blue-500"
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            {usagePercentage >= 100 && (
              <p className="text-red-400 text-xs">Monthly limit reached! Upgrade for unlimited generation.</p>
            )}
          </div>
        )}

        {/* Plan Features */}
        <div className="space-y-2">
          <h4 className="text-green-300 font-medium text-sm">Plan Features:</h4>
          <div className="space-y-1">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-green-400/80">
                <div className="w-1 h-1 bg-green-400 rounded-full" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Pay-Per-Download Notice */}
        <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-green-400" />
            <span className="text-green-300 font-medium text-sm">Pay-Per-Download</span>
          </div>
          <p className="text-green-400/60 text-xs">
            No subscriptions for downloads! Pay only for what you create and own it forever.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export { UserPlanDisplay }
