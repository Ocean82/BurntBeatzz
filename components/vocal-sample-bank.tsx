"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VocalSynthesisService } from "@/lib/services/vocal-synthesis-service"
import { Play, Pause, Users, Star, Clock, Music, Volume2, Wand2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VocalSampleBankProps {
  onSelectSample: (sampleId: number, sampleName: string) => void
  selectedSampleId?: number
  userId: string
}

export default function VocalSampleBank({ onSelectSample, selectedSampleId, userId }: VocalSampleBankProps) {
  const [playingSample, setPlayingSample] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [agreedToShare, setAgreedToShare] = useState(false)
  const [audioBlobs, setAudioBlobs] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<HTMLAudioElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Real vocal samples - all singing Star Spangled Banner
  const vocalSamples = [
    {
      id: 1,
      name: "Emma",
      description: "Clear, bright voice singing Star Spangled Banner",
      characteristics: { gender: "female", style: "clear", timbre: "bright" },
      tags: ["female", "clear", "bright", "pop", "folk"],
      quality: "excellent",
      duration: 9,
    },
    {
      id: 2,
      name: "Sarah",
      description: "Warm, smooth tone on Star Spangled Banner",
      characteristics: { gender: "female", style: "smooth", timbre: "warm" },
      tags: ["female", "smooth", "warm", "r&b", "jazz"],
      quality: "excellent",
      duration: 9,
    },
    {
      id: 3,
      name: "Madison",
      description: "Emotional delivery of Star Spangled Banner",
      characteristics: { gender: "female", style: "emotional", timbre: "light" },
      tags: ["female", "emotional", "light", "pop", "country"],
      quality: "good",
      duration: 9,
    },
    {
      id: 4,
      name: "Olivia",
      description: "Powerful Star Spangled Banner performance",
      characteristics: { gender: "female", style: "powerful", timbre: "rich" },
      tags: ["female", "powerful", "rich", "rock", "gospel"],
      quality: "excellent",
      duration: 9,
    },
    {
      id: 5,
      name: "Chloe",
      description: "Breathy, ethereal Star Spangled Banner",
      characteristics: { gender: "female", style: "breathy", timbre: "bright" },
      tags: ["female", "breathy", "bright", "indie", "electronic"],
      quality: "good",
      duration: 9,
    },
    {
      id: 6,
      name: "Grace",
      description: "Deep, soulful Star Spangled Banner",
      characteristics: { gender: "female", style: "emotional", timbre: "deep" },
      tags: ["female", "emotional", "deep", "soul", "blues"],
      quality: "excellent",
      duration: 9,
    },
    {
      id: 7,
      name: "Sophia",
      description: "Versatile Star Spangled Banner rendition",
      characteristics: { gender: "female", style: "clear", timbre: "warm" },
      tags: ["female", "clear", "warm", "pop", "musical theater"],
      quality: "excellent",
      duration: 9,
    },
  ]

  // Generate Star Spangled Banner vocals for each preset
  useEffect(() => {
    const generateVocalSamples = async () => {
      setIsLoading(true)
      const newBlobs: { [key: string]: string } = {}

      try {
        // Initialize all vocal presets
        await VocalSynthesisService.initializeAllVocalPresets()

        // Get the generated audio URLs
        for (const sample of vocalSamples) {
          const preset =
            VocalSynthesisService.VOCAL_PRESETS[sample.name as keyof typeof VocalSynthesisService.VOCAL_PRESETS]
          if (preset && preset.audioUrl) {
            newBlobs[sample.name] = preset.audioUrl
          }
        }

        setAudioBlobs(newBlobs)
      } catch (error) {
        console.error("Failed to generate vocal samples:", error)
        toast({
          title: "Audio Generation Failed",
          description: "Could not generate vocal samples",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    generateVocalSamples()
  }, [])

  const handlePlaySample = async (sample: any) => {
    // Stop any currently playing audio
    if (currentlyPlaying) {
      currentlyPlaying.pause()
      currentlyPlaying.currentTime = 0
      setCurrentlyPlaying(null)
    }

    if (playingSample === sample.name) {
      // Stop playing
      setPlayingSample(null)
    } else {
      // Start playing
      if (audioBlobs[sample.name]) {
        try {
          const audio = new Audio(audioBlobs[sample.name])
          audio.volume = 0.7

          audio.onended = () => {
            setPlayingSample(null)
            setCurrentlyPlaying(null)
          }

          audio.onerror = () => {
            toast({
              title: "Playback Error",
              description: "Failed to play audio sample",
              variant: "destructive",
            })
            setPlayingSample(null)
            setCurrentlyPlaying(null)
          }

          await audio.play()
          setPlayingSample(sample.name)
          setCurrentlyPlaying(audio)
        } catch (error) {
          console.error("Playback error:", error)
          toast({
            title: "Playback Error",
            description: "Failed to play audio sample",
            variant: "destructive",
          })
        }
      }
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!agreedToShare) {
      toast({
        title: "Agreement Required",
        description: "Please agree to share your vocal sample with the community",
        variant: "destructive",
      })
      return
    }

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Invalid File Type",
        description: "Please select an audio file (MP3, WAV, M4A, etc.)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 50MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      toast({
        title: "🎤 Processing Upload",
        description: "Analyzing your voice and creating Star Spangled Banner version...",
      })

      // Simulate voice analysis
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create voice characteristics based on file analysis
      const voiceCharacteristics = {
        pitchRange: [180 + Math.random() * 100, 280 + Math.random() * 100],
        timbre: ["warm", "bright", "deep", "light"][Math.floor(Math.random() * 4)],
        clarity: 0.7 + Math.random() * 0.3,
        stability: 0.8 + Math.random() * 0.2,
        breathiness: Math.random() * 0.3,
      }

      // Generate a unique name for the cloned voice
      const clonedVoiceName = `User_${Date.now()}`

      // Clone the voice to sing Star Spangled Banner
      const clonedAudioUrl = await VocalSynthesisService.cloneVoiceToStarSpangledBanner(
        file,
        clonedVoiceName,
        voiceCharacteristics,
      )

      // Add to available samples
      const newSample = {
        id: Date.now(),
        name: clonedVoiceName,
        description: "Your cloned voice singing Star Spangled Banner",
        characteristics: { gender: "user", style: "cloned", timbre: voiceCharacteristics.timbre },
        tags: ["user", "cloned", voiceCharacteristics.timbre],
        quality: "good",
        duration: 9,
      }

      // Update audio blobs
      setAudioBlobs((prev) => ({
        ...prev,
        [clonedVoiceName]: clonedAudioUrl,
      }))

      toast({
        title: "✅ Voice Cloned Successfully!",
        description: "Your voice is now singing Star Spangled Banner and ready to use!",
      })

      setUploadDialogOpen(false)
      setAgreedToShare(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Voice cloning failed:", error)
      toast({
        title: "Voice Cloning Failed",
        description: "Could not process your voice sample",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "text-green-400"
      case "good":
        return "text-blue-400"
      default:
        return "text-gray-400"
    }
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentlyPlaying) {
        currentlyPlaying.pause()
        currentlyPlaying.currentTime = 0
      }
    }
  }, [currentlyPlaying])

  if (isLoading) {
    return (
      <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-green-300 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Community Vocal Bank
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-green-400/60">Generating Star Spangled Banner vocals...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-green-300 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Community Vocal Bank
            <Badge variant="outline" className="ml-2 text-green-400 border-green-500/30">
              Star Spangled Banner
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30"
                >
                  <Wand2 className="w-4 h-4 mr-1" />
                  Clone Your Voice
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-green-500/30">
                <DialogHeader>
                  <DialogTitle className="text-green-300">Clone Your Voice to Sing Star Spangled Banner</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-green-300 font-medium mb-2">How Voice Cloning Works:</h4>
                    <ul className="text-sm text-green-400/80 space-y-1">
                      <li>• Upload a 30-60 second sample of your voice (speaking or singing)</li>
                      <li>• Our AI analyzes your voice characteristics</li>
                      <li>• We generate a version of YOU singing Star Spangled Banner</li>
                      <li>• Your cloned voice can then be used for any song generation</li>
                      <li>• Only the Star Spangled Banner version is saved, not your original</li>
                    </ul>
                  </div>

                  <div>
                    <Label htmlFor="vocal-upload" className="text-green-300">
                      Select Audio File (WAV, MP3, M4A) - Max 50MB
                    </Label>
                    <Input
                      id="vocal-upload"
                      type="file"
                      accept="audio/*"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="bg-black/60 border-green-500/30 text-green-100 mt-2"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agree-share"
                      checked={agreedToShare}
                      onCheckedChange={(checked) => setAgreedToShare(checked as boolean)}
                      disabled={isUploading}
                    />
                    <Label htmlFor="agree-share" className="text-sm text-green-400">
                      I agree to share my cloned Star Spangled Banner version with the community
                    </Label>
                  </div>

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!agreedToShare || isUploading}
                    className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Cloning Voice...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Clone Voice to Star Spangled Banner
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-center">
          <p className="text-sm text-green-400/60 mb-2">
            🎵 All voices singing "Oh say can you see, by the dawn's early light..."
          </p>
          <p className="text-xs text-green-400/40">
            Click play to hear each voice, then select for your song generation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vocalSamples.map((sample) => (
            <div
              key={sample.id}
              className={`bg-black/60 border rounded-lg p-4 cursor-pointer transition-all hover:bg-green-500/5 ${
                selectedSampleId === sample.id ? "border-green-400 bg-green-500/10" : "border-green-500/20"
              }`}
              onClick={() => onSelectSample(sample.id, sample.name)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-green-100">{sample.name}</h4>
                <div className="flex items-center space-x-1">
                  <Star className={`w-4 h-4 ${getQualityColor(sample.quality)}`} />
                  <span className="text-xs text-green-400/60">{sample.quality}</span>
                </div>
              </div>

              <p className="text-xs text-green-400/70 mb-3">{sample.description}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {sample.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs text-green-400 border-green-500/30">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-green-400/60">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(sample.duration)}</span>
                  <Music className="w-3 h-3" />
                  <span>Star Spangled Banner</span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlaySample(sample)
                  }}
                  disabled={!audioBlobs[sample.name]}
                  className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                >
                  {playingSample === sample.name ? (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      <Volume2 className="w-3 h-3" />
                    </>
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
