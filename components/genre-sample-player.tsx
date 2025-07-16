"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Volume2, Music2, Headphones } from "lucide-react"
import { AudioSynthesisService } from "@/lib/services/audio-synthesis-service"
import { useToast } from "@/hooks/use-toast"

interface GenreSamplePlayerProps {
  onSelectGenre: (genre: string) => void
  selectedGenre?: string
}

export default function GenreSamplePlayer({ onSelectGenre, selectedGenre }: GenreSamplePlayerProps) {
  const [playingGenre, setPlayingGenre] = useState<string | null>(null)
  const [audioUrls, setAudioUrls] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  const genres = [
    {
      name: "Pop",
      description: "Catchy melodies with modern production",
      tempo: "120 BPM",
      characteristics: ["Catchy hooks", "Clean production", "Accessible"],
      color: "from-pink-500 to-purple-500",
    },
    {
      name: "Rock",
      description: "Powerful guitars with driving rhythm",
      tempo: "140 BPM",
      characteristics: ["Electric guitars", "Strong drums", "Energetic"],
      color: "from-red-500 to-orange-500",
    },
    {
      name: "Jazz",
      description: "Sophisticated harmonies and improvisation",
      tempo: "100 BPM",
      characteristics: ["Complex chords", "Swing rhythm", "Sophisticated"],
      color: "from-blue-500 to-indigo-500",
    },
    {
      name: "Electronic",
      description: "Synthesized sounds and digital effects",
      tempo: "128 BPM",
      characteristics: ["Synthesizers", "Digital effects", "Programmed"],
      color: "from-cyan-500 to-teal-500",
    },
    {
      name: "Country",
      description: "Storytelling with acoustic instruments",
      tempo: "110 BPM",
      characteristics: ["Acoustic guitar", "Storytelling", "Traditional"],
      color: "from-yellow-500 to-amber-500",
    },
    {
      name: "Classical",
      description: "Orchestral arrangements and formal structure",
      tempo: "90 BPM",
      characteristics: ["Orchestra", "Formal structure", "Timeless"],
      color: "from-purple-500 to-violet-500",
    },
  ]

  // Generate demo tracks for each genre
  useEffect(() => {
    const generateGenreDemos = async () => {
      setIsLoading(true)
      const newUrls: { [key: string]: string } = {}

      try {
        for (const genre of genres) {
          console.log(`Generating demo for ${genre.name}`)
          const audioUrl = await AudioSynthesisService.generateDemoTrack(genre.name, `${genre.name} Demo`)
          newUrls[genre.name] = audioUrl
        }

        setAudioUrls(newUrls)
        toast({
          title: "🎵 Genre Demos Ready",
          description: "All genre samples have been generated",
        })
      } catch (error) {
        console.error("Failed to generate genre demos:", error)
        toast({
          title: "Generation Failed",
          description: "Could not generate genre samples",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    generateGenreDemos()
  }, [])

  const handlePlayGenre = async (genre: string) => {
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setCurrentAudio(null)
    }

    if (playingGenre === genre) {
      // Stop playing
      setPlayingGenre(null)
    } else {
      // Start playing
      if (audioUrls[genre]) {
        try {
          const audio = new Audio(audioUrls[genre])
          audio.volume = 0.7

          audio.onended = () => {
            setPlayingGenre(null)
            setCurrentAudio(null)
          }

          audio.onerror = () => {
            toast({
              title: "Playback Error",
              description: `Failed to play ${genre} sample`,
              variant: "destructive",
            })
            setPlayingGenre(null)
            setCurrentAudio(null)
          }

          await audio.play()
          setPlayingGenre(genre)
          setCurrentAudio(audio)
        } catch (error) {
          console.error("Playback error:", error)
          toast({
            title: "Playback Error",
            description: `Failed to play ${genre} sample`,
            variant: "destructive",
          })
        }
      }
    }
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
      }
    }
  }, [currentAudio])

  if (isLoading) {
    return (
      <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-green-300 flex items-center">
            <Music2 className="w-5 h-5 mr-2" />
            Genre Samples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-green-400/60">Generating genre samples...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-green-300 flex items-center">
          <Music2 className="w-5 h-5 mr-2" />
          Genre Samples
          <Badge variant="outline" className="ml-2 text-green-400 border-green-500/30">
            Star Spangled Banner
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-center">
          <p className="text-sm text-green-400/60 mb-2">
            🎼 Hear how Star Spangled Banner sounds in different musical styles
          </p>
          <p className="text-xs text-green-400/40">Click play to preview, then select your preferred genre</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {genres.map((genre) => (
            <div
              key={genre.name}
              className={`bg-black/60 border rounded-lg p-4 cursor-pointer transition-all hover:bg-green-500/5 ${
                selectedGenre === genre.name ? "border-green-400 bg-green-500/10" : "border-green-500/20"
              }`}
              onClick={() => onSelectGenre(genre.name)}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-green-100">{genre.name}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlayGenre(genre.name)
                  }}
                  disabled={!audioUrls[genre.name]}
                  className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                >
                  {playingGenre === genre.name ? (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      <Volume2 className="w-3 h-3" />
                    </>
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <p className="text-xs text-green-400/70 mb-3">{genre.description}</p>

              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                  {genre.tempo}
                </Badge>
                <div className="flex items-center text-xs text-green-400/60">
                  <Headphones className="w-3 h-3 mr-1" />
                  <span>30s demo</span>
                </div>
              </div>

              <div className="space-y-1">
                {genre.characteristics.map((char, index) => (
                  <div key={index} className="text-xs text-green-400/60 flex items-center">
                    <div className="w-1 h-1 bg-green-400 rounded-full mr-2"></div>
                    {char}
                  </div>
                ))}
              </div>

              {selectedGenre === genre.name && (
                <div className="mt-3 pt-3 border-t border-green-500/20">
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Selected</Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
