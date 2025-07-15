"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AudioSynthesisService } from "@/lib/services/audio-synthesis-service"
import { HardDrive, DollarSign, Clock, Music } from "lucide-react"

interface FileSizeTrackerProps {
  songLength: string
  format: "mp3" | "wav" | "flac"
  quality: "demo" | "standard" | "high" | "ultra"
  complexity: number
  isGenerating: boolean
}

export default function FileSizeTracker({
  songLength,
  format,
  quality,
  complexity,
  isGenerating,
}: FileSizeTrackerProps) {
  const [estimatedSize, setEstimatedSize] = useState(0)
  const [estimatedPrice, setEstimatedPrice] = useState(0)
  const [currentSize, setCurrentSize] = useState(0)

  // Convert song length to seconds
  const getDurationInSeconds = (length: string): number => {
    const [minutes, seconds] = length.split(":").map(Number)
    return minutes * 60 + seconds
  }

  // Calculate quality multiplier
  const getQualityMultiplier = (quality: string): number => {
    switch (quality) {
      case "demo":
        return 0.5
      case "standard":
        return 1.0
      case "high":
        return 1.5
      case "ultra":
        return 2.0
      default:
        return 1.0
    }
  }

  // Calculate complexity multiplier
  const getComplexityMultiplier = (complexity: number): number => {
    return 0.8 + (complexity / 10) * 0.4 // Range: 0.8x to 1.2x
  }

  useEffect(() => {
    const duration = getDurationInSeconds(songLength)
    const qualityMultiplier = getQualityMultiplier(quality)
    const complexityMultiplier = getComplexityMultiplier(complexity)

    const baseSize = AudioSynthesisService.estimateFileSize(duration, format)
    const adjustedSize = Math.round(baseSize * qualityMultiplier * complexityMultiplier)

    setEstimatedSize(adjustedSize)
    setEstimatedPrice(AudioSynthesisService.calculatePrice(adjustedSize))
  }, [songLength, format, quality, complexity])

  // Simulate file size growth during generation
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setCurrentSize((prev) => {
          const increment = estimatedSize * 0.05 // 5% increments
          const newSize = prev + increment
          return newSize >= estimatedSize ? estimatedSize : newSize
        })
      }, 200)

      return () => clearInterval(interval)
    } else {
      setCurrentSize(0)
    }
  }, [isGenerating, estimatedSize])

  const progress = isGenerating ? (currentSize / estimatedSize) * 100 : 0

  return (
    <Card className="bg-black/80 backdrop-blur-sm border border-blue-500/30 shadow-xl shadow-blue-500/10">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-blue-300 flex items-center">
          <HardDrive className="w-5 h-5 mr-2" />
          File Size & Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Generation Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-300">Generating...</span>
              <span className="text-sm text-blue-400">
                {AudioSynthesisService.formatFileSize(currentSize)} /{" "}
                {AudioSynthesisService.formatFileSize(estimatedSize)}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* File Specifications */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-400/70">Duration:</span>
              <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                <Clock className="w-3 h-3 mr-1" />
                {songLength}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-400/70">Format:</span>
              <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                {format.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-400/70">Quality:</span>
              <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                {quality.charAt(0).toUpperCase() + quality.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-400/70">Complexity:</span>
              <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                <Music className="w-3 h-3 mr-1" />
                {complexity}/10
              </Badge>
            </div>
          </div>
        </div>

        {/* Size and Price Display */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-100">
                {AudioSynthesisService.formatFileSize(estimatedSize)}
              </div>
              <div className="text-sm text-blue-400/70">Estimated Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
                {estimatedPrice.toFixed(2)}
              </div>
              <div className="text-sm text-blue-400/70">Download Price</div>
            </div>
          </div>
        </div>

        {/* Format Comparison */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-300">Format Comparison:</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-blue-500/5 rounded">
              <div className="font-medium text-blue-200">MP3</div>
              <div className="text-blue-400/70">
                {AudioSynthesisService.formatFileSize(
                  AudioSynthesisService.estimateFileSize(getDurationInSeconds(songLength), "mp3") *
                    getQualityMultiplier(quality) *
                    getComplexityMultiplier(complexity),
                )}
              </div>
            </div>
            <div className="text-center p-2 bg-blue-500/5 rounded">
              <div className="font-medium text-blue-200">WAV</div>
              <div className="text-blue-400/70">
                {AudioSynthesisService.formatFileSize(
                  AudioSynthesisService.estimateFileSize(getDurationInSeconds(songLength), "wav") *
                    getQualityMultiplier(quality) *
                    getComplexityMultiplier(complexity),
                )}
              </div>
            </div>
            <div className="text-center p-2 bg-blue-500/5 rounded">
              <div className="font-medium text-blue-200">FLAC</div>
              <div className="text-blue-400/70">
                {AudioSynthesisService.formatFileSize(
                  AudioSynthesisService.estimateFileSize(getDurationInSeconds(songLength), "flac") *
                    getQualityMultiplier(quality) *
                    getComplexityMultiplier(complexity),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Note */}
        <div className="text-xs text-blue-400/60 text-center">
          💡 Pricing is based on file size. Larger files cost more to download.
        </div>
      </CardContent>
    </Card>
  )
}
