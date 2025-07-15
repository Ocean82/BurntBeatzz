"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Upload,
  Music,
  Play,
  Pause,
  Download,
  FileAudio,
  AudioWaveformIcon as Waveform,
  Settings,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Volume2,
  Headphones,
  Mic,
  Guitar,
  Piano,
  FileText,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { useAudioLDM2 } from "@/hooks/use-audioldm2"
import { useMidiUpload } from "@/hooks/use-midi-upload"

interface MidiFile {
  id: string
  name: string
  size: number
  content: string
  uploadedAt: string
  metadata?: {
    tracks: number
    duration: number
    tempo: number
    key?: string
    timeSignature?: string
  }
}

interface GeneratedAudio {
  id: string
  midiFileId: string
  audioUrl: string
  prompt: string
  style: string
  duration: number
  generatedAt: string
  downloadUrl?: string
}

export function MidiToAudioGenerator() {
  const { generating, generateFromMidi, generateAudio, downloadAudio, isAvailable } = useAudioLDM2()

  const { uploading, uploadMidi, analyzeMidi } = useMidiUpload()

  const [activeTab, setActiveTab] = useState("upload")
  const [midiFiles, setMidiFiles] = useState<MidiFile[]>([])
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([])
  const [selectedMidiFile, setSelectedMidiFile] = useState<string>("")
  const [selectedStyle, setSelectedStyle] = useState("electronic")
  const [customPrompt, setCustomPrompt] = useState("")
  const [duration, setDuration] = useState([15])
  const [guidanceScale, setGuidanceScale] = useState([3.5])
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.name.toLowerCase().endsWith(".mid") && !file.name.toLowerCase().endsWith(".midi")) {
          toast.error(`${file.name} is not a MIDI file`)
          continue
        }

        try {
          const content = await file.arrayBuffer()
          const base64Content = btoa(String.fromCharCode(...new Uint8Array(content)))

          // Upload and analyze MIDI
          const uploadResult = await uploadMidi(file)
          if (uploadResult) {
            const analysisResult = await analyzeMidi(base64Content)

            const midiFile: MidiFile = {
              id: `midi_${Date.now()}_${i}`,
              name: file.name,
              size: file.size,
              content: base64Content,
              uploadedAt: new Date().toISOString(),
              metadata: analysisResult?.metadata,
            }

            setMidiFiles((prev) => [...prev, midiFile])
            toast.success(`${file.name} uploaded successfully`)
          }
        } catch (error) {
          console.error("Upload error:", error)
          toast.error(`Failed to upload ${file.name}`)
        }
      }
    },
    [uploadMidi, analyzeMidi],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFileUpload(files)
      }
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files) {
        handleFileUpload(files)
      }
    },
    [handleFileUpload],
  )

  const generateAudioFromMidi = useCallback(async () => {
    const selectedFile = midiFiles.find((f) => f.id === selectedMidiFile)
    if (!selectedFile) {
      toast.error("Please select a MIDI file")
      return
    }

    const prompt = customPrompt || `${selectedStyle} music composition, high quality, professional recording`

    try {
      const result = await generateFromMidi(selectedFile.content, selectedStyle)

      if (result && result.success) {
        const generatedAudio: GeneratedAudio = {
          id: `audio_${Date.now()}`,
          midiFileId: selectedFile.id,
          audioUrl: result.audio_url!,
          prompt,
          style: selectedStyle,
          duration: result.duration,
          generatedAt: new Date().toISOString(),
          downloadUrl: result.audio_url,
        }

        setGeneratedAudios((prev) => [generatedAudio, ...prev])
        setActiveTab("results")
        toast.success("Audio generated successfully!")
      }
    } catch (error) {
      console.error("Generation error:", error)
      toast.error("Failed to generate audio")
    }
  }, [selectedMidiFile, midiFiles, selectedStyle, customPrompt, generateFromMidi])

  const toggleAudio = useCallback(
    (audioUrl: string) => {
      if (playingAudio === audioUrl) {
        setPlayingAudio(null)
      } else {
        setPlayingAudio(audioUrl)
      }
    },
    [playingAudio],
  )

  const deleteMidiFile = useCallback(
    (id: string) => {
      setMidiFiles((prev) => prev.filter((f) => f.id !== id))
      if (selectedMidiFile === id) {
        setSelectedMidiFile("")
      }
      toast.success("MIDI file deleted")
    },
    [selectedMidiFile],
  )

  const deleteGeneratedAudio = useCallback((id: string) => {
    setGeneratedAudios((prev) => prev.filter((a) => a.id !== id))
    toast.success("Generated audio deleted")
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
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
          <h1 className="text-3xl font-bold">MIDI to Audio Generator</h1>
          <p className="text-muted-foreground">Convert MIDI files to high-quality audio using AI</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <FileAudio className="h-3 w-3 mr-1" />
            {midiFiles.length} MIDI files
          </Badge>
          <Badge variant="secondary">{generatedAudios.length} generated</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload MIDI</TabsTrigger>
          <TabsTrigger value="generate">Generate Audio</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="library">MIDI Library</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload MIDI Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Drop MIDI files here</h3>
                    <p className="text-muted-foreground">or click to browse</p>
                  </div>
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Choose Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".mid,.midi"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {midiFiles.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Uploaded Files ({midiFiles.length})</h4>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {midiFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <div>
                              <div className="font-medium">{file.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatFileSize(file.size)}
                                {file.metadata && (
                                  <>
                                    {" • "}
                                    {file.metadata.tracks} tracks
                                    {file.metadata.duration && ` • ${formatDuration(file.metadata.duration)}`}
                                    {file.metadata.tempo && ` • ${file.metadata.tempo} BPM`}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => deleteMidiFile(file.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Generation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select MIDI File</Label>
                  <Select value={selectedMidiFile} onValueChange={setSelectedMidiFile}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a MIDI file..." />
                    </SelectTrigger>
                    <SelectContent>
                      {midiFiles.map((file) => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Musical Style</Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronic">Electronic</SelectItem>
                      <SelectItem value="orchestral">Orchestral</SelectItem>
                      <SelectItem value="jazz">Jazz</SelectItem>
                      <SelectItem value="rock">Rock</SelectItem>
                      <SelectItem value="classical">Classical</SelectItem>
                      <SelectItem value="ambient">Ambient</SelectItem>
                      <SelectItem value="folk">Folk</SelectItem>
                      <SelectItem value="blues">Blues</SelectItem>
                      <SelectItem value="funk">Funk</SelectItem>
                      <SelectItem value="reggae">Reggae</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Custom Prompt (optional)</Label>
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Add specific instructions for the audio generation..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration: {duration[0]}s</Label>
                    <Slider value={duration} onValueChange={setDuration} max={30} min={5} step={5} />
                  </div>
                  <div className="space-y-2">
                    <Label>Guidance: {guidanceScale[0]}</Label>
                    <Slider value={guidanceScale} onValueChange={setGuidanceScale} max={10} min={1} step={0.5} />
                  </div>
                </div>

                <Button onClick={generateAudioFromMidi} disabled={generating || !selectedMidiFile} className="w-full">
                  {generating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Waveform className="h-4 w-4 mr-2" />
                  )}
                  Generate Audio
                </Button>
              </CardContent>
            </Card>

            {/* Style Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Style Presets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant={selectedStyle === "electronic" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedStyle("electronic")}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Electronic - Synthesizers, digital sounds
                </Button>
                <Button
                  variant={selectedStyle === "orchestral" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedStyle("orchestral")}
                >
                  <Music className="h-4 w-4 mr-2" />
                  Orchestral - Full symphony orchestra
                </Button>
                <Button
                  variant={selectedStyle === "jazz" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedStyle("jazz")}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Jazz - Swing, improvisation, brass
                </Button>
                <Button
                  variant={selectedStyle === "rock" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedStyle("rock")}
                >
                  <Guitar className="h-4 w-4 mr-2" />
                  Rock - Electric guitars, drums, energy
                </Button>
                <Button
                  variant={selectedStyle === "classical" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedStyle("classical")}
                >
                  <Piano className="h-4 w-4 mr-2" />
                  Classical - Traditional instruments
                </Button>
                <Button
                  variant={selectedStyle === "ambient" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedStyle("ambient")}
                >
                  <Headphones className="h-4 w-4 mr-2" />
                  Ambient - Atmospheric, ethereal
                </Button>

                {selectedMidiFile && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">Selected File:</div>
                    <div className="text-sm text-muted-foreground">
                      {midiFiles.find((f) => f.id === selectedMidiFile)?.name}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileAudio className="h-5 w-5" />
                Generated Audio ({generatedAudios.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {generatedAudios.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No audio generated yet. Upload MIDI files and generate audio to see results here.
                    </div>
                  ) : (
                    generatedAudios.map((audio) => {
                      const midiFile = midiFiles.find((f) => f.id === audio.midiFileId)
                      return (
                        <div key={audio.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">
                                {midiFile?.name || "Unknown MIDI"} → {audio.style}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDuration(audio.duration)} • {new Date(audio.generatedAt).toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{audio.prompt}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggleAudio(audio.audioUrl)}>
                              {playingAudio === audio.audioUrl ? (
                                <Pause className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                downloadAudio({
                                  success: true,
                                  audio_url: audio.audioUrl,
                                  generation_id: audio.id,
                                  duration: audio.duration,
                                  sample_rate: 44100,
                                  metadata: {
                                    prompt: audio.prompt,
                                    model: "audioldm2",
                                    timestamp: audio.generatedAt,
                                    parameters: { style: audio.style },
                                  },
                                })
                              }
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteGeneratedAudio(audio.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                MIDI Library ({midiFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {midiFiles.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No MIDI files uploaded yet. Go to the Upload tab to add files.
                    </div>
                  ) : (
                    midiFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">{file.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                            </div>
                            {file.metadata && (
                              <div className="text-xs text-muted-foreground">
                                {file.metadata.tracks} tracks
                                {file.metadata.duration && ` • ${formatDuration(file.metadata.duration)}`}
                                {file.metadata.tempo && ` • ${file.metadata.tempo} BPM`}
                                {file.metadata.key && ` • ${file.metadata.key}`}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMidiFile(file.id)
                              setActiveTab("generate")
                            }}
                          >
                            <Waveform className="h-3 w-3 mr-1" />
                            Generate
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteMidiFile(file.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
