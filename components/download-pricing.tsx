"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
<<<<<<< HEAD
import { Download, Play, Pause, Volume2, Crown, Star } from "lucide-react"
import { AudioSynthesisService } from "@/lib/services/audio-synthesis-service"
import LicenseViewer from "./license-viewer"
import { useToast } from "@/hooks/use-toast"

interface DownloadPricingProps {
  songTitle: string
  songDuration: string
  genre: string
  userName: string
  userEmail: string
  originalAudioUrl?: string
}

export default function DownloadPricing({
  songTitle,
  songDuration,
  genre,
  userName,
  userEmail,
  originalAudioUrl,
}: DownloadPricingProps) {
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [generatedPreviews, setGeneratedPreviews] = useState<Record<string, string>>({})
  const [isGeneratingPreview, setIsGeneratingPreview] = useState<string | null>(null)
  const [purchasedLicense, setPurchasedLicense] = useState(false)
  const { toast } = useToast()

  const qualityOptions = [
    {
      id: "demo",
      name: "Demo Quality",
      description: "30-second preview with watermark",
      format: "MP3 128kbps",
      price: 0,
      fileSize: "1.2 MB",
      features: ["30-second preview", "Watermarked", "Perfect for testing"],
      color: "blue",
      icon: Play,
    },
    {
      id: "standard",
      name: "Standard Quality",
      description: "Full-length track, great for streaming",
      format: "MP3 320kbps",
      price: 1.99,
      fileSize: "4.2 MB",
      features: ["Full-length track", "No watermark", "Streaming quality", "Commercial use"],
      color: "green",
      icon: Volume2,
    },
    {
      id: "high",
      name: "High Quality",
      description: "Professional grade for serious projects",
      format: "WAV 44.1kHz/16-bit",
      price: 4.99,
      fileSize: "12.8 MB",
      features: ["CD quality", "Uncompressed", "Professional mixing", "Commercial use"],
      color: "purple",
      icon: Star,
    },
    {
      id: "ultra",
      name: "Ultra HD + Stems",
      description: "Studio master with individual tracks",
      format: "WAV 96kHz/24-bit + Stems",
      price: 9.99,
      fileSize: "45.6 MB",
      features: ["Studio master quality", "Individual stems", "Remix-ready", "Commercial use"],
      color: "orange",
      icon: Crown,
    },
  ]

  const handlePlayPreview = async (qualityId: string) => {
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setCurrentAudio(null)
    }

    if (isPlaying === qualityId) {
      setIsPlaying(null)
      return
    }

    // Generate preview if not already generated
    if (!generatedPreviews[qualityId]) {
      setIsGeneratingPreview(qualityId)
      try {
        let audioUrl: string

        if (qualityId === "demo") {
          // Generate 30-second demo with watermark
          audioUrl = await AudioSynthesisService.generateDemoTrack(genre, songTitle)
        } else {
          // Use original audio or generate full track
          if (originalAudioUrl) {
            audioUrl = originalAudioUrl
          } else {
            audioUrl = await AudioSynthesisService.generateRealAudio({
              title: songTitle,
              genre,
              tempo: 120,
              duration: parseDuration(songDuration),
            })
          }
        }

        setGeneratedPreviews((prev) => ({ ...prev, [qualityId]: audioUrl }))
      } catch (error) {
        toast({
          title: "Preview Generation Failed",
          description: "Please try again",
          variant: "destructive",
        })
        setIsGeneratingPreview(null)
        return
      } finally {
        setIsGeneratingPreview(null)
      }
    }

    // Play the audio
    const audioUrl = generatedPreviews[qualityId]
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl)
        audio.volume = 0.7

        audio.onended = () => {
          setIsPlaying(null)
          setCurrentAudio(null)
        }

        audio.onerror = () => {
          toast({
            title: "Playback Error",
            description: "Failed to play audio preview",
            variant: "destructive",
          })
          setIsPlaying(null)
          setCurrentAudio(null)
        }

        await audio.play()
        setIsPlaying(qualityId)
        setCurrentAudio(audio)
      } catch (error) {
        toast({
          title: "Playback Error",
          description: "Failed to play audio preview",
          variant: "destructive",
        })
      }
    }
  }

  const handlePurchase = async (qualityId: string) => {
    const option = qualityOptions.find((opt) => opt.id === qualityId)
    if (!option) return

    if (option.price === 0) {
      // Free demo download
      const audioUrl = generatedPreviews[qualityId]
      if (audioUrl) {
        const a = document.createElement("a")
        a.href = audioUrl
        a.download = `${songTitle}-Demo.mp3`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        toast({
          title: "Demo Downloaded!",
          description: "Your demo track has been saved",
        })
      }
      return
    }

    // Simulate payment process
    toast({
      title: "🛒 Processing Payment",
      description: `Purchasing ${option.name} for $${option.price.toFixed(2)}...`,
    })

    setTimeout(() => {
      toast({
        title: "💳 Payment Successful!",
        description: "Your high-quality track is ready for download",
      })

      // Simulate download
      setTimeout(() => {
        const audioUrl = generatedPreviews[qualityId] || originalAudioUrl
        if (audioUrl) {
          const a = document.createElement("a")
          a.href = audioUrl
          a.download = `${songTitle}-${option.name.replace(/\s+/g, "-")}.${option.format.includes("WAV") ? "wav" : "mp3"}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
      }, 1000)
    }, 2000)
  }

  const handleLicensePurchase = () => {
    toast({
      title: "🛒 Processing License Purchase",
      description: "Purchasing commercial license for $10.00...",
    })

    setTimeout(() => {
      setPurchasedLicense(true)
      toast({
        title: "📜 License Purchased!",
        description: "Your commercial license is ready for download",
      })
    }, 2000)
  }

  const parseDuration = (duration: string): number => {
    const [minutes, seconds] = duration.split(":").map(Number)
    return minutes * 60 + (seconds || 0)
  }

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "border-blue-500/30 bg-blue-500/5 text-blue-300",
      green: "border-green-500/30 bg-green-500/5 text-green-300",
      purple: "border-purple-500/30 bg-purple-500/5 text-purple-300",
      orange: "border-orange-500/30 bg-orange-500/5 text-orange-300",
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download Options
            <Badge variant="outline" className="text-green-400 border-green-500/30">
              {songTitle}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {qualityOptions.map((option) => {
              const IconComponent = option.icon
              const isGenerating = isGeneratingPreview === option.id
              const isCurrentlyPlaying = isPlaying === option.id

              return (
                <Card
                  key={option.id}
                  className={`${getColorClasses(option.color)} border-2 transition-all hover:shadow-lg cursor-pointer ${
                    selectedQuality === option.id ? "ring-2 ring-current" : ""
                  }`}
                  onClick={() => setSelectedQuality(option.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-5 h-5" />
                        <CardTitle className="text-lg">{option.name}</CardTitle>
                      </div>
                      <div className="text-right">
                        {option.price === 0 ? (
                          <Badge variant="outline" className="text-green-400 border-green-500/30">
                            FREE
                          </Badge>
                        ) : (
                          <div className="font-bold text-xl">${option.price.toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm opacity-80">{option.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Format:</span>
                        <span className="font-medium">{option.format}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>File Size:</span>
                        <span className="font-medium">{option.fileSize}</span>
                      </div>

                      <div className="space-y-1">
                        {option.features.map((feature, index) => (
                          <div key={index} className="text-xs opacity-80 flex items-center gap-1">
                            <span className="text-green-400">✓</span>
                            {feature}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePlayPreview(option.id)
                          }}
                          disabled={isGenerating}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          {isGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                              Generating...
                            </>
                          ) : isCurrentlyPlaying ? (
                            <>
                              <Pause className="w-3 h-3 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-2" />
                              Preview
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePurchase(option.id)
                          }}
                          className="flex-1"
                          disabled={!generatedPreviews[option.id] && option.price > 0}
                        >
                          <Download className="w-3 h-3 mr-2" />
                          {option.price === 0 ? "Download" : "Buy"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-6 text-center">
            <p className="text-green-400/60 text-sm mb-2">💡 All paid downloads include commercial usage rights</p>
            <p className="text-green-400/40 text-xs">
              Demo version includes watermark • Full versions are watermark-free
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Commercial License Section */}
      <LicenseViewer
        songTitle={songTitle}
        userName={userName}
        userEmail={userEmail}
        fileSize="4.2 MB"
        songDuration={songDuration}
        genre={genre}
        format="WAV"
        onPurchase={handleLicensePurchase}
        isPurchased={purchasedLicense}
      />
    </div>
=======
import { Switch } from "@/components/ui/switch"
import { Download, Crown, Star, Shield, Music, Headphones, Award, CheckCircle, Sparkles } from "lucide-react"
import { PricingServiceV2 } from "@/lib/services/pricing-service-v2"

interface DownloadPricingProps {
  songId: number
  fileSizeMB: number
  songTitle: string
  onPurchase: (tier: string, includeLicense: boolean) => void
}

export default function DownloadPricing({ songId, fileSizeMB, songTitle, onPurchase }: DownloadPricingProps) {
  const [includeLicense, setIncludeLicense] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  const downloadTiers = PricingServiceV2.getDownloadTiers()
  const recommendedTier = PricingServiceV2.getRecommendedTier(fileSizeMB)
  const currentTier = PricingServiceV2.calculateDownloadPrice(fileSizeMB)

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case "Bonus Track":
        return <Music className="w-5 h-5" />
      case "Base Song":
        return <Headphones className="w-5 h-5" />
      case "Premium Song":
        return <Star className="w-5 h-5" />
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

  return (
    <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
      <CardHeader>
        <CardTitle className="text-green-300 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Download "{songTitle}"
        </CardTitle>
        <p className="text-green-400/60 text-sm">
          File size: {fileSizeMB.toFixed(1)} MB • Your song qualifies for: {currentTier.tier.emoji}{" "}
          {currentTier.tier.name}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Tier Highlight */}
        <div className="border-2 border-green-400 bg-green-500/10 rounded-lg p-4 shadow-lg shadow-green-400/30">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${getTierColor(currentTier.tier.name)}`}>
              {getTierIcon(currentTier.tier.name)}
            </div>
            <div>
              <h3 className="font-semibold text-green-100 flex items-center gap-2">
                {currentTier.tier.emoji} {currentTier.tier.name}
                <Badge className="bg-green-500 text-white">YOUR TIER</Badge>
              </h3>
              <p className="text-green-400/80 text-sm">{currentTier.tier.quality}</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-2xl font-bold text-green-300">${currentTier.tier.price.toFixed(2)}</div>
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

        {/* All Available Tiers */}
        <div>
          <h4 className="text-green-300 font-medium mb-3">All Available Tiers:</h4>
          <div className="grid gap-3">
            {downloadTiers.map((tier) => {
              const isCurrentTier = tier.name === currentTier.tier.name
              const isRecommended = tier.name === recommendedTier.name && !isCurrentTier
              const isSelected = selectedTier === tier.name

              return (
                <div
                  key={tier.name}
                  className={`relative border rounded-lg p-3 cursor-pointer transition-all ${
                    isCurrentTier
                      ? "border-green-400 bg-green-500/10"
                      : isSelected
                        ? "border-green-400/70 bg-green-500/5"
                        : "border-green-500/20 hover:border-green-400/50 bg-black/20"
                  }`}
                  onClick={() => setSelectedTier(tier.name)}
                >
                  {isRecommended && (
                    <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      RECOMMENDED
                    </Badge>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded bg-gradient-to-r ${getTierColor(tier.name)}`}>
                        {getTierIcon(tier.name)}
                      </div>
                      <div>
                        <h5 className="font-medium text-green-100 text-sm">
                          {tier.emoji} {tier.name}
                        </h5>
                        <p className="text-green-400/60 text-xs">
                          {tier.maxSize === Number.POSITIVE_INFINITY ? "Over 20MB" : `Up to ${tier.maxSize}MB`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-300">${tier.price.toFixed(2)}</div>
                      {isCurrentTier && <div className="text-xs text-green-400">Your tier</div>}
                    </div>
                  </div>
                </div>
              )
            })}
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
            <div className="space-y-2">
              <p className="text-orange-400/80 text-sm font-medium">You get complete ownership:</p>
              <div className="space-y-1">
                {PricingServiceV2.getLicensingOptions()[1].rights.map((right, index) => (
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
            <span className="text-green-300">${currentTier.tier.price.toFixed(2)}</span>
          </div>
          {includeLicense && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-300">🪪 Full License</span>
              <span className="text-orange-300">+$10.00</span>
            </div>
          )}
          <div className="border-t border-green-500/20 pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-green-100">Total</span>
              <span className="text-2xl font-bold text-green-300">
                ${(currentTier.tier.price + (includeLicense ? 10 : 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Purchase Button */}
        <Button
          onClick={() => onPurchase(currentTier.tier.name, includeLicense)}
          className="w-full h-12 bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30"
        >
          <Download className="w-5 h-5 mr-2" />
          Purchase {currentTier.tier.emoji} {currentTier.tier.name}
          {includeLicense && " + Full License"}
        </Button>

        {/* No Subscription Notice */}
        <div className="text-center p-4 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-lg">
          <Award className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-green-300 font-medium">No Subscriptions. No Limits.</p>
          <p className="text-green-400/60 text-sm">Pay once, own forever. Your music, your rights.</p>
        </div>
      </CardContent>
    </Card>
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
  )
}
