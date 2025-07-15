"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  )
}
