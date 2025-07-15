"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Music, Play, Pause, Download, Eye, Clock, Hash, Volume2, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Melody {
  id: string
  title: string
  artist: string
  genre: string
  key: string
  tempo: number
  duration: number
  mood: string
  tags: string[]
  melody: Array<{
    note: string
    duration: number
    time: number
    velocity: number
  }>
  chords: Array<{
    name: string
    notes: string[]
    duration: number
    time: number
  }>
  metadata: {
    created: string
    bpm: number
    scale: string
    energy?: string
    danceability?: number
  }
}

export function MelodyBrowser() {
  const [melodies, setMelodies] = useState<Melody[]>([])
  const [selectedMelody, setSelectedMelody] = useState<Melody | null>(null)
  const [loading, setLoading] = useState(false)
  const [playingMelody, setPlayingMelody] = useState<string | null>(null)
  const [playProgress, setPlayProgress] = useState(0)

  useEffect(() => {
    loadMelodies()
  }, [])

  const loadMelodies = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/melodies")
      const data = await response.json()

      if (data.success) {
        setMelodies(data.melodies)
        toast.success(data.message)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error loading melodies:", error)
      toast.error("Failed to load melodies")
    } finally {
      setLoading(false)
    }
  }

  const playMelody = (melodyId: string) => {
    if (playingMelody === melodyId) {
      // Stop playing
      setPlayingMelody(null)
      setPlayProgress(0)
      toast.info("Playback stopped")
    } else {
      // Start playing
      setPlayingMelody(melodyId)
      setPlayProgress(0)
      toast.info("Playing melody...")

      // Simulate playback progress
      const melody = melodies.find((m) => m.id === melodyId)
      if (melody) {
        const duration = melody.duration * 1000 // Convert to milliseconds
        const interval = setInterval(() => {
          setPlayProgress((prev) => {
            const newProgress = prev + 100 / (duration / 100)
            if (newProgress >= 100) {
              clearInterval(interval)
              setPlayingMelody(null)
              setPlayProgress(0)
              toast.success("Playback completed")
              return 100
            }
            return newProgress
          })
        }, 100)
      }
    }
  }

  const downloadMelody = (melody: Melody) => {
    const blob = new Blob([JSON.stringify(melody, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${melody.id}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success(`Downloaded ${melody.title}`)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getMoodColor = (mood: string) => {
    switch (mood.toLowerCase()) {
      case "peaceful":
        return "bg-blue-100 text-blue-800"
      case "energetic":
        return "bg-red-100 text-red-800"
      case "happy":
        return "bg-yellow-100 text-yellow-800"
      case "sad":
        return "bg-gray-100 text-gray-800"
      case "mysterious":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Music className="h-6 w-6" />
              Melody Collection ({melodies.length})
            </CardTitle>
            <Button variant="outline" onClick={loadMelodies} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Melody List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Melodies</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading melodies...</span>
              </div>
            ) : melodies.length > 0 ? (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {melodies.map((melody) => (
                    <div
                      key={melody.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedMelody?.id === melody.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedMelody(melody)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{melody.title}</h3>
                            <p className="text-sm text-muted-foreground">{melody.artist}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                playMelody(melody.id)
                              }}
                            >
                              {playingMelody === melody.id ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                downloadMelody(melody)
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{melody.genre}</Badge>
                          <Badge variant="outline">{melody.key}</Badge>
                          <Badge className={getMoodColor(melody.mood)}>{melody.mood}</Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(melody.duration)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {melody.tempo} BPM
                          </span>
                          <span className="flex items-center gap-1">
                            <Volume2 className="h-3 w-3" />
                            {melody.melody.length} notes
                          </span>
                        </div>

                        {playingMelody === melody.id && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Playing...</span>
                              <span>{Math.round(playProgress)}%</span>
                            </div>
                            <Progress value={playProgress} className="h-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <Alert>
                <Music className="h-4 w-4" />
                <AlertDescription>
                  No melodies found. The melody1.json and melody2.json files should be available.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Melody Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Melody Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMelody ? (
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedMelody.title}</h3>
                    <p className="text-muted-foreground">{selectedMelody.artist}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Genre:</span> {selectedMelody.genre}
                    </div>
                    <div>
                      <span className="font-medium">Key:</span> {selectedMelody.key}
                    </div>
                    <div>
                      <span className="font-medium">Tempo:</span> {selectedMelody.tempo} BPM
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {formatDuration(selectedMelody.duration)}
                    </div>
                    <div>
                      <span className="font-medium">Scale:</span> {selectedMelody.metadata.scale}
                    </div>
                    <div>
                      <span className="font-medium">Notes:</span> {selectedMelody.melody.length}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedMelody.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Chord Progression</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMelody.chords.slice(0, 8).map((chord, index) => (
                        <Badge key={index} variant="outline">
                          {chord.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Melody Preview</h4>
                    <div className="text-xs font-mono bg-muted p-3 rounded">
                      {selectedMelody.melody.slice(0, 10).map((note, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{note.note}</span>
                          <span>{note.duration}s</span>
                          <span>v{note.velocity}</span>
                        </div>
                      ))}
                      {selectedMelody.melody.length > 10 && (
                        <div className="text-muted-foreground mt-2">
                          ... and {selectedMelody.melody.length - 10} more notes
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedMelody.metadata.energy && (
                    <div>
                      <h4 className="font-medium mb-2">Energy Level</h4>
                      <Badge
                        className={
                          selectedMelody.metadata.energy === "High"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }
                      >
                        {selectedMelody.metadata.energy}
                      </Badge>
                    </div>
                  )}

                  {selectedMelody.metadata.danceability && (
                    <div>
                      <h4 className="font-medium mb-2">Danceability</h4>
                      <div className="flex items-center gap-2">
                        <Progress value={selectedMelody.metadata.danceability * 100} className="flex-1" />
                        <span className="text-sm">{Math.round(selectedMelody.metadata.danceability * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>Select a melody from the list to view its details and structure.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
