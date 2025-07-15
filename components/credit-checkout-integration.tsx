"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Coins, CreditCard, Download, Shield, AlertCircle, CheckCircle } from "lucide-react"
import { PricingServiceV2 } from "@/lib/services/pricing-service-v2"

interface CreditCheckoutProps {
  songId: number
  fileSizeMB: number
  songTitle: string
  userId: string
  onPurchaseComplete: (result: any) => void
}

export default function CreditCheckoutIntegration({
  songId,
  fileSizeMB,
  songTitle,
  userId,
  onPurchaseComplete,
}: CreditCheckoutProps) {
  const [includeLicense, setIncludeLicense] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"credits" | "card">("card")
  const [userCredits, setUserCredits] = useState(285) // This would be loaded from API
  const [isProcessing, setIsProcessing] = useState(false)

  // Calculate pricing using existing service
  const currentTier = PricingServiceV2.calculateDownloadPrice(fileSizeMB)
  const totalPricing = PricingServiceV2.calculateTotalPrice(fileSizeMB, includeLicense)
  const requiredCredits = Math.round(totalPricing.totalPrice * 100) // Convert dollars to credits

  const canAffordWithCredits = userCredits >= requiredCredits

  const handlePurchase = async () => {
    setIsProcessing(true)

    try {
      if (paymentMethod === "credits") {
        // Use credits for purchase
        const response = await fetch("/api/purchase/credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            songId,
            tier: currentTier.tier.name,
            includeLicense,
            userId,
            creditCost: requiredCredits,
          }),
        })

        const result = await response.json()

        if (result.success) {
          setUserCredits(result.remainingCredits)
          onPurchaseComplete({
            success: true,
            downloadToken: result.downloadToken,
            paymentMethod: "credits",
            creditsUsed: requiredCredits,
          })
        } else {
          alert(`Credit purchase failed: ${result.error}`)
        }
      } else {
        // Use regular Stripe payment
        const response = await fetch("/api/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            songId,
            userId,
            tier: currentTier.tier.name,
            includeLicense,
            paymentMethodId: "card", // This would be actual Stripe payment method
          }),
        })

        const result = await response.json()

        if (result.success) {
          onPurchaseComplete({
            success: true,
            downloadToken: result.downloadToken,
            paymentMethod: "card",
            amountPaid: totalPricing.totalPrice,
          })
        } else {
          alert(`Card purchase failed: ${result.error}`)
        }
      }
    } catch (error) {
      console.error("Purchase error:", error)
      alert("Purchase failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
      <CardHeader>
        <CardTitle className="text-green-300 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Download "{songTitle}"
        </CardTitle>
        <p className="text-green-400/60 text-sm">
          File size: {fileSizeMB.toFixed(1)} MB • Tier: {currentTier.tier.emoji} {currentTier.tier.name}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Method Selection */}
        <div className="space-y-4">
          <h3 className="text-green-300 font-semibold">Choose Payment Method</h3>

          {/* Credits Option */}
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              paymentMethod === "credits"
                ? "border-green-500 bg-green-500/10"
                : canAffordWithCredits
                  ? "border-gray-500/30 hover:border-green-500/50"
                  : "border-red-500/30 bg-red-500/5 cursor-not-allowed"
            }`}
            onClick={() => canAffordWithCredits && setPaymentMethod("credits")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coins className={`w-5 h-5 ${canAffordWithCredits ? "text-green-400" : "text-red-400"}`} />
                <div>
                  <div className="text-green-300 font-medium">Pay with Credits</div>
                  <div className="text-green-400/80 text-sm">
                    You have {userCredits.toLocaleString()} credits available
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${canAffordWithCredits ? "text-green-300" : "text-red-400"}`}>
                  {requiredCredits.toLocaleString()} credits
                </div>
                <div className="text-gray-400 text-sm">
                  {canAffordWithCredits ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Available
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Insufficient
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card Option */}
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              paymentMethod === "card"
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-500/30 hover:border-blue-500/50"
            }`}
            onClick={() => setPaymentMethod("card")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-blue-300 font-medium">Pay with Card</div>
                  <div className="text-blue-400/80 text-sm">Secure payment via Stripe</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-300">${totalPricing.totalPrice.toFixed(2)}</div>
                <div className="text-gray-400 text-sm">USD</div>
              </div>
            </div>
          </div>
        </div>

        {/* Download Tier Display */}
        <div className="border border-green-500/30 bg-green-500/10 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">{currentTier.tier.emoji}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-100">{currentTier.tier.name}</h3>
              <p className="text-green-400/80 text-sm">{currentTier.tier.quality}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-300">
                {paymentMethod === "credits"
                  ? `${Math.round(currentTier.tier.price * 100)} credits`
                  : `$${currentTier.tier.price.toFixed(2)}`}
              </div>
            </div>
          </div>
          <p className="text-green-400/60 text-sm mb-3">{currentTier.tier.description}</p>
          <div className="flex flex-wrap gap-2">
            {currentTier.tier.features.map((feature, index) => (
              <Badge key={index} variant="outline" className="text-xs border-green-500/30 text-green-400">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Full License Option */}
        <div className="border border-orange-500/30 rounded-lg p-4 bg-gradient-to-r from-orange-900/20 to-red-900/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-orange-400" />
              <div>
                <h3 className="font-semibold text-orange-300">🪪 Full License</h3>
                <p className="text-orange-400/60 text-sm">Complete ownership and commercial rights</p>
              </div>
            </div>
            <Switch checked={includeLicense} onCheckedChange={setIncludeLicense} />
          </div>

          {includeLicense && (
            <div className="space-y-2">
              <p className="text-orange-400/80 text-sm font-medium">Complete ownership includes:</p>
              <div className="space-y-1">
                {PricingServiceV2.getLicensingOptions()[1]
                  .rights.slice(0, 3)
                  .map((right, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs text-orange-300">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{right}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Total Price Summary */}
        <div className="bg-black/60 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-300">
              {currentTier.tier.emoji} {currentTier.tier.name}
            </span>
            <span className="text-green-300">
              {paymentMethod === "credits"
                ? `${Math.round(currentTier.tier.price * 100)} credits`
                : `$${currentTier.tier.price.toFixed(2)}`}
            </span>
          </div>
          {includeLicense && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-300">🪪 Full License</span>
              <span className="text-orange-300">{paymentMethod === "credits" ? "+1000 credits" : "+$10.00"}</span>
            </div>
          )}
          <Separator className="bg-green-500/20 my-2" />
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-green-100">Total</span>
            <span className="text-2xl font-bold text-green-300">
              {paymentMethod === "credits"
                ? `${requiredCredits.toLocaleString()} credits`
                : `$${totalPricing.totalPrice.toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Purchase Button */}
        <Button
          onClick={handlePurchase}
          disabled={isProcessing || (paymentMethod === "credits" && !canAffordWithCredits)}
          className="w-full h-12 bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            "Processing..."
          ) : paymentMethod === "credits" ? (
            canAffordWithCredits ? (
              <>
                <Coins className="w-5 h-5 mr-2" />
                Purchase with {requiredCredits.toLocaleString()} Credits
              </>
            ) : (
              "Insufficient Credits"
            )
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Purchase for ${totalPricing.totalPrice.toFixed(2)}
            </>
          )}
        </Button>

        {/* Credit Balance Display */}
        {paymentMethod === "credits" && (
          <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="text-green-300 text-sm">
              After purchase: {(userCredits - requiredCredits).toLocaleString()} credits remaining
            </div>
          </div>
        )}

        {/* Demo Notice */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg">
          <div className="text-blue-300 font-medium mb-1">🎵 Free Demo Available</div>
          <p className="text-blue-400/60 text-sm">
            Listen to a watermarked demo before purchasing. All features are free to use - you only pay for downloads!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
