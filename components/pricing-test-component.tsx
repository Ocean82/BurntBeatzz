"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Calculator,
  Music,
  Download,
  Crown,
  Star,
  Headphones,
  TestTube,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { PricingServiceV2 } from "@/lib/services/pricing-service-v2"

export default function PricingTestComponent() {
  const [fileSizeMB, setFileSizeMB] = useState(15.5)
  const [includeLicense, setIncludeLicense] = useState(false)
  const [testSizes] = useState([
    { name: "Tiny Demo", size: 2.5, description: "Very small demo file" },
    { name: "Small Track", size: 5.0, description: "Exactly 5MB boundary" },
    { name: "Standard Song", size: 7.8, description: "Under 9MB - Base Song" },
    { name: "9MB Boundary", size: 9.0, description: "Exactly 9MB - Premium tier" },
    { name: "High Quality", size: 15.5, description: "Premium quality track" },
    { name: "20MB Boundary", size: 20.0, description: "Exactly 20MB - Premium tier" },
    { name: "Ultra Track", size: 25.7, description: "Over 20MB - Ultra tier" },
    { name: "Massive File", size: 45.2, description: "Very large file" },
  ])

  const currentPricing = PricingServiceV2.calculateTotalPrice(fileSizeMB, includeLicense)
  const allTiers = PricingServiceV2.getDownloadTiers()
  const licenseOptions = PricingServiceV2.getLicensingOptions()

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case "Bonus Track":
        return <TestTube className="w-4 h-4" />
      case "Base Song":
        return <Music className="w-4 h-4" />
      case "Premium Song":
        return <Headphones className="w-4 h-4" />
      case "Ultra Super Great Amazing Song":
        return <Crown className="w-4 h-4" />
      default:
        return <Download className="w-4 h-4" />
    }
  }

  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case "Bonus Track":
        return "bg-gray-500"
      case "Base Song":
        return "bg-blue-500"
      case "Premium Song":
        return "bg-purple-500"
      case "Ultra Super Great Amazing Song":
        return "bg-gradient-to-r from-orange-500 via-red-500 to-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPricingLogicText = (size: number): string => {
    if (size <= 5) {
      return "≤ 5MB → 🧪 Bonus Track ($0.99)"
    } else if (size < 9) {
      return "< 9MB → 🔉 Base Song ($1.99)"
    } else if (size >= 9 && size <= 20) {
      return "9MB-20MB → 🎧 Premium Song ($4.99)"
    } else {
      return "> 20MB → 💽 Ultra Super Great Amazing Song ($8.99)"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-green-300 flex items-center gap-3">
              <Calculator className="w-8 h-8" />
              Burnt Beats Pricing Test
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">EXACT PRICING GUIDE</Badge>
            </CardTitle>
            <p className="text-green-400/60">
              Test the exact pricing logic from your pricing guide with different file sizes
            </p>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* File Size Input */}
          <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-300 flex items-center gap-2">
                <Music className="w-5 h-5" />
                File Size Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Manual Input */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fileSize" className="text-green-300 text-sm font-medium">
                    File Size (MB)
                  </Label>
                  <Input
                    id="fileSize"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    value={fileSizeMB}
                    onChange={(e) => setFileSizeMB(Number.parseFloat(e.target.value) || 0.1)}
                    className="bg-black/40 border-green-500/30 text-green-100 text-lg font-mono"
                  />
                </div>

                {/* Slider */}
                <div className="space-y-2">
                  <Label className="text-green-300 text-sm">Quick Adjust</Label>
                  <Slider
                    value={[fileSizeMB]}
                    onValueChange={(value) => setFileSizeMB(value[0])}
                    max={50}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-green-400/60">
                    <span>0.1 MB</span>
                    <span>50 MB</span>
                  </div>
                </div>

                {/* Current Logic Display */}
                <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="text-green-300 font-medium text-sm">Pricing Logic:</div>
                  <div className="text-green-400 text-sm mt-1">{getPricingLogicText(fileSizeMB)}</div>
                </div>
              </div>

              {/* Quick Test Sizes */}
              <div className="space-y-3">
                <Label className="text-green-300 text-sm font-medium">Test Boundary Cases</Label>
                <div className="grid grid-cols-1 gap-2">
                  {testSizes.map((test, index) => (
                    <Button
                      key={index}
                      onClick={() => setFileSizeMB(test.size)}
                      variant="outline"
                      className="justify-start bg-black/20 border-green-500/30 text-green-100 hover:bg-green-500/10"
                    >
                      <div className="text-left">
                        <div className="font-medium">
                          {test.name} - {test.size}MB
                        </div>
                        <div className="text-xs text-green-400/60">{test.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* License Toggle */}
              <div className="flex items-center justify-between p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-orange-400" />
                  <div>
                    <div className="text-orange-300 font-medium">🪪 Full License</div>
                    <div className="text-orange-400/60 text-sm">Complete ownership + $10.00</div>
                  </div>
                </div>
                <Switch checked={includeLicense} onCheckedChange={setIncludeLicense} />
              </div>
            </CardContent>
          </Card>

          {/* Current Pricing Result */}
          <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-300 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Pricing Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selected Tier */}
              <div className="border-2 border-green-400 bg-green-500/10 rounded-lg p-4 shadow-lg shadow-green-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${getTierColor(currentPricing.tier.name)}`}>
                    {getTierIcon(currentPricing.tier.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-100 flex items-center gap-2">
                      {currentPricing.tier.emoji} {currentPricing.tier.name}
                      <Badge className="bg-green-500 text-white">SELECTED</Badge>
                    </h3>
                    <p className="text-green-400/80 text-sm">{currentPricing.tier.quality}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-300">${currentPricing.tier.price.toFixed(2)}</div>
                  </div>
                </div>
                <p className="text-green-400/60 text-sm mb-3">{currentPricing.tier.description}</p>
                <div className="flex flex-wrap gap-2">
                  {currentPricing.tier.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-green-500/30 text-green-400">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-black/60 border border-green-500/20 rounded-lg p-4">
                <h4 className="text-green-300 font-medium mb-3">Price Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-400">File Size:</span>
                    <span className="text-green-100 font-mono">{fileSizeMB.toFixed(1)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Tier Logic:</span>
                    <span className="text-green-100 text-sm">{getPricingLogicText(fileSizeMB)}</span>
                  </div>
                  <Separator className="bg-green-500/20" />
                  <div className="flex justify-between">
                    <span className="text-green-300">Download Price:</span>
                    <span className="text-green-300 font-bold">${currentPricing.downloadPrice.toFixed(2)}</span>
                  </div>
                  {includeLicense && (
                    <div className="flex justify-between">
                      <span className="text-orange-300">Full License:</span>
                      <span className="text-orange-300 font-bold">+${currentPricing.licensePrice.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator className="bg-green-500/20" />
                  <div className="flex justify-between text-lg">
                    <span className="text-green-100 font-semibold">Total:</span>
                    <span className="text-green-300 font-bold text-xl">${currentPricing.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* License Details */}
              {includeLicense && (
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                  <h4 className="text-orange-300 font-medium mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Full License Rights
                  </h4>
                  <div className="space-y-2">
                    {licenseOptions[1].rights.map((right, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-orange-300">
                        <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{right}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Exact Pricing Guide Display */}
        <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-300 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Exact Pricing Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black/40 border border-green-500/20 rounded-lg p-4">
              <div className="space-y-3 text-sm">
                <div className="border-b border-orange-500/30 pb-3">
                  <div className="text-orange-300 font-medium text-base">🪪 Full License — $10.00</div>
                  <div className="text-orange-400/80 mt-1">Includes 1 full license per generated track.</div>
                  <div className="text-orange-400/60 text-xs mt-1">
                    Once purchased, this grants you complete ownership of your track. You're free to use, modify,
                    distribute, and monetize your music on any platform—streaming services, social media, film, games,
                    and commercial projects. Burnt Beats retains zero rights and will never require additional payments
                    or royalties.
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/20">
                    <div className="text-orange-300 font-medium">💽 Ultra Super Great Amazing Song — $8.99</div>
                    <div className="text-orange-400/80 text-sm">High-quality track over 20MB</div>
                    <div className="text-orange-400/60 text-xs">Perfect for deluxe or multitrack creations.</div>
                  </div>

                  <div className="p-3 rounded bg-purple-900/20 border border-purple-500/20">
                    <div className="text-purple-300 font-medium">🎧 Premium Song — $4.99</div>
                    <div className="text-purple-400/80 text-sm">Generated tracks between 9MB and 20MB</div>
                  </div>

                  <div className="p-3 rounded bg-blue-900/20 border border-blue-500/20">
                    <div className="text-blue-300 font-medium">🔉 Base Song — $1.99</div>
                    <div className="text-blue-400/80 text-sm">Tracks under 9MB</div>
                  </div>

                  <div className="p-3 rounded bg-gray-900/20 border border-gray-500/20">
                    <div className="text-gray-300 font-medium">🧪 Bonus Track — $0.99</div>
                    <div className="text-gray-400/80 text-sm">Demo version with watermark overlay</div>
                    <div className="text-gray-400/60 text-xs">
                      Test the vibe before you commit. Perfect for previewing.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results Summary */}
        <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Test Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-900/20 border border-green-500/20 rounded-lg">
                <div className="text-2xl font-bold text-green-300 mb-1">{fileSizeMB.toFixed(1)} MB</div>
                <div className="text-sm text-green-400">File Size</div>
              </div>
              <div className="text-center p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                <div className="text-lg font-bold text-blue-300 mb-1">
                  {currentPricing.tier.emoji} {currentPricing.tier.name}
                </div>
                <div className="text-sm text-blue-400">Selected Tier</div>
              </div>
              <div className="text-center p-4 bg-purple-900/20 border border-purple-500/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-300 mb-1">
                  ${currentPricing.downloadPrice.toFixed(2)}
                </div>
                <div className="text-sm text-purple-400">Download Price</div>
              </div>
              <div className="text-center p-4 bg-orange-900/20 border border-orange-500/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-300 mb-1">${currentPricing.totalPrice.toFixed(2)}</div>
                <div className="text-sm text-orange-400">Total Price</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-900/40 border border-gray-500/20 rounded-lg">
              <h4 className="text-gray-300 font-medium mb-2">Exact Pricing Logic from Guide:</h4>
              <div className="text-sm text-gray-400 space-y-1">
                <div>• Files ≤ 5MB → 🧪 Bonus Track ($0.99) - Demo with watermark</div>
                <div>• Files &lt; 9MB → 🔉 Base Song ($1.99) - Tracks under 9MB</div>
                <div>• Files 9MB-20MB → 🎧 Premium Song ($4.99) - Between 9MB and 20MB</div>
                <div>• Files &gt; 20MB → 💽 Ultra Super Great Amazing Song ($8.99) - Over 20MB</div>
                <div>• 🪪 Full License adds $10.00 - Complete ownership</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
