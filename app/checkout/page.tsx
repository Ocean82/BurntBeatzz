"use client"

import { useState, useRef, useEffect } from "react"
import { StripeBuyButton } from "@/components/stripe-buy-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Download, Headphones, Volume2, VolumeX, Music, Star, Clock, Zap } from "lucide-react"

export default function CheckoutPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(180) // 3 minutes
  const [volume, setVolume] = useState([75])
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Mock song data - in real app this would come from URL params or API
  const songData = {
    title: "Neon Dreams",
    artist: "AI Producer",
    duration: "3:42",
    genre: "Electronic",
    bpm: 128,
    key: "C Minor",
    demoUrl: "/demo/neon-dreams-watermarked.mp3", // Watermarked version
    price: 2.99,
    format: "WAV",
    quality: "24-bit/44.1kHz",
    rating: 4.8,
    downloads: 1247,
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", () => setIsPlaying(false))

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", () => setIsPlaying(false))
    }
  }, [])

  const togglePlayback = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = (value[0] / 100) * duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    setVolume(value)
    audio.volume = value[0] / 100
    setIsMuted(value[0] === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume[0] / 100
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handlePurchaseComplete = () => {
    alert("Purchase successful! Your download will begin shortly.")
    // In real app, trigger download and redirect to library
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-orange-900/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-orange-300">Complete Your Purchase</h1>
          <p className="text-gray-400">Download high-quality, license-free music</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Song Preview */}
          <Card className="bg-black/60 border-orange-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-orange-300 flex items-center gap-2">
                <Headphones className="w-5 h-5" />
                Preview Track
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Song Info */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white">{songData.title}</h3>
                  <p className="text-orange-200 text-lg">by {songData.artist}</p>
                </div>

                <div className="flex justify-center gap-2 flex-wrap">
                  <Badge variant="outline" className="border-orange-500/50 text-orange-300">
                    {songData.genre}
                  </Badge>
                  <Badge variant="outline" className="border-orange-500/50 text-orange-300">
                    {songData.bpm} BPM
                  </Badge>
                  <Badge variant="outline" className="border-orange-500/50 text-orange-300">
                    {songData.key}
                  </Badge>
                  <Badge variant="outline" className="border-orange-500/50 text-orange-300">
                    {songData.duration}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>{songData.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4 text-green-400" />
                    <span>{songData.downloads.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>{songData.duration}</span>
                  </div>
                </div>
              </div>

              {/* Audio Player */}
              <div className="bg-black/40 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Demo Version (Watermarked)</span>
                  <Badge className="bg-orange-500 text-white">Preview</Badge>
                </div>

                {/* Waveform Visualization */}
                <div className="h-20 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded flex items-end justify-center gap-1 p-2">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        isPlaying ? "bg-orange-400 animate-pulse" : "bg-orange-400/50"
                      }`}
                      style={{
                        height: `${Math.random() * 60 + 20}%`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Slider
                    value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                    onValueChange={handleSeek}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button onClick={toggleMute} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Slider
                      value={isMuted ? [0] : volume}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                  </div>
                  <Button
                    onClick={togglePlayback}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-12 h-12"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <div className="w-24" /> {/* Spacer for centering */}
                </div>

                {/* Hidden audio element */}
                <audio ref={audioRef} src={songData.demoUrl} preload="metadata" />
              </div>

              {/* What You Get */}
              <div className="bg-black/20 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  What you'll receive:
                </h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-center gap-2">
                    <Download className="w-3 h-3 text-green-400" />
                    High-quality {songData.format} file ({songData.quality})
                  </li>
                  <li className="flex items-center gap-2">
                    <Download className="w-3 h-3 text-green-400" />
                    Commercial license included
                  </li>
                  <li className="flex items-center gap-2">
                    <Download className="w-3 h-3 text-green-400" />
                    No watermarks or restrictions
                  </li>
                  <li className="flex items-center gap-2">
                    <Download className="w-3 h-3 text-green-400" />
                    Instant download after payment
                  </li>
                  <li className="flex items-center gap-2">
                    <Download className="w-3 h-3 text-green-400" />
                    100% ownership rights
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <div className="space-y-6">
            {/* Main Purchase */}
            <StripeBuyButton
              songTitle={songData.title}
              artist={songData.artist}
              price={songData.price}
              format={songData.format}
              quality={songData.quality}
              onPurchaseComplete={handlePurchaseComplete}
            />

            {/* Bonus Track Option */}
            <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-green-300 text-lg flex items-center gap-2">
                  <Music className="w-5 h-5" />💎 Bonus Track Option
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Want the watermarked demo version too? Perfect for previews, social media, and teasers!
                </p>

                <div className="bg-black/20 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Demo Version (Watermarked)</span>
                    <Badge className="bg-green-500 text-white">$0.99</Badge>
                  </div>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Same high quality as full version</li>
                    <li>• Subtle "Burnt Beats" watermark</li>
                    <li>• Perfect for social media previews</li>
                    <li>• Instant download</li>
                  </ul>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-green-500/50 text-green-300 hover:bg-green-500/10 bg-transparent"
                >
                  Add Bonus Track (+$0.99)
                </Button>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <Card className="bg-black/40 border-gray-500/30">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-400">24/7</div>
                    <div className="text-xs text-gray-400">Instant Download</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-blue-400">100%</div>
                    <div className="text-xs text-gray-400">Ownership Rights</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-purple-400">SSL</div>
                    <div className="text-xs text-gray-400">Secure Payment</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-orange-400">∞</div>
                    <div className="text-xs text-gray-400">Commercial Use</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
