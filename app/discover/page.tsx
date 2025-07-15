"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, Heart, Share2, TrendingUp, Trophy, Search, Filter, Volume2, Download, Crown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Track {
  id: number
  title: string
  artist: string
  genre: string
  duration: string
  plays: number
  likes: number
  audioUrl: string
  isLiked: boolean
  rank?: number
  trend?: "up" | "down" | "same"
  contestEntry?: boolean
}

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all")
  const [isPlaying, setIsPlaying] = useState<number | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [likedTracks, setLikedTracks] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  // Mock trending tracks data
  const [trendingTracks] = useState<Track[]>([
    {
      id: 1,
      title: "Fire Dreams",
      artist: "BeatMaster_2024",
      genre: "Hip Hop",
      duration: "3:24",
      plays: 15420,
      likes: 892,
      audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio%20sample%20BB1-H1FFSxbomW3iCfaAgmk0Hg37VA8KUb.mp3",
      isLiked: false,
      rank: 1,
      trend: "up",
      contestEntry: true,
    },
    {
      id: 2,
      title: "Neon Nights",
      artist: "SynthWave_Pro",
      genre: "Electronic",
      duration: "4:12",
      plays: 12890,
      likes: 756,
      audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Audion%20Sample%20BB2-sKRqesjrFVwnjY2IpduXNVzw8o0R5A.mp3",
      isLiked: false,
      rank: 2,
      trend: "same",
    },
    {
      id: 3,
      title: "Acoustic Soul",
      artist: "MelodyMaker",
      genre: "Folk",
      duration: "3:45",
      plays: 11230,
      likes: 634,
      audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio%20VM%20for%20BB-e0JfvAP82p7pTkU6IkedDbiqkgNKc2.mp3",
      isLiked: false,
      rank: 3,
      trend: "up",
    },
    {
      id: 4,
      title: "Bass Drop Madness",
      artist: "EDM_King",
      genre: "Electronic",
      duration: "2:58",
      plays: 9876,
      likes: 543,
      audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio%20sample%20BB1-H1FFSxbomW3iCfaAgmk0Hg37VA8KUb.mp3",
      isLiked: false,
      rank: 4,
      trend: "down",
    },
    {
      id: 5,
      title: "Jazz Fusion Flow",
      artist: "JazzCat_AI",
      genre: "Jazz",
      duration: "5:21",
      plays: 8765,
      likes: 432,
      audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Audion%20Sample%20BB2-sKRqesjrFVwnjY2IpduXNVzw8o0R5A.mp3",
      isLiked: false,
      rank: 5,
      trend: "up",
      contestEntry: true,
    },
  ])

  // Mock leaderboard data
  const [leaderboard] = useState([
    { rank: 1, artist: "BeatMaster_2024", totalPlays: 45230, totalLikes: 2340, tracks: 12, badge: "🔥" },
    { rank: 2, artist: "SynthWave_Pro", totalPlays: 38920, totalLikes: 1890, tracks: 8, badge: "⚡" },
    { rank: 3, artist: "MelodyMaker", totalPlays: 32100, totalLikes: 1650, tracks: 15, badge: "🎵" },
    { rank: 4, artist: "EDM_King", totalPlays: 28750, totalLikes: 1420, tracks: 6, badge: "👑" },
    { rank: 5, artist: "JazzCat_AI", totalPlays: 25680, totalLikes: 1280, tracks: 9, badge: "🎷" },
    { rank: 6, artist: "RockStar_Gen", totalPlays: 22340, totalLikes: 1150, tracks: 7, badge: "🎸" },
    { rank: 7, artist: "PopPrincess_AI", totalPlays: 19870, totalLikes: 980, tracks: 11, badge: "💎" },
    { rank: 8, artist: "HipHop_Hero", totalPlays: 17560, totalLikes: 890, tracks: 5, badge: "🎤" },
    { rank: 9, artist: "ClassicalComposer", totalPlays: 15230, totalLikes: 760, tracks: 13, badge: "🎼" },
    { rank: 10, artist: "CountryCreator", totalPlays: 12890, totalLikes: 640, tracks: 4, badge: "🤠" },
  ])

  const genres = ["all", "Hip Hop", "Electronic", "Pop", "Rock", "Jazz", "Folk", "Classical", "Country"]

  const handlePlayPause = async (track: Track) => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setCurrentAudio(null)
    }

    if (isPlaying === track.id) {
      setIsPlaying(null)
    } else {
      try {
        const audio = new Audio(track.audioUrl)
        audio.volume = 0.7

        audio.onended = () => {
          setIsPlaying(null)
          setCurrentAudio(null)
        }

        audio.onerror = () => {
          toast({
            title: "Playback Error",
            description: "Failed to play track",
            variant: "destructive",
          })
          setIsPlaying(null)
          setCurrentAudio(null)
        }

        await audio.play()
        setIsPlaying(track.id)
        setCurrentAudio(audio)
      } catch (error) {
        toast({
          title: "Playback Error",
          description: "Failed to play track",
          variant: "destructive",
        })
      }
    }
  }

  const handleLike = (trackId: number) => {
    setLikedTracks((prev) => {
      const newLiked = new Set(prev)
      if (newLiked.has(trackId)) {
        newLiked.delete(trackId)
        toast({
          title: "Removed from favorites",
          description: "Track removed from your liked songs",
        })
      } else {
        newLiked.add(trackId)
        toast({
          title: "Added to favorites",
          description: "Track added to your liked songs",
        })
      }
      return newLiked
    })
  }

  const handleShare = (track: Track) => {
    if (navigator.share) {
      navigator.share({
        title: track.title,
        text: `Check out "${track.title}" by ${track.artist} on Burnt Beats!`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(
        `Check out "${track.title}" by ${track.artist} on Burnt Beats! ${window.location.href}`,
      )
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard",
      })
    }
  }

  const filteredTracks = trendingTracks.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGenre = selectedGenre === "all" || track.genre === selectedGenre
    return matchesSearch && matchesGenre
  })

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getTrendIcon = (trend?: "up" | "down" | "same") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case "down":
        return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
      default:
        return <div className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-green-400 bg-clip-text text-transparent">
              Discover Music
            </h1>
            <p className="text-green-300/80 mt-2">Explore trending AI-generated tracks from the community</p>
          </div>
          <Link href="/">
            <Button
              variant="outline"
              className="text-green-300 border-green-500/30 bg-black/40 hover:bg-green-500/10 hover:border-green-400"
            >
              Back to Studio
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400/60 w-4 h-4" />
                <Input
                  placeholder="Search tracks, artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="text-green-400/60 w-4 h-4" />
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="bg-black/60 border border-green-500/30 text-green-100 rounded-md px-3 py-2 focus:border-green-400 focus:ring-green-400/20"
                >
                  {genres.map((genre) => (
                    <option key={genre} value={genre} className="bg-black text-green-100">
                      {genre === "all" ? "All Genres" : genre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/60 border border-green-500/20 mb-8">
            <TabsTrigger
              value="trending"
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending Tracks
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Artist Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending">
            <div className="space-y-4">
              {filteredTracks.map((track) => (
                <Card
                  key={track.id}
                  className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10 hover:border-green-400/50 transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-green-400">#{track.rank}</div>
                          {getTrendIcon(track.trend)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-green-100">{track.title}</h3>
                            {track.contestEntry && (
                              <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                                <Trophy className="w-3 h-3 mr-1" />
                                Contest
                              </Badge>
                            )}
                          </div>
                          <p className="text-green-400/80">by {track.artist}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-green-400/60">
                            <span>{track.genre}</span>
                            <span>{track.duration}</span>
                            <span>{formatNumber(track.plays)} plays</span>
                            <span>{formatNumber(track.likes)} likes</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handlePlayPause(track)}
                          className="bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold"
                        >
                          {isPlaying === track.id ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Play
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => handleLike(track.id)}
                          variant="ghost"
                          className={`${
                            likedTracks.has(track.id)
                              ? "text-red-400 hover:text-red-300"
                              : "text-green-300 hover:text-green-100"
                          } hover:bg-green-500/10`}
                        >
                          <Heart className={`w-4 h-4 ${likedTracks.has(track.id) ? "fill-current" : ""}`} />
                        </Button>

                        <Button
                          onClick={() => handleShare(track)}
                          variant="ghost"
                          className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                          onClick={() => {
                            toast({
                              title: "Download Available",
                              description: "Purchase to download this track",
                            })
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
              <CardHeader>
                <CardTitle className="text-green-300 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Top Artists This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((artist) => (
                    <div
                      key={artist.rank}
                      className="flex items-center justify-between p-4 bg-black/60 border border-green-500/20 rounded-lg hover:border-green-400/40 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-2xl font-bold ${
                              artist.rank === 1
                                ? "text-yellow-400"
                                : artist.rank === 2
                                  ? "text-gray-300"
                                  : artist.rank === 3
                                    ? "text-orange-400"
                                    : "text-green-400"
                            }`}
                          >
                            #{artist.rank}
                          </div>
                          {artist.rank <= 3 && (
                            <div className="text-2xl">{artist.rank === 1 ? "🥇" : artist.rank === 2 ? "🥈" : "🥉"}</div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-green-100">{artist.artist}</h3>
                            <span className="text-xl">{artist.badge}</span>
                            {artist.rank === 1 && <Crown className="w-4 h-4 text-yellow-400" />}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-green-400/60">
                            <span>{formatNumber(artist.totalPlays)} total plays</span>
                            <span>{formatNumber(artist.totalLikes)} total likes</span>
                            <span>{artist.tracks} tracks</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                        >
                          <Volume2 className="w-4 h-4 mr-2" />
                          Listen
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-300 hover:text-green-100 hover:bg-green-500/10"
                        >
                          Follow
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
