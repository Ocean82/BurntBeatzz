<<<<<<< HEAD
// Allow both default and named imports
export { default as VoiceCloningAdvanced } from "./voice-cloning-advanced"
=======
"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Mic, Wand2, Layers, Crown, Upload, BarChart3, Play, Pause, Volume2, Globe, Lock, Trash2 } from "lucide-react"
import { useVoiceCloningEnhanced } from "@/hooks/use-voice-cloning-enhanced"

const NATIONAL_ANTHEM_TEXT = "Oh say can you see, by the dawn's early light, what so proudly we hailed..."

const genreOptions = [
  { value: "pop", label: "Pop" },
  { value: "rock", label: "Rock" },
  { value: "hiphop", label: "Hip Hop" },
  { value: "electronic", label: "Electronic" },
  { value: "classical", label: "Classical" },
  { value: "jazz", label: "Jazz" },
  { value: "country", label: "Country" },
  { value: "rnb", label: "R&B" },
]

interface VoiceCloningAdvancedProps {
  userId: number
  userPlan: string
  onUpgrade: () => void
}

export default function VoiceCloningAdvanced({ userId, userPlan, onUpgrade }: VoiceCloningAdvancedProps) {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("")
  const [voiceName, setVoiceName] = useState("")
  const [makePublic, setMakePublic] = useState(false)
  const [customSampleText, setCustomSampleText] = useState(NATIONAL_ANTHEM_TEXT)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("create")

  const {
    voices,
    recordedBlob,
    isRecording,
    isLoadingVoices,
    isCloningVoice,
    startRecording,
    stopRecording,
    cloneVoice,
    analyzeVoice,
    getPublicVoices,
    getUserVoices,
    clearRecording,
    hasRecording,
  } = useVoiceCloningEnhanced({ userId: userId.toString() })

  const publicVoices = getPublicVoices()
  const userVoices = getUserVoices()

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

    cloneVoice(audio, voiceName.trim(), makePublic, customSampleText)
    setVoiceName("")
    setUploadedFile(null)
    clearRecording()
  }

  const playAudio = (audioUrl: string, audioId: string) => {
    if (playingAudio === audioId) {
      setPlayingAudio(null)
      return
    }

    const audio = new Audio(audioUrl)
    audio.onended = () => setPlayingAudio(null)
    audio.play()
    setPlayingAudio(audioId)
  }

  if (userPlan === "free") {
    return (
      <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10 mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-green-300">
            🎤 Voice Cloning Studio (Premium Feature)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Wand2 className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-300 mb-2">Professional Voice Cloning</h3>
            <p className="text-sm text-green-400/60 mb-6 max-w-md mx-auto">
              Clone any voice with AI precision! Record samples, upload files, create custom anthems, and build your
              voice library with advanced processing technology.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs text-green-400/80">
              <div className="bg-black/40 p-3 rounded">
                <Mic className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p>High-Quality Recording</p>
              </div>
              <div className="bg-black/40 p-3 rounded">
                <BarChart3 className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p>Voice Analysis</p>
              </div>
              <div className="bg-black/40 p-3 rounded">
                <Globe className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p>Public Voice Library</p>
              </div>
              <div className="bg-black/40 p-3 rounded">
                <Volume2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p>Custom Anthems</p>
              </div>
            </div>
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
        <CardTitle className="text-lg font-semibold text-green-300">🎤 Professional Voice Cloning Studio</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/60 border border-green-500/20">
            <TabsTrigger
              value="create"
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              Create Voice
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              My Voices ({userVoices.length})
            </TabsTrigger>
            <TabsTrigger
              value="public"
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              Public Library ({publicVoices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6 mt-6">
            {/* Voice Creation Form */}
            <div className="bg-black/40 border border-green-500/20 rounded-lg p-6">
              <h3 className="text-green-300 font-medium mb-4 flex items-center">
                <Wand2 className="w-5 h-5 mr-2" />
                Create New Voice Model
              </h3>

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

              {/* Recording and Upload */}
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <Label className="text-sm font-medium text-green-300 mb-2 block">Record Voice Sample</Label>
                  <div className="flex items-center space-x-3 mb-3">
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

                  {recordedBlob && (
                    <div className="bg-black/60 border border-green-500/20 rounded-lg p-3">
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

                  {uploadedFile && (
                    <div className="mt-3 bg-black/60 border border-green-500/20 rounded-lg p-3">
                      <p className="text-sm text-green-300 mb-2 flex items-center">
                        <Upload className="w-4 h-4 mr-2" />
                        Uploaded File:
                      </p>
                      <audio
                        controls
                        src={URL.createObjectURL(uploadedFile)}
                        className="w-full"
                        style={{ filter: "hue-rotate(120deg)" }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Text */}
              <div className="mb-4">
                <Label className="text-sm font-medium text-green-300 mb-2 block">
                  Sample Text (for anthem generation)
                </Label>
                <Textarea
                  value={customSampleText}
                  onChange={(e) => setCustomSampleText(e.target.value)}
                  className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 resize-none focus:border-green-400 focus:ring-green-400/20"
                  rows={3}
                  placeholder="Enter text for anthem generation..."
                />
              </div>

              {/* Settings */}
              <div className="flex items-center space-x-2 mb-6">
                <Switch id="makePublic" checked={makePublic} onCheckedChange={setMakePublic} />
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
                {isCloningVoice ? "🔥 Creating Voice Model..." : "🎤 Create Voice Model"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="library" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-green-300 font-medium">Your Voice Models</h3>
              <p className="text-green-400/60 text-sm">{userVoices.length} voices created</p>
            </div>

            {userVoices.length === 0 ? (
              <div className="text-center py-8 bg-black/40 border border-green-500/20 rounded-lg">
                <Mic className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
                <p className="text-green-400/60">No voice models created yet</p>
                <Button
                  onClick={() => setActiveTab("create")}
                  variant="outline"
                  className="mt-4 text-green-300 border-green-500/30 bg-black/40 hover:bg-green-500/10 hover:border-green-400"
                >
                  Create Your First Voice
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {userVoices.map((voice) => (
                  <div key={voice.id} className="bg-black/60 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-green-100 font-medium">{voice.name}</h4>
                        <p className="text-green-400/60 text-sm flex items-center">
                          <Lock className="w-3 h-3 mr-1" />
                          Private • Created {new Date(voice.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => playAudio(voice.audioUrl, `${voice.id}-sample`)}
                          className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                        >
                          {playingAudio === `${voice.id}-sample` ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {voice.characteristics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="bg-black/40 p-2 rounded">
                          <p className="text-green-400/60">Clarity</p>
                          <p className="text-green-300 font-medium">
                            {(voice.characteristics.clarity * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="bg-black/40 p-2 rounded">
                          <p className="text-green-400/60">Timbre</p>
                          <p className="text-green-300 font-medium capitalize">{voice.characteristics.timbre}</p>
                        </div>
                        <div className="bg-black/40 p-2 rounded">
                          <p className="text-green-400/60">Pitch Range</p>
                          <p className="text-green-300 font-medium">
                            {voice.characteristics.pitchRange[0]}-{voice.characteristics.pitchRange[1]}Hz
                          </p>
                        </div>
                        <div className="bg-black/40 p-2 rounded">
                          <p className="text-green-400/60">Best Genre</p>
                          <p className="text-green-300 font-medium">
                            {voice.characteristics.genreSuitability &&
                              Object.entries(voice.characteristics.genreSuitability).reduce((a, b) =>
                                voice.characteristics!.genreSuitability![a[0]] >
                                voice.characteristics!.genreSuitability![b[0]]
                                  ? a
                                  : b,
                              )[0]}
                          </p>
                        </div>
                      </div>
                    )}

                    {voice.anthemUrl && (
                      <div className="mt-3 pt-3 border-t border-green-500/20">
                        <p className="text-sm text-green-300 mb-2 flex items-center">
                          <Volume2 className="w-4 h-4 mr-2" />
                          Anthem Sample:
                        </p>
                        <div className="flex items-center space-x-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => playAudio(voice.anthemUrl!, `${voice.id}-anthem`)}
                            className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                          >
                            {playingAudio === `${voice.id}-anthem` ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <span className="text-green-400/60 text-sm">National Anthem Demo</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="public" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-green-300 font-medium">Public Voice Library</h3>
              <p className="text-green-400/60 text-sm">{publicVoices.length} public voices available</p>
            </div>

            <div className="space-y-3">
              {publicVoices.map((voice) => (
                <div key={voice.id} className="bg-black/60 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-green-100 font-medium">{voice.name}</h4>
                      <p className="text-green-400/60 text-sm flex items-center">
                        <Globe className="w-3 h-3 mr-1" />
                        Public • System Voice
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => playAudio(voice.audioUrl, `${voice.id}-sample`)}
                        className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                      >
                        {playingAudio === `${voice.id}-sample` ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setSelectedVoiceId(voice.id)}
                        className="bg-green-500/20 text-green-300 hover:bg-green-500/30"
                      >
                        Use Voice
                      </Button>
                    </div>
                  </div>

                  {voice.characteristics && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-black/40 p-2 rounded">
                        <p className="text-green-400/60">Clarity</p>
                        <p className="text-green-300 font-medium">
                          {(voice.characteristics.clarity * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="bg-black/40 p-2 rounded">
                        <p className="text-green-400/60">Timbre</p>
                        <p className="text-green-300 font-medium capitalize">{voice.characteristics.timbre}</p>
                      </div>
                      <div className="bg-black/40 p-2 rounded">
                        <p className="text-green-400/60">Pitch Range</p>
                        <p className="text-green-300 font-medium">
                          {voice.characteristics.pitchRange[0]}-{voice.characteristics.pitchRange[1]}Hz
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
