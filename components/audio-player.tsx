"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  AlertCircle,
  Loader2,
  Gauge,
  ListMusic,
  SkipBack,
  SkipForward,
} from "lucide-react"
<<<<<<< HEAD
import type { Song, SongSection, WatermarkConfig } from "@shared/schema"
import { formatTime } from "@/lib/utils"
=======
import type { Song } from "@shared/schema"

interface SongSection {
  id: number
  label: string
  start: number
  end: number
}

interface WatermarkConfig {
  hasWatermark: boolean
  interval?: number
  volume?: number
}
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd

interface AudioPlayerProps {
  song: Song & {
    duration?: number | string
    audioUrl?: string
    watermark?: WatermarkConfig | null
  }
  className?: string
  onUpgrade?: () => void
  autoPlay?: boolean
  loop?: boolean
  onTrackEnd?: () => void
  onNext?: () => void
  onPrevious?: () => void
  showSections?: boolean
  onPurchaseRequired?: (songId: number) => void
  purchaseStatus?: "none" | "pending" | "completed"
}

interface WatermarkIndicatorProps {
  watermark?: WatermarkConfig | null
  hasWatermark: boolean
}

const WatermarkIndicator = ({ watermark, hasWatermark }: WatermarkIndicatorProps) => {
  if (!hasWatermark || !watermark?.hasWatermark) return null

  return (
    <div className="flex items-center gap-1 text-xs text-orange-500">
      <AlertCircle className="w-3 h-3" />
      <span>Watermarked</span>
    </div>
  )
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

<<<<<<< HEAD
=======
// Format time utility function
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
export default function AudioPlayer({
  song,
  className = "",
  onUpgrade,
  autoPlay = false,
  loop = false,
  onTrackEnd,
  onNext,
  onPrevious,
  showSections = true,
  onPurchaseRequired,
  purchaseStatus = "none",
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [currentSection, setCurrentSection] = useState("")
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Get audio URL from song
  const audioUrl = song.audioUrl || song.generatedAudioPath || null

  // Parse duration safely
  const songDuration = useMemo(() => {
    if (typeof song.duration === "number") return song.duration
    if (typeof song.duration === "string") return Number.parseFloat(song.duration) || 0
    return 0
  }, [song.duration])

  // Parse sections safely
  const sections = useMemo(() => {
    try {
      if (Array.isArray(song.sections)) return song.sections as SongSection[]
      if (typeof song.sections === "object" && song.sections) {
        return Object.values(song.sections).filter((s) => s && typeof s === "object") as SongSection[]
      }
      return []
    } catch {
      return []
    }
  }, [song.sections])

  // Parse watermark safely
  const watermarkConfig = useMemo(() => {
    try {
      if (typeof song.watermark === "object" && song.watermark) {
        return song.watermark as WatermarkConfig
      }
      return null
    } catch {
      return null
    }
  }, [song.watermark])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    const handleLoadStart = () => setIsLoading(true)

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || songDuration)
      setIsLoading(false)
      setError(null)
    }

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime)
        updateCurrentSection(audio.currentTime)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      if (onTrackEnd) {
        onTrackEnd()
      }
    }

    const handleError = () => {
      const errorMessages: Record<number, string> = {
        1: "Playback aborted",
        2: "Network error",
        3: "Decoding error",
        4: "Unsupported format",
      }
      setError(errorMessages[audio.error?.code || 0] || "Playback error")
      setIsLoading(false)
    }

    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [audioUrl, autoPlay, loop, onTrackEnd, hasUserInteracted, isDragging, songDuration])

  // Update current section
  const updateCurrentSection = useCallback(
    (time: number) => {
      if (!sections.length) return

      const section = sections.find((s: SongSection) => time >= s.start && time < s.end)
      setCurrentSection(section?.label || "")
    },
    [sections],
  )

  // Play/pause toggle
  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    if (!hasUserInteracted) {
      setHasUserInteracted(true)
    }

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        await audio.play()
        setIsPlaying(true)
      }
    } catch (err) {
      setError("Playback failed")
      console.error("Playback error:", err)
    }
  }, [isPlaying, audioUrl, hasUserInteracted])

  // Time seeking
  const handleTimeChange = useCallback((values: number[]) => {
    const newTime = values[0]
    setCurrentTime(newTime)
    setIsDragging(true)

    const audio = audioRef.current
    if (audio) {
      audio.currentTime = newTime
    }

    setTimeout(() => setIsDragging(false), 100)
  }, [])

  // Volume control
  const handleVolumeChange = useCallback((values: number[]) => {
    const newVolume = values[0]
    setVolume(newVolume)
    setIsMuted(newVolume === 0)

    const audio = audioRef.current
    if (audio) {
      audio.volume = newVolume
    }
  }, [])

  // Mute toggle
  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }, [isMuted, volume])

  // Playback rate change
  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate)
    const audio = audioRef.current
    if (audio) {
      audio.playbackRate = rate
    }
  }, [])

  // Skip controls
  const skipForward = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = Math.min(audio.currentTime + 10, duration)
    }
  }, [duration])

  const skipBackward = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = Math.max(audio.currentTime - 10, 0)
    }
  }, [])

  // Progress calculation
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Error state
  if (error) {
    return (
<<<<<<< HEAD
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-500">
=======
      <Card
        className={`w-full bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10 ${className}`}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-400">
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // No audio URL state
  if (!audioUrl) {
    return (
<<<<<<< HEAD
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-gray-500">
=======
      <Card
        className={`w-full bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10 ${className}`}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-green-400/60">
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
            <AlertCircle className="w-5 h-5" />
            <span>No audio available</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
<<<<<<< HEAD
    <Card className={`w-full ${className}`}>
=======
    <Card
      className={`w-full bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10 ${className}`}
    >
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
      <audio ref={audioRef} src={audioUrl} loop={loop} preload="metadata" />

      <CardContent className="p-6">
        {/* Song Info Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
<<<<<<< HEAD
            <h3 className="font-semibold text-lg mb-1">{song.title}</h3>
            <p className="text-sm text-muted-foreground">
=======
            <h3 className="font-semibold text-lg mb-1 text-green-100">{song.title}</h3>
            <p className="text-sm text-green-400/80">
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
              {song.genre} • {formatTime(duration)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <WatermarkIndicator watermark={watermarkConfig} hasWatermark={watermarkConfig?.hasWatermark || false} />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-4">
          <Slider
            value={[currentTime]}
            onValueChange={handleTimeChange}
            max={duration}
            step={0.1}
            className="w-full"
            disabled={isLoading}
          />
<<<<<<< HEAD
          <div className="flex justify-between text-xs text-muted-foreground">
=======
          <div className="flex justify-between text-xs text-green-400/60">
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
<<<<<<< HEAD
          <Button variant="ghost" size="sm" onClick={skipBackward} disabled={isLoading}>
=======
          <Button
            variant="ghost"
            size="sm"
            onClick={skipBackward}
            disabled={isLoading}
            className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
          >
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
<<<<<<< HEAD
            variant="default"
            size="lg"
            onClick={togglePlay}
            disabled={isLoading}
            className="w-12 h-12 rounded-full"
=======
            size="lg"
            onClick={togglePlay}
            disabled={isLoading}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30"
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>

<<<<<<< HEAD
          <Button variant="ghost" size="sm" onClick={skipForward} disabled={isLoading}>
=======
          <Button
            variant="ghost"
            size="sm"
            onClick={skipForward}
            disabled={isLoading}
            className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
          >
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 mb-4">
<<<<<<< HEAD
          <Button variant="ghost" size="sm" onClick={toggleMute}>
=======
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
          >
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.1}
            className="flex-1"
          />
        </div>

        {/* Playback Rate Control */}
        <div className="flex items-center gap-2 mb-4">
<<<<<<< HEAD
          <Gauge className="w-4 h-4" />
          <span className="text-sm">Speed:</span>
=======
          <Gauge className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-300">Speed:</span>
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
          {PLAYBACK_RATES.map((rate) => (
            <Button
              key={rate}
              variant={playbackRate === rate ? "default" : "ghost"}
              size="sm"
              onClick={() => handlePlaybackRateChange(rate)}
<<<<<<< HEAD
              className="text-xs px-2"
=======
              className={`text-xs px-2 ${
                playbackRate === rate
                  ? "bg-green-500/30 text-green-100"
                  : "text-green-300 hover:text-green-100 hover:bg-green-500/10"
              }`}
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
            >
              {rate}x
            </Button>
          ))}
        </div>

        {/* Sections Display */}
        {showSections && sections.length > 0 && (
<<<<<<< HEAD
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <ListMusic className="w-4 h-4" />
              <span className="text-sm font-medium">Sections</span>
=======
          <div className="border-t border-green-500/20 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <ListMusic className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">Sections</span>
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
            </div>
            <div className="grid grid-cols-2 gap-2">
              {sections.map((section: SongSection, index: number) => (
                <Button
                  key={`${section.id}-${index}`}
                  variant={currentSection === section.label ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    const audio = audioRef.current
                    if (audio) {
                      audio.currentTime = section.start
                    }
                  }}
<<<<<<< HEAD
                  className="justify-start text-xs"
=======
                  className={`justify-start text-xs ${
                    currentSection === section.label
                      ? "bg-green-500/30 text-green-100"
                      : "text-green-300 hover:text-green-100 hover:bg-green-500/10"
                  }`}
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
                >
                  {section.label}
                  <span className="ml-auto text-xs opacity-60">{formatTime(section.start)}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Current Section Indicator */}
        {currentSection && (
          <div className="mt-2 text-center">
<<<<<<< HEAD
            <span className="text-xs bg-primary/10 px-2 py-1 rounded">Now playing: {currentSection}</span>
=======
            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
              Now playing: {currentSection}
            </span>
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
          </div>
        )}
      </CardContent>
    </Card>
  )
}
