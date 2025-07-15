"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mic, Wand2, Layers, Crown, Upload, BarChart3 } from "lucide-react"
import { useVoiceCloning } from "@/hooks/use-voice-cloning"

const genreOptions = [
  { value: "pop", label: "Pop" },
  { value: "rock", label: "Rock" },
  { value: "hiphop", label: "Hip Hop" },
  { value: "electronic", label: "Electronic" },
  { value: "classical", label: "Classical" },
]

const styleOptions = [
  { value: "smooth", label: "Smooth" },
  { value: "raw", label: "Raw" },
  { value: "energetic", label: "Energetic" },
  { value: "mellow", label: "Mellow" },
]

interface VoiceCloningProps {
  userId: number
  userPlan: string
  onUpgrade: () => void
}

export default function VoiceCloning({ userId, userPlan, onUpgrade }: VoiceCloningProps) {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("")
  const [voiceName, setVoiceName] = useState("")
  const [makePublic, setMakePublic] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const {
    voices,
    recordedBlob,
    isRecording,
    isLoadingVoices,
    isCloningVoice,
    isAnalyzingVoice,
    startRecording,
    stopRecording,
    cloneVoice,
    analyzeVoice,
    clearRecording,
  } = useVoiceCloning({ userId: userId.toString() })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      if (userPlan !== "free") {
        analyzeVoice(file)
      }
    }
  }

  const handleCloneVoice = () => {
    const audio = recordedBlob || uploadedFile
    if (!audio || !voiceName.trim()) return

    cloneVoice(audio, voiceName.trim(), makePublic)
    setVoiceName("")
    setUploadedFile(null)
    clearRecording()
  }

  if (userPlan === "free") {
    return (
      <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10 mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-green-300">🎤 Voice Cloning (Premium Feature)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Wand2 className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-300 mb-2">AI Voice Cloning</h3>
            <p className="text-sm text-green-400/60 mb-6 max-w-md mx-auto">
              Clone any voice and use it for song generation! Record your own voice or upload samples to create unique
              vocal tracks with advanced AI technology.
            </p>
            <Button
              onClick={onUpgrade}
              className="bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Basic - $6.99/mo
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10 mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-green-300">🎤 Advanced Voice Cloning Studio</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Available Voices */}
          <div>
            <Label className="text-sm font-medium text-green-300 mb-2 block">Available Voice Models</Label>
            <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId}>
              <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100 focus:border-green-400 focus:ring-green-400/20">
                <SelectValue placeholder="Select a voice model for generation" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-green-500/30">
                {isLoadingVoices ? (
                  <SelectItem value="loading" disabled className="text-green-400/60">
                    Loading voices...
                  </SelectItem>
                ) : (
                  voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id} className="text-green-100 focus:bg-green-500/20">
                      {voice.name} {voice.isPublic ? "🌍" : "🔒"}
                      <span className="text-green-400/60 ml-2">
                        ({voice.characteristics.timbre}, {(voice.characteristics.clarity * 100).toFixed(0)}% clarity)
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Voice Creation Section */}
          <div className="bg-black/40 border border-green-500/20 rounded-lg p-4">
            <h3 className="text-green-300 font-medium mb-4">🎙️ Create New Voice Model</h3>

            {/* Voice Name */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-green-300 mb-2 block">Voice Model Name</Label>
              <Input
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="Enter a name for your voice model..."
                className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
              />
            </div>

            {/* Recording Interface */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-sm font-medium text-green-300 mb-2 block">Record Voice Sample</Label>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-12 h-12 rounded-full ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 animate-pulse"
                        : "bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600"
                    } shadow-lg`}
                  >
                    {isRecording ? <Layers className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
                  </Button>
                  <div className="flex-1">
                    <p className="text-sm text-green-300">{isRecording ? "🔴 Recording..." : "Click to record"}</p>
                    <p className="text-xs text-green-400/60">10-30 seconds recommended</p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-green-300 mb-2 block">Upload Audio File</Label>
                <div className="relative">
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="bg-black/60 border-green-500/30 text-green-100 file:bg-green-500/20 file:border-0 file:text-green-300 file:mr-4 file:py-2 file:px-4 file:rounded"
                  />
                  {uploadedFile && (
                    <div className="mt-2 flex items-center text-xs text-green-400">
                      <Upload className="w-3 h-3 mr-1" />
                      {uploadedFile.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Audio Previews */}
            {recordedBlob && (
              <div className="mb-4 bg-black/60 border border-green-500/20 rounded-lg p-3">
                <p className="text-sm text-green-300 mb-2 flex items-center">
                  <Mic className="w-4 h-4 mr-2" />
                  Recorded Sample:
                </p>
                <audio
                  controls
                  src={URL.createObjectURL(recordedBlob)}
                  className="w-full"
                  style={{ filter: "hue-rotate(120deg)" }}
                />
              </div>
            )}

            {uploadedFile && (
              <div className="mb-4 bg-black/60 border border-green-500/20 rounded-lg p-3">
                <p className="text-sm text-green-300 mb-2 flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Uploaded File:
                  {isAnalyzingVoice && (
                    <span className="ml-2 text-green-400/60 flex items-center">
                      <BarChart3 className="w-3 h-3 mr-1 animate-pulse" />
                      Analyzing...
                    </span>
                  )}
                </p>
                <audio
                  controls
                  src={URL.createObjectURL(uploadedFile)}
                  className="w-full"
                  style={{ filter: "hue-rotate(120deg)" }}
                />
              </div>
            )}

            {/* Public/Private Toggle */}
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="makePublic"
                checked={makePublic}
                onChange={(e) => setMakePublic(e.target.checked)}
                className="rounded border-green-500/30 bg-black/60 text-green-500 focus:ring-green-400/20"
              />
              <Label htmlFor="makePublic" className="text-sm text-green-300">
                Make this voice model public (others can use it)
              </Label>
            </div>

            {/* Clone Button */}
            <Button
              onClick={handleCloneVoice}
              disabled={isCloningVoice || (!recordedBlob && !uploadedFile) || !voiceName.trim()}
              className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isCloningVoice ? "🔥 Cloning Voice..." : "🎤 Create Voice Model"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
