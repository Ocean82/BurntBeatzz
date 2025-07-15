"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Edit3, Save, Undo, RotateCcw, Play, Music, Volume2, Clock, Type, Crown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Song {
  id: number
  title: string
  lyrics: string
  genre: string
  vocalStyle: string
  songLength: string
  sections?: SongSection[]
}

interface SongSection {
  id: number
  type: string
  startTime: number
  endTime: number
  lyrics: string
}

interface SongEditorProps {
  song: Song
  userPlan: string
  onSongUpdated: (song: Song) => void
  onUpgrade: () => void
}

function SongEditor({ song, userPlan, onSongUpdated, onUpgrade }: SongEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedSong, setEditedSong] = useState(song)
  const [sections, setSections] = useState<SongSection[]>(
    (song.sections as SongSection[]) || [
      { id: 1, type: "Verse 1", startTime: 0, endTime: 30, lyrics: song.lyrics.split("\n")[0] || "" },
      { id: 2, type: "Chorus", startTime: 30, endTime: 60, lyrics: song.lyrics.split("\n")[1] || "" },
    ],
  )
  const { toast } = useToast()

  const updateSongMutation = useMutation({
    mutationFn: async (updates: Partial<Song>) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return { ...song, ...updates }
    },
    onSuccess: (updatedSong: Song) => {
      onSongUpdated(updatedSong)
      setIsEditing(false)
      toast({
        title: "Song updated",
        description: "Your changes have been saved successfully.",
      })
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      })
    },
  })

  const regenerateSectionMutation = useMutation({
    mutationFn: async (sectionId: number) => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return { success: true }
    },
    onSuccess: () => {
      toast({
        title: "Section regenerated",
        description: "The section has been updated with a new variation.",
      })
    },
  })

  const sectionTypes = [
    "Verse 1",
    "Verse 2",
    "Verse 3",
    "Chorus",
    "Pre-Chorus",
    "Post-Chorus",
    "Bridge",
    "Outro",
    "Intro",
    "Instrumental",
  ]

  const handleSaveChanges = () => {
    const combinedLyrics = sections.map((section) => section.lyrics).join("\n\n")
    updateSongMutation.mutate({
      ...editedSong,
      lyrics: combinedLyrics,
      sections: sections,
    })
  }

  const handleSectionChange = (sectionId: number, field: keyof SongSection, value: any) => {
    setSections((prev) => prev.map((section) => (section.id === sectionId ? { ...section, [field]: value } : section)))
  }

  const addSection = () => {
    const newId = Math.max(...sections.map((s) => s.id)) + 1
    const lastSection = sections[sections.length - 1]
    setSections((prev) => [
      ...prev,
      {
        id: newId,
        type: "Verse",
        startTime: lastSection?.endTime || 0,
        endTime: (lastSection?.endTime || 0) + 30,
        lyrics: "",
      },
    ])
  }

  const removeSection = (sectionId: number) => {
    setSections((prev) => prev.filter((section) => section.id !== sectionId))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (userPlan === "free") {
    return (
      <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10 mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-green-300">Song Editing (Premium Feature)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Edit3 className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-300 mb-2">Advanced Editing Tools</h3>
            <p className="text-sm text-green-400/60 mb-6 max-w-md mx-auto">
              Edit lyrics, modify song sections, regenerate parts, and fine-tune your songs with advanced editing tools.
              Get 4 full-length songs per month with Basic plan.
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
    <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10 mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-green-300">🎵 Song Editor</CardTitle>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="text-green-300 border-green-500/30 bg-black/40 hover:bg-green-500/10 hover:border-green-400"
                >
                  <Undo className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={updateSongMutation.isPending}
                  className="bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {updateSongMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-green-300 border-green-500/30 bg-black/40 hover:bg-green-500/10 hover:border-green-400"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit Song
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            {/* Song Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-green-300 mb-2 block">Song Title</label>
                <Input
                  value={editedSong.title}
                  onChange={(e) => setEditedSong((prev) => ({ ...prev, title: e.target.value }))}
                  className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-green-300 mb-2 block">Genre</label>
                <Select
                  value={editedSong.genre}
                  onValueChange={(value) => setEditedSong((prev) => ({ ...prev, genre: value }))}
                >
                  <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100 focus:border-green-400 focus:ring-green-400/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-green-500/30">
                    {["pop", "rock", "jazz", "electronic", "classical", "hip-hop", "country", "r&b"].map((genre) => (
                      <SelectItem key={genre} value={genre} className="text-green-100 focus:bg-green-500/20">
                        {genre.charAt(0).toUpperCase() + genre.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="bg-green-500/20" />

            {/* Song Sections */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-green-300">Song Sections</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSection}
                  className="text-green-300 border-green-500/30 bg-black/40 hover:bg-green-500/10 hover:border-green-400"
                >
                  Add Section
                </Button>
              </div>

              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div key={section.id} className="bg-black/60 border border-green-500/20 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <Select
                        value={section.type}
                        onValueChange={(value) => handleSectionChange(section.id, "type", value)}
                      >
                        <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100 focus:border-green-400 focus:ring-green-400/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-green-500/30">
                          {sectionTypes.map((type) => (
                            <SelectItem key={type} value={type} className="text-green-100 focus:bg-green-500/20">
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-green-400" />
                        <Input
                          type="number"
                          value={section.startTime}
                          onChange={(e) =>
                            handleSectionChange(section.id, "startTime", Number.parseInt(e.target.value))
                          }
                          className="bg-black/60 border-green-500/30 text-green-100 text-xs focus:border-green-400 focus:ring-green-400/20"
                          placeholder="Start"
                        />
                        <span className="text-green-400">-</span>
                        <Input
                          type="number"
                          value={section.endTime}
                          onChange={(e) => handleSectionChange(section.id, "endTime", Number.parseInt(e.target.value))}
                          className="bg-black/60 border-green-500/30 text-green-100 text-xs focus:border-green-400 focus:ring-green-400/20"
                          placeholder="End"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => regenerateSectionMutation.mutate(section.id)}
                          disabled={regenerateSectionMutation.isPending}
                          className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        {sections.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(section.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>

                    <Textarea
                      value={section.lyrics}
                      onChange={(e) => handleSectionChange(section.id, "lyrics", e.target.value)}
                      className="w-full bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 resize-none focus:border-green-400 focus:ring-green-400/20"
                      placeholder={`Enter lyrics for ${section.type}...`}
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Song Overview */}
            <div className="bg-black/60 border border-green-500/20 rounded-lg p-4">
              <h3 className="font-medium text-green-100 mb-2">{song.title}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-green-400/80">
                <div className="flex items-center">
                  <Music className="w-4 h-4 mr-2" />
                  {song.genre}
                </div>
                <div className="flex items-center">
                  <Volume2 className="w-4 h-4 mr-2" />
                  {song.vocalStyle}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {song.songLength}
                </div>
                <div className="flex items-center">
                  <Type className="w-4 h-4 mr-2" />
                  {sections.length} sections
                </div>
              </div>
            </div>

            {/* Section Preview */}
            <div className="space-y-3">
              {sections.map((section) => (
                <div key={section.id} className="bg-black/60 border border-green-500/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-300">{section.type}</span>
                    <span className="text-xs text-green-400/60">
                      {formatTime(section.startTime)} - {formatTime(section.endTime)}
                    </span>
                  </div>
                  <p className="text-sm text-green-100/80 line-clamp-2">{section.lyrics}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { SongEditor }
