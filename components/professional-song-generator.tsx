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
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Music,
  Mic,
  Download,
  Play,
  Pause,
  Star,
  Award,
  CheckCircle,
  Clock,
  Volume2,
  BarChart3,
  Shield,
} from "lucide-react"
import { useSongGeneration, type SongGenerationRequest } from "@/hooks/use-song-generation"
import DownloadPricing from "./download-pricing"

export default function ProfessionalSongGenerator() {
  const [formData, setFormData] = useState<SongGenerationRequest>({
    title: "Digital Dreams",
    lyrics: `Verse 1:
In the neon glow of midnight screens
Digital hearts and electric dreams
Code and rhythm intertwine
In this world of yours and mine

Chorus:
We're living in digital dreams
Nothing's quite the way it seems
Pixels dancing in the light
Electronic paradise

Verse 2:
Synthesized emotions flow
Through the circuits that we know
Binary beats and cyber soul
Technology has made us whole

(Repeat Chorus)

Bridge:
When the servers sleep at night
And the data streams run bright
We'll remember who we are
In this digital bazaar`,
    genre: "Electronic",
    style: "Synthwave",
    tempo: 128,
    key: "C minor",
    timeSignature: "4/4",
    mood: "Energetic",
    complexity: "moderate",
    includeStems: true,
    commercialRights: true,
    qualityLevel: "premium",
  })

  const [showPricing, setShowPricing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const {
    isGenerating,
    progress,
    error,
    generatedSong,
    generateSong,
    clearError,
    clearSong,
    getQualityDescription,
    getCommercialReadinessDescription,
  } = useSongGeneration()

  const handleGenerate = async () => {
    try {
      clearError()
      await generateSong(formData)
    } catch (err) {
      console.error("Generation failed:", err)
    }
  }

  const handlePurchase = (tier: string, includeLicense: boolean) => {
    console.log("Purchase:", { tier, includeLicense, songId: generatedSong?.songId })
    // Implement purchase logic here
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
    // Implement audio playback logic here
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-green-300 flex items-center gap-3">
              <Music className="w-8 h-8" />
              Professional AI Song Generator
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">STUDIO QUALITY</Badge>
            </CardTitle>
            <p className="text-green-400/60">
              Generate professional-quality music with complete commercial rights using Music21 + Advanced AI Pipeline
            </p>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Generation Form */}
          <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-300 flex items-center gap-2">
                <Mic className="w-5 h-5" />
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
                  <Select value={formData.genre} onValueChange={(value) => setFormData({ ...formData, genre: value })}>
                    <SelectTrigger className="bg-black/40 border-green-500/30 text-green-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronic">Electronic</SelectItem>
                      <SelectItem value="Pop">Pop</SelectItem>
                      <SelectItem value="Rock">Rock</SelectItem>
                      <SelectItem value="Jazz">Jazz</SelectItem>
                      <SelectItem value="Classical">Classical</SelectItem>
                      <SelectItem value="Hip-Hop">Hip-Hop</SelectItem>
                      <SelectItem value="Country">Country</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tempo" className="text-green-300">
                    Tempo (BPM)
                  </Label>
                  <Input
                    id="tempo"
                    type="number"
                    value={formData.tempo}
                    onChange={(e) => setFormData({ ...formData, tempo: Number.parseInt(e.target.value) })}
                    className="bg-black/40 border-green-500/30 text-green-100"
                  />
                </div>
                <div>
                  <Label htmlFor="key" className="text-green-300">
                    Key
                  </Label>
                  <Select value={formData.key} onValueChange={(value) => setFormData({ ...formData, key: value })}>
                    <SelectTrigger className="bg-black/40 border-green-500/30 text-green-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C major">C major</SelectItem>
                      <SelectItem value="C minor">C minor</SelectItem>
                      <SelectItem value="G major">G major</SelectItem>
                      <SelectItem value="G minor">G minor</SelectItem>
                      <SelectItem value="D major">D major</SelectItem>
                      <SelectItem value="D minor">D minor</SelectItem>
                      <SelectItem value="A major">A major</SelectItem>
                      <SelectItem value="A minor">A minor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="complexity" className="text-green-300">
                    Complexity
                  </Label>
                  <Select
                    value={formData.complexity}
                    onValueChange={(value: any) => setFormData({ ...formData, complexity: value })}
                  >
                    <SelectTrigger className="bg-black/40 border-green-500/30 text-green-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="complex">Complex</SelectItem>
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
                  placeholder="Enter your song lyrics..."
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
                    Generating Professional Song...
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

          {/* Generation Progress & Results */}
          <div className="space-y-6">
            {/* Progress */}
            {progress && (
              <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-300 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Generation Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-300 capitalize">{progress.stage.replace("_", " ")}</span>
                      <span className="text-green-400">{progress.progress}%</span>
                    </div>
                    <Progress value={progress.progress} className="h-2" />
                    <p className="text-green-400/60 text-sm">{progress.message}</p>
                    {progress.estimatedTimeRemaining && (
                      <p className="text-green-400/40 text-xs">
                        Estimated time remaining: {progress.estimatedTimeRemaining}s
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card className="bg-red-900/20 border border-red-500/30">
                <CardContent className="p-4">
                  <p className="text-red-300">{error}</p>
                  <Button onClick={clearError} variant="outline" className="mt-2 bg-transparent">
                    Clear Error
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Generated Song Results */}
            {generatedSong && (
              <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-300 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Generated Song: "{generatedSong.title}"
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Audio Player */}
                  <div className="bg-black/40 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <Button onClick={togglePlayback} className="bg-green-500 hover:bg-green-600">
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </Button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Volume2 className="w-4 h-4 text-green-400" />
                          <span className="text-green-300 font-medium">{generatedSong.title}</span>
                        </div>
                        <div className="bg-green-500/20 h-2 rounded-full">
                          <div className="bg-green-500 h-2 rounded-full w-1/3"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quality Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-green-300 font-medium flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Quality Metrics
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-green-400/80 text-sm">Overall Score</span>
                          <span className="text-green-300 font-medium">
                            {generatedSong.composition.qualityMetrics.overallScore}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-400/80 text-sm">Melodic Coherence</span>
                          <span className="text-green-300 font-medium">
                            {generatedSong.composition.qualityMetrics.melodicCoherence}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-400/80 text-sm">Harmonic Richness</span>
                          <span className="text-green-300 font-medium">
                            {generatedSong.composition.qualityMetrics.harmonicRichness}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-400/80 text-sm">Production Quality</span>
                          <span className="text-green-300 font-medium">
                            {generatedSong.composition.qualityMetrics.productionQuality}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-green-300 font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Commercial Rights
                      </h4>
                      <div className="space-y-2">
                        {generatedSong.commercialRights.ownership && (
                          <div className="flex items-center gap-2 text-sm text-green-300">
                            <CheckCircle className="w-3 h-3" />
                            {generatedSong.commercialRights.ownership}
                          </div>
                        )}
                        {generatedSong.commercialRights.commercialUse && (
                          <div className="flex items-center gap-2 text-sm text-green-300">
                            <CheckCircle className="w-3 h-3" />
                            Commercial Use Allowed
                          </div>
                        )}
                        {generatedSong.commercialRights.royaltyFree && (
                          <div className="flex items-center gap-2 text-sm text-green-300">
                            <CheckCircle className="w-3 h-3" />
                            Royalty Free
                          </div>
                        )}
                        {generatedSong.commercialRights.exclusiveRights && (
                          <div className="flex items-center gap-2 text-sm text-green-300">
                            <CheckCircle className="w-3 h-3" />
                            Exclusive Rights
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-green-500/20" />

                  {/* Download Options */}
                  <div>
                    <Button
                      onClick={() => setShowPricing(!showPricing)}
                      className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      View Download Options
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Download Pricing Modal */}
        {showPricing && generatedSong && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <DownloadPricing
                songId={Number.parseInt(generatedSong.songId)}
                fileSizeMB={generatedSong.composition.metadata.fileSize / (1024 * 1024)}
                songTitle={generatedSong.title}
                onPurchase={handlePurchase}
              />
              <Button onClick={() => setShowPricing(false)} variant="outline" className="w-full mt-4">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
