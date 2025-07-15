"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Download, Music, Settings, Info } from "lucide-react"

interface RVCModel {
  id: string
  name: string
  path: string
  size_mb: number
  created: string
}

interface GenerationProgress {
  stage: string
  progress: number
  eta: string
  details: string
}

interface GeneratedSong {
  id: string
  title: string
  audioPath: string
  duration: number
  format: string
  hasVocals: boolean
  metadata: {
    genre: string
    mood: string
    tempo: number
    key: string
    rvcModel?: string
  }
  createdAt: string
}

export default function CompleteSongGenerator() {
  // Song parameters
  const [songTitle, setSongTitle] = useState("")
  const [genre, setGenre] = useState("")
  const [mood, setMood] = useState("")
  const [tempo, setTempo] = useState([120])
  const [musicalKey, setMusicalKey] = useState("C")
  const [complexity, setComplexity] = useState([5])
  const [lyrics, setLyrics] = useState("")
  const [outputFormat, setOutputFormat] = useState("wav")

  // RVC settings
  const [selectedRVCModel, setSelectedRVCModel] = useState("")
  const [availableModels, setAvailableModels] = useState<RVCModel[]>([])
  const [pitchShift, setPitchShift] = useState([0])
  const [vocalVolume, setVocalVolume] = useState([0.8])
  const [instrumentalVolume, setInstrumentalVolume] = useState([0.6])

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    stage: "",
    progress: 0,
    eta: "",
    details: "",
  })
  const [generatedSong, setGeneratedSong] = useState<GeneratedSong | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Audio playback
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  const genres = [
    "Pop",
    "Rock",
    "Hip Hop",
    "Electronic",
    "Jazz",
    "Classical",
    "Country",
    "R&B",
    "Folk",
    "Reggae",
    "Blues",
    "Funk",
  ]

  const moods = [
    "Happy",
    "Sad",
    "Energetic",
    "Calm",
    "Romantic",
    "Aggressive",
    "Mysterious",
    "Uplifting",
    "Melancholic",
    "Triumphant",
  ]

  const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

  const loadAvailableModels = useCallback(async () => {
    try {
      const response = await fetch("/api/backend/train-rvc-model")
      if (response.ok) {
        const data = await response.json()
        setAvailableModels(data.models || [])
      }
    } catch (error) {
      console.error("Failed to load RVC models:", error)
    }
  }, [])

  // Load models on component mount
  React.useEffect(() => {
    loadAvailableModels()
  }, [loadAvailableModels])

  const generateSong = async () => {
    if (!songTitle.trim() || !genre || !mood) {
      setError("Please fill in song title, genre, and mood")
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedSong(null)

    try {
      // Simulate generation progress stages
      const progressStages = [
        { stage: "Analyzing musical parameters...", progress: 5, eta: "3 min", details: "Processing genre and mood" },
        {
          stage: "Generating MIDI composition...",
          progress: 15,
          eta: "2.5 min",
          details: "Creating melody and harmony",
        },
        {
          stage: "Rendering instrumental tracks...",
          progress: 30,
          eta: "2 min",
          details: "Converting MIDI to audio with SoundFonts",
        },
        {
          stage: "Processing vocals with RVC...",
          progress: 50,
          eta: "1.5 min",
          details: selectedRVCModel ? "Converting MIDI vocals to RVC singing" : "Skipping vocal processing",
        },
        {
          stage: "Mixing and mastering...",
          progress: 75,
          eta: "1 min",
          details: "Applying professional audio effects",
        },
        { stage: "Finalizing song...", progress: 95, eta: "10 sec", details: "Saving final mix" },
        { stage: "Complete!", progress: 100, eta: "0 sec", details: "Song generation finished" },
      ]

      for (const stage of progressStages) {
        setGenerationProgress(stage)
        await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate processing time
      }

      // Make actual API call
      const response = await fetch("/api/backend/generate-complete-song", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: songTitle,
          genre: genre,
          mood: mood,
          tempo: tempo[0],
          key: musicalKey,
          complexity: complexity[0],
          lyrics: lyrics.trim() || undefined,
          rvcModelPath: selectedRVCModel || undefined,
          outputFormat: outputFormat,
          pitchShift: pitchShift[0],
          vocalVolume: vocalVolume[0],
          instrumentalVolume: instrumentalVolume[0],
        }),
      })

      if (!response.ok) {
        throw new Error("Song generation failed")
      }

      const result = await response.json()

      const newSong: GeneratedSong = {
        id: `song_${Date.now()}`,
        title: songTitle,
        audioPath: result.song.audioPath,
        duration: result.song.duration || 0,
        format: outputFormat,
        hasVocals: !!selectedRVCModel && !!lyrics.trim(),
        metadata: {
          genre,
          mood,
          tempo: tempo[0],
          key: musicalKey,
          rvcModel: selectedRVCModel || undefined,
        },
        createdAt: new Date().toISOString(),
      }

      setGeneratedSong(newSong)
      setGenerationProgress({ stage: "Complete!", progress: 100, eta: "0 sec", details: "Song ready to play!" })
    } catch (error) {
      setError(error instanceof Error ? error.message : "Song generation failed")
    } finally {
      setIsGenerating(false)
    }
  }

  const playPauseSong = () => {
    if (!generatedSong) return

    if (audioElement) {
      if (isPlaying) {
        audioElement.pause()
        setIsPlaying(false)
      } else {
        audioElement.play()
        setIsPlaying(true)
      }
    } else {
      const audio = new Audio(generatedSong.audioPath)
      audio.addEventListener("ended", () => setIsPlaying(false))
      audio.addEventListener("error", () => {
        setError("Failed to play audio")
        setIsPlaying(false)
      })
      audio.play()
      setAudioElement(audio)
      setIsPlaying(true)
    }
  }

  const downloadSong = () => {
    if (!generatedSong) return

    const link = document.createElement("a")
    link.href = generatedSong.audioPath
    link.download = `${generatedSong.title}.${generatedSong.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-6 w-6" />
            Complete Song Generator
          </CardTitle>
          <CardDescription>
            Generate complete songs with MIDI instrumentals and optional RVC vocals using Ocean82/RVC integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="compose" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="vocals">Vocals & RVC</TabsTrigger>
              <TabsTrigger value="mix">Mix & Export</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Basic Song Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="song-title">Song Title</Label>
                  <Input
                    id="song-title"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="Enter song title"
                    disabled={isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Genre</Label>
                  <Select value={genre} onValueChange={setGenre} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((g) => (
                        <SelectItem key={g} value={g.toLowerCase()}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mood</Label>
                  <Select value={mood} onValueChange={setMood} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mood" />
                    </SelectTrigger>
                    <SelectContent>
                      {moods.map((m) => (
                        <SelectItem key={m} value={m.toLowerCase()}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Key</Label>
                  <Select value={musicalKey} onValueChange={setMusicalKey} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select key" />
                    </SelectTrigger>
                    <SelectContent>
                      {keys.map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Parameters */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tempo: {tempo[0]} BPM</Label>
                  <Slider
                    value={tempo}
                    onValueChange={setTempo}
                    min={60}
                    max={200}
                    step={5}
                    disabled={isGenerating}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Complexity: {complexity[0]}/10</Label>
                  <Slider
                    value={complexity}
                    onValueChange={setComplexity}
                    min={1}
                    max={10}
                    step={1}
                    disabled={isGenerating}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Higher complexity adds more instruments, chord progressions, and musical variations
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vocals" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lyrics">Lyrics (Optional)</Label>
                  <Textarea
                    id="lyrics"
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    placeholder="Enter song lyrics here... (leave empty for instrumental only)"
                    rows={6}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-gray-500">
                    Lyrics will be converted to MIDI vocals, then processed with RVC for realistic singing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>RVC Voice Model</Label>
                  <Select value={selectedRVCModel} onValueChange={setSelectedRVCModel} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select RVC model (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-vocals">No vocals (instrumental only)</SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model.id} value={model.path}>
                          {model.name} ({model.size_mb} MB)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableModels.length === 0 && (
                    <p className="text-xs text-gray-500">
                      No RVC models available. Train a model in the Voice Trainer first.
                    </p>
                  )}
                </div>

                {selectedRVCModel && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Pitch Shift: {pitchShift[0]} semitones</Label>
                      <Slider
                        value={pitchShift}
                        onValueChange={setPitchShift}
                        min={-12}
                        max={12}
                        step={1}
                        disabled={isGenerating}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">Adjust vocal pitch to match your preferred range</p>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>RVC Processing:</strong> Your lyrics will be converted to MIDI vocals, then processed
                        through the selected RVC model to create realistic singing with your trained voice
                        characteristics.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="mix" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wav">WAV (Uncompressed)</SelectItem>
                      <SelectItem value="mp3">MP3 (320kbps)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Vocal Volume: {Math.round(vocalVolume[0] * 100)}%</Label>
                  <Slider
                    value={vocalVolume}
                    onValueChange={setVocalVolume}
                    min={0}
                    max={1}
                    step={0.1}
                    disabled={isGenerating || !selectedRVCModel}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instrumental Volume: {Math.round(instrumentalVolume[0] * 100)}%</Label>
                  <Slider
                    value={instrumentalVolume}
                    onValueChange={setInstrumentalVolume}
                    min={0}
                    max={1}
                    step={0.1}
                    disabled={isGenerating}
                    className="w-full"
                  />
                </div>

                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Professional Mixing:</strong> The final song will include compression, EQ, and mastering
                    effects for radio-ready quality. MIDI instrumentals are rendered with high-quality SoundFonts.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <Label>Generation Progress</Label>
                <Badge variant="secondary">{generationProgress.progress}%</Badge>
              </div>
              <Progress value={generationProgress.progress} className="w-full" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{generationProgress.stage}</span>
                <span>ETA: {generationProgress.eta}</span>
              </div>
              <p className="text-xs text-gray-500">{generationProgress.details}</p>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateSong}
            disabled={isGenerating || !songTitle.trim() || !genre || !mood}
            className="w-full mt-6"
            size="lg"
          >
            {isGenerating ? "Generating..." : "Generate Complete Song"}
          </Button>

          {/* Generated Song */}
          {generatedSong && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{generatedSong.title}</span>
                  <div className="flex items-center gap-2">
                    {generatedSong.hasVocals && <Badge>With Vocals</Badge>}
                    <Badge variant="outline">{generatedSong.format.toUpperCase()}</Badge>
                  </div>
                </CardTitle>
                <CardDescription>
                  {generatedSong.metadata.genre} • {generatedSong.metadata.mood} • {generatedSong.metadata.tempo} BPM •
                  Key of {generatedSong.metadata.key}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button onClick={playPauseSong} variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <Button onClick={downloadSong} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>Duration: {Math.round(generatedSong.duration)} seconds</p>
                  <p>Created: {new Date(generatedSong.createdAt).toLocaleString()}</p>
                  {generatedSong.metadata.rvcModel && <p>RVC Model: {generatedSong.metadata.rvcModel}</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Technical Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Technical Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">MIDI Generation</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• music21 for composition</li>
                <li>• FluidSynth + SoundFonts</li>
                <li>• 44.1kHz sample rate</li>
                <li>• Professional mixing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">RVC Vocals</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Ocean82/RVC integration</li>
                <li>• MIDI → Monotone → RVC</li>
                <li>• Pitch/timing correction</li>
                <li>• Voice model caching</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
