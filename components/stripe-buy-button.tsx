"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Music, CheckCircle } from "lucide-react"

interface StripeBuyButtonProps {
  songTitle: string
  artist: string
  price: number
  format: string
  quality: string
  onPurchaseComplete?: () => void
}

export function StripeBuyButton({
  songTitle,
  artist,
  price,
  format,
  quality,
  onPurchaseComplete,
}: StripeBuyButtonProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Load Stripe Buy Button script
    const script = document.createElement("script")
    script.src = "https://js.stripe.com/v3/buy-button.js"
    script.async = true
    script.onload = () => {
      setIsLoaded(true)
      console.log("Stripe Buy Button script loaded")
    }
    script.onerror = () => {
      console.error("Failed to load Stripe Buy Button script")
    }
    document.head.appendChild(script)

    // Listen for Stripe events
    const handleStripeEvent = (event: any) => {
      if (event.detail?.type === "checkout.session.completed") {
        setIsProcessing(false)
        onPurchaseComplete?.()
      }
    }

    window.addEventListener("stripe-buy-button", handleStripeEvent)

    return () => {
      window.removeEventListener("stripe-buy-button", handleStripeEvent)
      const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]')
      if (existingScript && document.head.contains(existingScript)) {
        document.head.removeChild(existingScript)
      }
    }
  }, [onPurchaseComplete])

  return (
    <Card className="w-full max-w-md bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <img src="/logos/burnt-beats-cute-fox.jpeg" alt="Burnt Beats" className="w-16 h-16 rounded-lg shadow-lg" />
        </div>
        <CardTitle className="text-orange-300 flex items-center justify-center gap-2">
          <Music className="w-5 h-5" />
          Download Track
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Song Details */}
        <div className="text-center space-y-2">
          <h3 className="font-bold text-white text-lg">{songTitle}</h3>
          <p className="text-orange-200">by {artist}</p>

          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-orange-500/50 text-orange-300">
              {format}
            </Badge>
            <Badge variant="outline" className="border-orange-500/50 text-orange-300">
              {quality}
            </Badge>
            <Badge variant="outline" className="border-green-500/50 text-green-300">
              Commercial License
            </Badge>
          </div>
        </div>

        {/* Price Display */}
        <div className="text-center bg-black/40 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-400">${price.toFixed(2)}</div>
          <p className="text-sm text-gray-400">One-time purchase • No subscription</p>
          <p className="text-xs text-gray-500 mt-1">Instant download • Full ownership</p>
        </div>

        {/* What You Get */}
        <div className="bg-black/20 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            What you'll receive:
          </h4>
          <ul className="text-xs text-gray-300 space-y-1 ml-6">
            <li>
              • High-quality {format} file ({quality})
            </li>
            <li>• Commercial license included</li>
            <li>• No watermarks or restrictions</li>
            <li>• Instant download after payment</li>
            <li>• 100% ownership rights</li>
          </ul>
        </div>

        {/* Stripe Buy Button */}
        <div className="space-y-3">
          {isLoaded ? (
            <div className="stripe-buy-button-container flex justify-center">
              <stripe-buy-button
                buy-button-id="buy_btn_1RdOETP5PtizRku7GPX5AMSF"
                publishable-key="pk_test_51RbydVP5PtizRku72FvE6o5dl2H1sDOVaDQMkM8Kq2AC7lYYKXMgPKJNpWb6bMDwb00MvbyE4Xf9lnUxEcn5FSa600sibwIAB9"
              />
            </div>
          ) : (
            <div className="h-12 bg-orange-500/20 rounded animate-pulse flex items-center justify-center">
              <span className="text-orange-300">Loading secure checkout...</span>
            </div>
          )}

          {isProcessing && <div className="text-center text-blue-400 text-sm">Processing your purchase...</div>}
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pt-2 border-t border-orange-500/20">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-green-400" />
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-blue-400" />
            <span>Stripe Protected</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">Accepted Payment Methods</p>
          <div className="flex justify-center gap-2">
            <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
              VISA
            </div>
            <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
              MC
            </div>
            <div className="w-8 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
              AMEX
            </div>
            <div className="w-8 h-5 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">
              PP
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// TypeScript declaration for the custom Stripe element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "stripe-buy-button": {
        "buy-button-id": string
        "publishable-key": string
      }
    }
  }
}
