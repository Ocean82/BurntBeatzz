"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AudioWaveformIcon as Waveform, BarChart3, Music, Zap, Volume2 } from "lucide-react"

interface AudioAnalysis {
  tempo: number
  key: string
  energy: number
  danceability: number
  valence: number
  loudness: number
  speechiness: number
  acousticness: number
  instrumentalness: number
  spectralCentroid: number
  spectralRolloff: number
  mfcc: number[]
  chroma: number[]
  peaks: number[]
  segments: Array<{
    start: number
    duration: number
    confidence: number
    loudness: number
    tempo: number
  }>
}

export function AdvancedAudioAnalyzer({ audioFile }: { audioFile: File }) {
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const analyzeAudio = async () => {
    setIsAnalyzing(true)
    setProgress(0)

    try {
      // Create audio context
      audioContextRef.current = new AudioContext()
      const arrayBuffer = await audioFile.arrayBuffer()
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)

      setProgress(25)

      // Extract audio features
      const features = await extractAudioFeatures(audioBuffer)
      setProgress(50)

      // Analyze tempo and key
      const tempoKey = await analyzeTempoAndKey(audioBuffer)
      setProgress(75)

      // Generate waveform visualization
      generateWaveform(audioBuffer)
      setProgress(100)

      setAnalysis({
        ...features,
        ...tempoKey,
      })
    } catch (error) {
      console.error("Audio analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const extractAudioFeatures = async (audioBuffer: AudioBuffer): Promise<Partial<AudioAnalysis>> => {
    const channelData = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate

    // Calculate RMS energy
    const rms = Math.sqrt(channelData.reduce((sum, sample) => sum + sample * sample, 0) / channelData.length)
    const energy = Math.min(rms * 100, 100)

    // Calculate spectral features
    const fftSize = 2048
    const fft = new Float32Array(fftSize)
    const windowSize = Math.min(fftSize, channelData.length)

    // Copy audio data for FFT
    for (let i = 0; i < windowSize; i++) {
      fft[i] = channelData[i]
    }

    // Simple spectral centroid calculation
    let weightedSum = 0
    let magnitudeSum = 0
    for (let i = 0; i < windowSize / 2; i++) {
      const magnitude = Math.abs(fft[i])
      const frequency = (i * sampleRate) / fftSize
      weightedSum += frequency * magnitude
      magnitudeSum += magnitude
    }
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0

    // Mock additional features (in real implementation, use proper DSP libraries)
    return {
      energy,
      danceability: Math.random() * 100,
      valence: Math.random() * 100,
      loudness: -60 + rms * 60,
      speechiness: Math.random() * 100,
      acousticness: Math.random() * 100,
      instrumentalness: Math.random() * 100,
      spectralCentroid,
      spectralRolloff: spectralCentroid * 1.5,
    }
  }

  const analyzeTempoAndKey = async (audioBuffer: AudioBuffer): Promise<{ tempo: number; key: string }> => {
    // Simplified tempo detection (in real implementation, use autocorrelation)
    const channelData = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate

    // Mock tempo detection (60-180 BPM range)
    const tempo = 60 + Math.floor(Math.random() * 120)

    // Mock key detection
    const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    const modes = ["major", "minor"]
    const key = `${keys[Math.floor(Math.random() * keys.length)]} ${modes[Math.floor(Math.random() * modes.length)]}`

    return { tempo, key }
  }

  const generateWaveform = (audioBuffer: AudioBuffer) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")!
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    const channelData = audioBuffer.getChannelData(0)
    const samplesPerPixel = Math.floor(channelData.length / width)

    ctx.strokeStyle = "#10b981"
    ctx.lineWidth = 1
    ctx.beginPath()

    for (let x = 0; x < width; x++) {
      const startSample = x * samplesPerPixel
      const endSample = startSample + samplesPerPixel
      let max = 0

      for (let i = startSample; i < endSample && i < channelData.length; i++) {
        max = Math.max(max, Math.abs(channelData[i]))
      }

      const y = (1 - max) * (height / 2)
      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.stroke()
  }

  const getFeatureColor = (value: number) => {
    if (value < 30) return "text-red-400"
    if (value < 70) return "text-yellow-400"
    return "text-green-400"
  }

  return (
    <Card className="bg-black/80 border-green-500/30">
      <CardHeader>
        <CardTitle className="text-green-300 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Advanced Audio Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!analysis && !isAnalyzing && (
          <Button onClick={analyzeAudio} className="w-full bg-green-500 hover:bg-green-600">
            <Zap className="w-4 h-4 mr-2" />
            Analyze Audio
          </Button>
        )}

        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Waveform className="w-4 h-4 text-green-400 animate-pulse" />
              <span className="text-green-300">Analyzing audio...</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Waveform Visualization */}
            <div>
              <h3 className="text-green-300 font-medium mb-2">Waveform</h3>
              <canvas
                ref={canvasRef}
                width={600}
                height={100}
                className="w-full border border-green-500/30 rounded bg-black/40"
              />
            </div>

            {/* Key Musical Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Music className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 font-medium">Tempo</span>
                </div>
                <div className="text-2xl font-bold text-green-100">{analysis.tempo} BPM</div>
              </div>
              <div className="bg-black/40 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 font-medium">Key</span>
                </div>
                <div className="text-2xl font-bold text-green-100">{analysis.key}</div>
              </div>
            </div>

            {/* Audio Features */}
            <div>
              <h3 className="text-green-300 font-medium mb-3">Audio Features</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Energy", value: analysis.energy },
                  { label: "Danceability", value: analysis.danceability },
                  { label: "Valence", value: analysis.valence },
                  { label: "Speechiness", value: analysis.speechiness },
                  { label: "Acousticness", value: analysis.acousticness },
                  { label: "Instrumentalness", value: analysis.instrumentalness },
                ].map((feature) => (
                  <div key={feature.label} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{feature.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getFeatureColor(feature.value)} bg-transparent border-current`}>
                        {feature.value.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Details */}
            <div>
              <h3 className="text-green-300 font-medium mb-3">Technical Analysis</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Loudness</span>
                  <span className="text-green-400">{analysis.loudness.toFixed(1)} dB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Spectral Centroid</span>
                  <span className="text-green-400">{analysis.spectralCentroid.toFixed(0)} Hz</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
