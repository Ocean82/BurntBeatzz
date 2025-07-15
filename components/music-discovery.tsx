"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, ThumbsUp, ThumbsDown, Search, Filter, Crown, Eye, Download } from "lucide-react"

interface Track {
  id: string
  title: string
  artist: string
  genre: string
  style: string
  duration: string
  likes: number
  dislikes: number
  plays: number
  uploadDate: string
  description: string
  tags: string[]
  fileSize: string
  isPlaying?: boolean
  userLiked?: boolean
  userDisliked?: boolean
}

function MusicDiscovery() {
  const [selectedGenre, setSelectedGenre] = useState("all")
  const [selectedStyle, setSelectedStyle] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)

  // Mock data for tracks
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: "1",
      title: "Neon Nights",
      artist: "CyberBeats",
      genre: "Electronic",
      style: "Synthwave",
      duration: "3:45",
      likes: 1247,
      dislikes: 23,
      plays: 15420,
      uploadDate: "2024-01-15",
      description: "A cyberpunk journey through neon-lit streets",
      tags: ["cyberpunk", "synthwave", "retro"],
      fileSize: "5.2 MB",
    },
    {
      id: "2",
      title: "Fire Storm",
      artist: "BurntProducer",
      genre: "Hip Hop",
      style: "Trap",
      duration: "2:58",
      likes: 2156,
      dislikes: 45,
      plays: 28930,
      uploadDate: "2024-01-20",
      description: "Heavy trap beats that'll melt your speakers",
      tags: ["trap", "heavy", "bass"],
      fileSize: "4.1 MB",
    },
    {
      id: "3",
      title: "Digital Dreams",
      artist: "NeonWolf",
      genre: "Electronic",
      style: "Ambient",
      duration: "4:12",
      likes: 892,
      dislikes: 12,
      plays: 12450,
      uploadDate: "2024-01-18",
      description: "Ethereal soundscapes for the digital age",
      tags: ["ambient", "chill", "atmospheric"],
      fileSize: "6.8 MB",
    },
    {
      id: "4",
      title: "Rage Mode",
      artist: "FireDemon",
      genre: "Metal",
      style: "Industrial",
      duration: "3:33",
      likes: 1834,
      dislikes: 67,
      plays: 22100,
      uploadDate: "2024-01-22",
      description: "Industrial metal that hits like a freight train",
      tags: ["industrial", "heavy", "aggressive"],
      fileSize: "4.9 MB",
    },
    {
      id: "5",
      title: "Midnight Vibes",
      artist: "ChillMaster",
      genre: "R&B",
      style: "Lo-Fi",
      duration: "3:21",
      likes: 1456,
      dislikes: 18,
      plays: 18750,
      uploadDate: "2024-01-19",
      description: "Smooth late-night vibes for your soul",
      tags: ["lofi", "chill", "smooth"],
      fileSize: "3.7 MB",
    },
  ])

  const genres = ["all", "Electronic", "Hip Hop", "Metal", "R&B", "Pop", "Rock", "Jazz", "Classical"]
  const styles = ["all", "Synthwave", "Trap", "Ambient", "Industrial", "Lo-Fi", "House", "Dubstep", "Techno"]

  // Filter tracks based on search and filters
  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesGenre = selectedGenre === "all" || track.genre === selectedGenre
    const matchesStyle = selectedStyle === "all" || track.style === selectedStyle

    return matchesSearch && matchesGenre && matchesStyle
  })

  // Get top 10 tracks by likes
  const topTracks = [...tracks].sort((a, b) => b.likes - a.likes).slice(0, 10)

  const handleLike = (trackId: string) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id === trackId) {
          if (track.userLiked) {
            return { ...track, likes: track.likes - 1, userLiked: false }
          } else {
            return {
              ...track,
              likes: track.likes + 1,
              userLiked: true,
              userDisliked: false,
              dislikes: track.userDisliked ? track.dislikes - 1 : track.dislikes,
            }
          }
        }
        return track
      }),
    )
  }

  const handleDislike = (trackId: string) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id === trackId) {
          if (track.userDisliked) {
            return { ...track, dislikes: track.dislikes - 1, userDisliked: false }
          } else {
            return {
              ...track,
              dislikes: track.dislikes + 1,
              userDisliked: true,
              userLiked: false,
              likes: track.userLiked ? track.likes - 1 : track.likes,
            }
          }
        }
        return track
      }),
    )
  }

  const handlePlay = (trackId: string) => {
    setCurrentlyPlaying(currentlyPlaying === trackId ? null : trackId)
  }

  const TrackCard = ({ track, rank }: { track: Track; rank?: number }) => (
    <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10 hover:border-green-400/50 transition-all">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {rank && (
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-orange-500 to-green-500 rounded-full text-white font-bold text-sm">
              {rank}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-green-100 font-semibold text-lg">{track.title}</h3>
                <p className="text-green-400/80 text-sm">by {track.artist}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handlePlay(track.id)}
                  className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                >
                  {currentlyPlaying === track.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button size="sm" variant="ghost" className="text-green-300 hover:text-green-100 hover:bg-green-500/10">
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-yellow-300 hover:text-yellow-100 hover:bg-yellow-500/10 font-bold"
                >
                  🏆 ENTER!
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <span className="text-green-400/60 text-xs bg-black/60 px-2 py-1 rounded">{track.genre}</span>
              <span className="text-green-400/60 text-xs bg-black/60 px-2 py-1 rounded">{track.style}</span>
              <span className="text-green-400/60 text-xs">{track.duration}</span>
              <span className="text-green-400/60 text-xs">{track.fileSize}</span>
            </div>

            <p className="text-green-300/70 text-sm mb-3">{track.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleLike(track.id)}
                  className={`flex items-center gap-1 ${
                    track.userLiked ? "text-green-400" : "text-green-300/60"
                  } hover:text-green-100`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-xs">{track.likes}</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDislike(track.id)}
                  className={`flex items-center gap-1 ${
                    track.userDisliked ? "text-red-400" : "text-green-300/60"
                  } hover:text-red-300`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span className="text-xs">{track.dislikes}</span>
                </Button>
                <div className="flex items-center gap-1 text-green-300/60">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">{track.plays.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-1">
                {track.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent mb-2">
              🏆 BURNT BEATS BATTLE ARENA 🏆
            </h1>
            <p className="text-green-300/80">Compete for the crown! Discover fire tracks and climb the leaderboard!</p>
          </div>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="relative overflow-hidden bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white font-bold shadow-2xl shadow-orange-500/50 animate-pulse border-2 border-yellow-400/50 px-6 py-3"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            <Crown className="w-5 h-5 mr-2 animate-bounce" />🚀 ENTER CONTEST & WIN! 🚀
          </Button>
        </div>

        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/60 border border-green-500/20 mb-8">
            <TabsTrigger
              value="discover"
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              🔥 TRENDING NOW 🔥
            </TabsTrigger>
            <TabsTrigger
              value="top10"
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              👑 LEADERBOARD 👑
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Search and Filters */}
            <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
              <CardHeader>
                <CardTitle className="text-green-300 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search & Filter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-green-300 mb-2 block">Search</Label>
                    <Input
                      placeholder="Search tracks, artists, tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
                    />
                  </div>
                  <div>
                    <Label className="text-green-300 mb-2 block">Genre</Label>
                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                      <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100 focus:border-green-400 focus:ring-green-400/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-green-500/30">
                        {genres.map((genre) => (
                          <SelectItem
                            key={genre}
                            value={genre}
                            className="text-green-100 focus:bg-green-500/20 capitalize"
                          >
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-green-300 mb-2 block">Style</Label>
                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                      <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100 focus:border-green-400 focus:ring-green-400/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-green-500/30">
                        {styles.map((style) => (
                          <SelectItem
                            key={style}
                            value={style}
                            className="text-green-100 focus:bg-green-500/20 capitalize"
                          >
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full text-green-300 border-green-500/30 bg-black/40 hover:bg-green-500/10 hover:border-green-400"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Track Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                  🔥 {filteredTracks.length} FIRE TRACKS COMPETING! 🔥
                </h2>
                <Select defaultValue="likes">
                  <SelectTrigger className="w-64 bg-black/60 border-green-500/30 text-green-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-green-500/30">
                    <SelectItem value="likes" className="text-green-100 focus:bg-green-500/20">
                      🔥 Sort by Likes (Hot!)
                    </SelectItem>
                    <SelectItem value="plays" className="text-green-100 focus:bg-green-500/20">
                      👂 Sort by Listens
                    </SelectItem>
                    <SelectItem value="recent" className="text-green-100 focus:bg-green-500/20">
                      ⏰ Most Recent
                    </SelectItem>
                    <SelectItem value="song-alpha" className="text-green-100 focus:bg-green-500/20">
                      🎵 Song Title A-Z
                    </SelectItem>
                    <SelectItem value="artist-alpha" className="text-green-100 focus:bg-green-500/20">
                      👤 Artist Name A-Z
                    </SelectItem>
                    <SelectItem value="trending" className="text-green-100 focus:bg-green-500/20">
                      📈 Trending Score
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredTracks.map((track) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="top10" className="space-y-8">
            {/* Top Likes Leaderboard */}
            <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
              <CardHeader>
                <CardTitle className="text-green-300 flex items-center gap-2 text-2xl">
                  <Crown className="w-6 h-6 text-yellow-400" />🔥 LEADERBOARD - MOST LIKED 🔥
                  <Crown className="w-6 h-6 text-yellow-400" />
                </CardTitle>
                <p className="text-green-400/80">The community's absolute favorites!</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {topTracks.map((track, index) => (
                  <TrackCard key={track.id} track={track} rank={index + 1} />
                ))}
              </CardContent>
            </Card>

            {/* Top Plays Leaderboard */}
            <Card className="bg-black/80 backdrop-blur-sm border border-purple-500/30 shadow-xl shadow-purple-500/10">
              <CardHeader>
                <CardTitle className="text-purple-300 flex items-center gap-2 text-2xl">
                  <Eye className="w-6 h-6 text-purple-400" />🎧 TRENDING NOW - MOST PLAYED 🎧
                  <Eye className="w-6 h-6 text-purple-400" />
                </CardTitle>
                <p className="text-purple-400/80">What everyone's listening to right now!</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...tracks]
                  .sort((a, b) => b.plays - a.plays)
                  .slice(0, 10)
                  .map((track, index) => (
                    <TrackCard key={track.id} track={track} rank={index + 1} />
                  ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export { MusicDiscovery }
