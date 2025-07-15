"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Music,
  Play,
  Pause,
  Download,
  CreditCard,
  CheckCircle,
  Clock,
  Volume2,
  Award,
  Shield,
  TestTube,
  Headphones,
  Crown,
  Sparkles,
} from "lucide-react"
import { useSongGeneration, type SongGenerationRequest } from "@/hooks/use-song-generation"
import { PricingServiceV2 } from "@/lib/services/pricing-service-v2"

interface MockSong {
  id: string
  title: string
  fileSizeMB: number
  audioUrl: string
  duration: number
  qualityScore: number
}

export default function CompleteFlowTest() {
  const [currentStep, setCurrentStep] = useState<"generate" | "pricing" | "purchase" | "complete">("generate")
  const [isPlaying, setIsPlaying] = useState(false)
  const [includeLicense, setIncludeLicense] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [purchaseComplete, setPurchaseComplete] = useState(false)

  // Mock generated song data
  const [mockSong, setMockSong] = useState<MockSong | null>(null)

  const [formData, setFormData] = useState<SongGenerationRequest>({
    title: "Neon Nights",
    lyrics: `[Verse 1]
City lights are calling out my name
Electric dreams in neon frames
Walking through the midnight rain
Nothing feels quite the same

[Chorus]
These neon nights, they shine so bright
Illuminating all my dreams tonight
In the glow of electric light
Everything's gonna be alright

[Verse 2]
Synthesizers fill the air
Digital love everywhere
In this world beyond compare
We're dancing without a care

[Bridge]
When the morning comes around
And the neon lights fade down
We'll remember what we found
In this electric playground`,
    genre: "Electronic",
    style: "Synthwave",
    tempo: 120,
    key: "C minor",
    timeSignature: "4/4",
    mood: "Energetic",
    complexity: "moderate",
    includeStems: true,
    commercialRights: true,
    qualityLevel: "premium",
  })

  const { isGenerating, progress, error, generateSong, clearError } = useSongGeneration()

  const handleGenerate = async () => {
    try {
      clearError()

      // Simulate song generation with realistic progress
      await new Promise((resolve) => {
        let currentProgress = 0
        const interval = setInterval(() => {
          currentProgress += Math.random() * 15
          if (currentProgress >= 100) {
            clearInterval(interval)

            // Create mock song with realistic file size
            const mockFileSizes = [3.2, 7.8, 15.5, 25.7, 42.1]
            const randomSize = mockFileSizes[Math.floor(Math.random() * mockFileSizes.length)]

            setMockSong({
              id: `song_${Date.now()}`,
              title: formData.title,
              fileSizeMB: randomSize,
              audioUrl: "/mock-audio.wav",
              duration: 180,
              qualityScore: 85 + Math.floor(Math.random() * 15),
            })

            setCurrentStep("pricing")
            resolve(void 0)
          }
        }, 500)
      })
    } catch (err) {
      console.error("Generation failed:", err)
    }
  }

  const handlePurchase = async () => {
    if (!mockSong) return

    setPaymentProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 3000))

    setPaymentProcessing(false)
    setPurchaseComplete(true)
    setCurrentStep("complete")
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const resetFlow = () => {
    setCurrentStep("generate")
    setMockSong(null)
    setPurchaseComplete(false)
    setPaymentProcessing(false)
    setIncludeLicense(false)
    clearError()
  }

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case "Bonus Track":
        return <TestTube className="w-5 h-5" />
      case "Base Song":
        return <Music className="w-5 h-5" />
      case "Premium Song":
        return <Headphones className="w-5 h-5" />
      case "Ultra Super Great Amazing Song":
        return <Crown className="w-5 h-5" />
      default:
        return <Download className="w-5 h-5" />
    }
  }

  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case "Bonus Track":
        return "from-gray-500 to-gray-600"
      case "Base Song":
        return "from-blue-500 to-blue-600"
      case "Premium Song":
        return "from-purple-500 to-purple-600"
      case "Ultra Super Great Amazing Song":
        return "from-orange-500 via-red-500 to-green-500"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  // Calculate pricing if we have a mock song
  const pricing = mockSong ? PricingServiceV2.calculateTotalPrice(mockSong.fileSizeMB, includeLicense) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Progress */}
        <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-green-300 flex items-center gap-3">
              <Music className="w-8 h-8" />
              Complete Flow Test: Generate → Price → Purchase
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">END-TO-END TEST</Badge>
            </CardTitle>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center space-x-4">
                <div
                  className={`flex items-center gap-2 ${currentStep === "generate" ? "text-green-300" : currentStep !== "generate" ? "text-green-500" : "text-gray-400"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "generate" ? "bg-green-500" : currentStep !== "generate" ? "bg-green-600" : "bg-gray-600"}`}
                  >
                    {currentStep !== "generate" ? <CheckCircle className="w-5 h-5" /> : "1"}
                  </div>
                  <span className="font-medium">Generate Song</span>
                </div>

                <div className={`w-16 h-1 ${currentStep !== "generate" ? "bg-green-500" : "bg-gray-600"}`}></div>

                <div
                  className={`flex items-center gap-2 ${currentStep === "pricing" ? "text-green-300" : currentStep === "purchase" || currentStep === "complete" ? "text-green-500" : "text-gray-400"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "pricing" ? "bg-green-500" : currentStep === "purchase" || currentStep === "complete" ? "bg-green-600" : "bg-gray-600"}`}
                  >
                    {currentStep === "purchase" || currentStep === "complete" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      "2"
                    )}
                  </div>
                  <span className="font-medium">View Pricing</span>
                </div>

                <div
                  className={`w-16 h-1 ${currentStep === "purchase" || currentStep === "complete" ? "bg-green-500" : "bg-gray-600"}`}
                ></div>

                <div
                  className={`flex items-center gap-2 ${currentStep === "purchase" ? "text-green-300" : currentStep === "complete" ? "text-green-500" : "text-gray-400"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "purchase" ? "bg-green-500" : currentStep === "complete" ? "bg-green-600" : "bg-gray-600"}`}
                  >
                    {currentStep === "complete" ? <CheckCircle className="w-5 h-5" /> : "3"}
                  </div>
                  <span className="font-medium">Purchase</span>
                </div>

                <div className={`w-16 h-1 ${currentStep === "complete" ? "bg-green-500" : "bg-gray-600"}`}></div>

                <div
                  className={`flex items-center gap-2 ${currentStep === "complete" ? "text-green-300" : "text-gray-400"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "complete" ? "bg-green-500" : "bg-gray-600"}`}
                  >
                    {currentStep === "complete" ? <CheckCircle className="w-5 h-5" /> : "4"}
                  </div>
                  <span className="font-medium">Complete</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generate" disabled={currentStep !== "generate"}>
              <Music className="w-4 h-4 mr-2" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="pricing" disabled={currentStep !== "pricing"}>
              <Award className="w-4 h-4 mr-2" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="purchase" disabled={currentStep !== "purchase"}>
              <CreditCard className="w-4 h-4 mr-2" />
              Purchase
            </TabsTrigger>
            <TabsTrigger value="complete" disabled={currentStep !== "complete"}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete
            </TabsTrigger>
          </TabsList>

          {/* Step 1: Generate Song */}
          <TabsContent value="generate">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-300 flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Song Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title" className="text-green-300">
                        Song Title
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="bg-black/40 border-green-500/30 text-green-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="genre" className="text-green-300">
                        Genre
                      </Label>
                      <Select
                        value={formData.genre}
                        onValueChange={(value) => setFormData({ ...formData, genre: value })}
                      >
                        <SelectTrigger className="bg-black/40 border-green-500/30 text-green-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Electronic">Electronic</SelectItem>
                          <SelectItem value="Pop">Pop</SelectItem>
                          <SelectItem value="Rock">Rock</SelectItem>
                          <SelectItem value="Jazz">Jazz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="lyrics" className="text-green-300">
                      Lyrics
                    </Label>
                    <Textarea
                      id="lyrics"
                      value={formData.lyrics}
                      onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                      className="bg-black/40 border-green-500/30 text-green-100 min-h-[200px]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="stems"
                        checked={formData.includeStems}
                        onCheckedChange={(checked) => setFormData({ ...formData, includeStems: checked })}
                      />
                      <Label htmlFor="stems" className="text-green-300">
                        Include Stems
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="commercial"
                        checked={formData.commercialRights}
                        onCheckedChange={(checked) => setFormData({ ...formData, commercialRights: checked })}
                      />
                      <Label htmlFor="commercial" className="text-green-300">
                        Commercial Rights
                      </Label>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full h-12 bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold"
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="w-5 h-5 mr-2 animate-spin" />
                        Generating Song...
                      </>
                    ) : (
                      <>
                        <Music className="w-5 h-5 mr-2" />
                        Generate Professional Song
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Generation Progress */}
              {isGenerating && (
                <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-green-300 flex items-center gap-2">
                      <Volume2 className="w-5 h-5" />
                      AI Generation Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-300">Processing...</span>
                        <span className="text-green-400">Generating</span>
                      </div>
                      <Progress value={75} className="h-2" />
                      <p className="text-green-400/60 text-sm">Creating your professional song with Music21 + AI...</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center bg-green-500">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-white text-sm">Music21 Composition</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center bg-green-500">
                          <Volume2 className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-white text-sm">Audio Synthesis</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Step 2: Pricing */}
          <TabsContent value="pricing">
            {mockSong && pricing && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Song Preview */}
                <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-green-300 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Generated Song: "{mockSong.title}"
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Audio Player */}
                    <div className="bg-black/40 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <Button onClick={togglePlayback} className="bg-green-500 hover:bg-green-600">
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </Button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Volume2 className="w-4 h-4 text-green-400" />
                            <span className="text-green-300 font-medium">{mockSong.title}</span>
                          </div>
                          <div className="bg-green-500/20 h-2 rounded-full">
                            <div className="bg-green-500 h-2 rounded-full w-1/3"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">File Size:</span>
                        <div className="text-white font-semibold">{mockSong.fileSizeMB.toFixed(1)} MB</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Quality Score:</span>
                        <div className="text-white font-semibold">{mockSong.qualityScore}%</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Duration:</span>
                        <div className="text-white font-semibold">
                          {Math.floor(mockSong.duration / 60)}:{(mockSong.duration % 60).toString().padStart(2, "0")}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Format:</span>
                        <div className="text-white font-semibold">WAV</div>
                      </div>
                    </div>

                    <Button
                      onClick={() => setCurrentStep("purchase")}
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    >
                      Proceed to Purchase
                    </Button>
                  </CardContent>
                </Card>

                {/* Pricing Display */}
                <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-green-300 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Pricing for Your Song
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Selected Tier */}
                    <div className="border-2 border-green-400 bg-green-500/10 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${getTierColor(pricing.tier.name)}`}>
                          {getTierIcon(pricing.tier.name)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-100 flex items-center gap-2">
                            {pricing.tier.emoji} {pricing.tier.name}
                            <Badge className="bg-green-500 text-white">YOUR TIER</Badge>
                          </h3>
                          <p className="text-green-400/80 text-sm">{pricing.tier.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-300">${pricing.tier.price.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Full License Option */}
                    <div className="border border-orange-500/30 rounded-lg p-4 bg-gradient-to-r from-orange-900/20 to-red-900/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-orange-400" />
                          <div>
                            <h3 className="font-semibold text-orange-300">🪪 Full License — $10.00</h3>
                            <p className="text-orange-400/60 text-sm">Complete ownership and commercial rights</p>
                          </div>
                        </div>
                        <Switch checked={includeLicense} onCheckedChange={setIncludeLicense} />
                      </div>

                      {includeLicense && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-orange-300">
                            <CheckCircle className="w-3 h-3" />
                            <span>Complete ownership of your track</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-orange-300">
                            <CheckCircle className="w-3 h-3" />
                            <span>Use, modify, distribute, and monetize</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-orange-300">
                            <CheckCircle className="w-3 h-3" />
                            <span>Burnt Beats retains zero rights</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="bg-black/60 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-300">
                          {pricing.tier.emoji} {pricing.tier.name}
                        </span>
                        <span className="text-green-300">${pricing.tier.price.toFixed(2)}</span>
                      </div>
                      {includeLicense && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-orange-300">🪪 Full License</span>
                          <span className="text-orange-300">+$10.00</span>
                        </div>
                      )}
                      <Separator className="bg-green-500/20 my-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-green-100">Total</span>
                        <span className="text-2xl font-bold text-green-300">
                          ${(pricing.tier.price + (includeLicense ? 10 : 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Step 3: Purchase */}
          <TabsContent value="purchase">
            {mockSong && pricing && (
              <div className="max-w-2xl mx-auto">
                <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-green-300 flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Complete Your Purchase
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Order Summary */}
                    <div className="bg-black/40 rounded-lg p-4">
                      <h3 className="text-green-300 font-medium mb-3">Order Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Song: "{mockSong.title}"</span>
                          <span className="text-gray-300">{mockSong.fileSizeMB.toFixed(1)} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-300">
                            {pricing.tier.emoji} {pricing.tier.name}
                          </span>
                          <span className="text-green-300">${pricing.tier.price.toFixed(2)}</span>
                        </div>
                        {includeLicense && (
                          <div className="flex justify-between">
                            <span className="text-orange-300">🪪 Full License</span>
                            <span className="text-orange-300">$10.00</span>
                          </div>
                        )}
                        <Separator className="bg-green-500/20" />
                        <div className="flex justify-between font-bold">
                          <span className="text-green-100">Total</span>
                          <span className="text-green-300">
                            ${(pricing.tier.price + (includeLicense ? 10 : 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Form */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email" className="text-green-300">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          className="bg-black/40 border-green-500/30 text-green-100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="card" className="text-green-300">
                          Card Number
                        </Label>
                        <Input
                          id="card"
                          placeholder="4242 4242 4242 4242"
                          className="bg-black/40 border-green-500/30 text-green-100"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiry" className="text-green-300">
                            Expiry
                          </Label>
                          <Input
                            id="expiry"
                            placeholder="MM/YY"
                            className="bg-black/40 border-green-500/30 text-green-100"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvc" className="text-green-300">
                            CVC
                          </Label>
                          <Input
                            id="cvc"
                            placeholder="123"
                            className="bg-black/40 border-green-500/30 text-green-100"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handlePurchase}
                      disabled={paymentProcessing}
                      className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold"
                    >
                      {paymentProcessing ? (
                        <>
                          <Clock className="w-5 h-5 mr-2 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Complete Purchase - ${(pricing.tier.price + (includeLicense ? 10 : 0)).toFixed(2)}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Step 4: Complete */}
          <TabsContent value="complete">
            {purchaseComplete && mockSong && pricing && (
              <div className="max-w-2xl mx-auto">
                <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-green-300 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Purchase Complete!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 text-center">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-white" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-green-300 mb-2">Thank You!</h3>
                      <p className="text-green-400/80">Your song "{mockSong.title}" has been purchased successfully.</p>
                    </div>

                    {/* Purchase Details */}
                    <div className="bg-black/40 rounded-lg p-4 text-left">
                      <h4 className="text-green-300 font-medium mb-3">Purchase Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Song:</span>
                          <span className="text-white">"{mockSong.title}"</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Tier:</span>
                          <span className="text-white">
                            {pricing.tier.emoji} {pricing.tier.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">File Size:</span>
                          <span className="text-white">{mockSong.fileSizeMB.toFixed(1)} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">License:</span>
                          <span className="text-white">{includeLicense ? "🪪 Full License" : "📄 Standard"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Total Paid:</span>
                          <span className="text-green-300 font-bold">
                            ${(pricing.tier.price + (includeLicense ? 10 : 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Download Options */}
                    <div className="space-y-3">
                      <Button className="w-full bg-green-500 hover:bg-green-600">
                        <Download className="w-5 h-5 mr-2" />
                        Download Your Song
                      </Button>

                      {formData.includeStems && (
                        <Button variant="outline" className="w-full border-green-500/30 text-green-300 bg-transparent">
                          <Download className="w-5 h-5 mr-2" />
                          Download Individual Stems
                        </Button>
                      )}
                    </div>

                    {/* Rights Information */}
                    {includeLicense && (
                      <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                        <h4 className="text-orange-300 font-medium mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Your Rights
                        </h4>
                        <p className="text-orange-400/80 text-sm">
                          You now have complete ownership of this track. You're free to use, modify, distribute, and
                          monetize your music on any platform. Burnt Beats retains zero rights.
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={resetFlow}
                      variant="outline"
                      className="w-full border-green-500/30 text-green-300 bg-transparent"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Another Song
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
