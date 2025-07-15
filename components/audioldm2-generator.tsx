"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Music,
  AudioWaveformIcon as Waveform,
  Download,
  Play,
  Pause,
  Volume2,
  Settings,
  History,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Headphones,
  Mic,
  Guitar,
  Piano,
  Drum,
} from "lucide-react"
import { toast } from "sonner"
import { useAudioLDM2 } from "@/hooks/use-audioldm2"

export function AudioLDM2Generator() {
  const {
    generating,
    generationHistory,
    config,
    loading,
    loadConfig,
    generateAudio,
    generateFromMidi,
    generateDrumTrack,
    generateBassline,
    generateAmbient,
    enhanceAudio,
    downloadAudio,
    clearHistory,
    isAvailable,
    totalGenerations,
  } = useAudioLDM2()

  const [activeTab, setActiveTab] = useState("generate")
  const [prompt, setPrompt] = useState("")
  const [duration, setDuration] = useState([10])
  const [guidanceScale, setGuidanceScale] = useState([3.5])
  const [inferenceSteps, setInferenceSteps] = useState([50])
  const [negativePrompt, setNegativePrompt] = useState("low quality, distorted, noise")
  const [selectedGenre, setSelectedGenre] = useState("electronic")
  const [selectedKey, setSelectedKey] = useState("C")
  const [selectedMood, setSelectedMood] = useState("peaceful")
  const [tempo, setTempo] = useState([120])
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    await generateAudio({
      prompt,
      duration: duration[0],
      guidance_scale: guidanceScale[0],
      num_inference_steps: inferenceSteps[0],
      negative_prompt: negativePrompt,
    })
  }

  const handleGenerateDrums = async () => {
    await generateDrumTrack(selectedGenre, tempo[0])
  }

  const handleGenerateBass = async () => {
    await generateBassline(selectedKey, selectedGenre)
  }

  const handleGenerateAmbient = async () => {
    await generateAmbient(selectedMood, duration[0])
  }

  const toggleAudio = (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      setPlayingAudio(null)
    } else {
      setPlayingAudio(audioUrl)
    }
  }

  if (!isAvailable) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              AudioLDM2 is not configured. Please add your API key to environment variables.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AudioLDM2 Generator</h1>
          <p className="text-muted-foreground">Generate high-quality audio from text descriptions</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Headphones className="h-3 w-3 mr-1" />
            {config?.model || "AudioLDM2"}
          </Badge>
          <Badge variant="secondary">{totalGenerations} generated</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="instruments">Instruments</TabsTrigger>
          <TabsTrigger value="ambient">Ambient</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generation Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Audio Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Audio Description</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the audio you want to generate..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="negative">Negative Prompt (optional)</Label>
                  <Input
                    id="negative"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="What to avoid in the generation"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration: {duration[0]}s</Label>
                    <Slider
                      value={duration}
                      onValueChange={setDuration}
                      max={config?.maxDuration || 30}
                      min={1}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Guidance Scale: {guidanceScale[0]}</Label>
                    <Slider value={guidanceScale} onValueChange={setGuidanceScale} max={10} min={1} step={0.1} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Inference Steps: {inferenceSteps[0]}</Label>
                  <Slider value={inferenceSteps} onValueChange={setInferenceSteps} max={100} min={10} step={5} />
                </div>

                <Button onClick={handleGenerate} disabled={generating || !prompt.trim()} className="w-full">
                  {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Music className="h-4 w-4 mr-2" />}
                  Generate Audio
                </Button>
              </CardContent>
            </Card>

            {/* Quick Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Presets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setPrompt("Upbeat electronic dance music, energetic, synthesizers")}
                >
                  <Music className="h-4 w-4 mr-2" />
                  Electronic Dance
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setPrompt("Acoustic guitar melody, folk style, warm and intimate")}
                >
                  <Guitar className="h-4 w-4 mr-2" />
                  Acoustic Folk
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setPrompt("Classical piano composition, elegant, emotional")}
                >
                  <Piano className="h-4 w-4 mr-2" />
                  Classical Piano
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setPrompt("Jazz saxophone solo, smooth, improvisational")}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Jazz Saxophone
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setPrompt("Orchestral cinematic score, epic, dramatic")}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Cinematic Orchestra
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Instruments Tab */}
        <TabsContent value="instruments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Drum Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Drum className="h-5 w-5" />
                  Drum Track
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Genre</Label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronic">Electronic</SelectItem>
                      <SelectItem value="rock">Rock</SelectItem>
                      <SelectItem value="jazz">Jazz</SelectItem>
                      <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                      <SelectItem value="latin">Latin</SelectItem>
                      <SelectItem value="funk">Funk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tempo: {tempo[0]} BPM</Label>
                  <Slider value={tempo} onValueChange={setTempo} max={200} min={60} step={5} />
                </div>

                <Button onClick={handleGenerateDrums} disabled={generating} className="w-full">
                  {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Drum className="h-4 w-4 mr-2" />}
                  Generate Drums
                </Button>
              </CardContent>
            </Card>

            {/* Bass Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Guitar className="h-5 w-5" />
                  Bassline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Key</Label>
                  <Select value={selectedKey} onValueChange={setSelectedKey}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C">C Major</SelectItem>
                      <SelectItem value="G">G Major</SelectItem>
                      <SelectItem value="D">D Major</SelectItem>
                      <SelectItem value="A">A Major</SelectItem>
                      <SelectItem value="E">E Major</SelectItem>
                      <SelectItem value="F">F Major</SelectItem>
                      <SelectItem value="Am">A Minor</SelectItem>
                      <SelectItem value="Em">E Minor</SelectItem>
                      <SelectItem value="Dm">D Minor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="funk">Funk</SelectItem>
                      <SelectItem value="rock">Rock</SelectItem>
                      <SelectItem value="jazz">Jazz</SelectItem>
                      <SelectItem value="electronic">Electronic</SelectItem>
                      <SelectItem value="reggae">Reggae</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleGenerateBass} disabled={generating} className="w-full">
                  {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Guitar className="h-4 w-4 mr-2" />}
                  Generate Bass
                </Button>
              </CardContent>
            </Card>

            {/* Enhancement Tool */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waveform className="h-5 w-5" />
                  Audio Enhancement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Audio URL</Label>
                  <Input
                    placeholder="https://example.com/audio.wav"
                    onChange={(e) => {
                      // Store URL for enhancement
                    }}
                  />
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Upload an audio file to enhance its quality using AudioLDM2</AlertDescription>
                </Alert>

                <Button disabled={generating} className="w-full">
                  {generating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Waveform className="h-4 w-4 mr-2" />
                  )}
                  Enhance Audio
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ambient Tab */}
        <TabsContent value="ambient" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Ambient Texture Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant={selectedMood === "peaceful" ? "default" : "outline"}
                  onClick={() => setSelectedMood("peaceful")}
                >
                  Peaceful
                </Button>
                <Button
                  variant={selectedMood === "dark" ? "default" : "outline"}
                  onClick={() => setSelectedMood("dark")}
                >
                  Dark
                </Button>
                <Button
                  variant={selectedMood === "ethereal" ? "default" : "outline"}
                  onClick={() => setSelectedMood("ethereal")}
                >
                  Ethereal
                </Button>
                <Button
                  variant={selectedMood === "mysterious" ? "default" : "outline"}
                  onClick={() => setSelectedMood("mysterious")}
                >
                  Mysterious
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Duration: {duration[0]}s</Label>
                <Slider value={duration} onValueChange={setDuration} max={config?.maxDuration || 30} min={5} step={5} />
              </div>

              <Button onClick={handleGenerateAmbient} disabled={generating} className="w-full">
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Volume2 className="h-4 w-4 mr-2" />}
                Generate {selectedMood} Ambient
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Generation History
                </div>
                {generationHistory.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearHistory}>
                    Clear History
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {generationHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No generations yet</div>
                  ) : (
                    generationHistory.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <div className="font-medium">{result.metadata.prompt}</div>
                            <div className="text-sm text-muted-foreground">
                              {result.duration}s • {new Date(result.metadata.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.success && result.audio_url && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => toggleAudio(result.audio_url!)}>
                                {playingAudio === result.audio_url ? (
                                  <Pause className="h-3 w-3" />
                                ) : (
                                  <Play className="h-3 w-3" />
                                )}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => downloadAudio(result)}>
                                <Download className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Audio Player */}
      {playingAudio && (
        <Card>
          <CardContent className="pt-6">
            <audio src={playingAudio} controls autoPlay className="w-full" onEnded={() => setPlayingAudio(null)} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
