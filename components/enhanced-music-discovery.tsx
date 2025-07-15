"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  Pause,
  ThumbsUp,
  ThumbsDown,
  Search,
  Crown,
  Eye,
  Download,
  Share2,
  Heart,
  MessageCircle,
  TrendingUp,
  Calendar,
  Users,
  Clock,
  Zap,
  Trophy,
  Flame,
  Music,
  Headphones,
} from "lucide-react"

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
  shares: number
  comments: number
  uploadDate: string
  description: string
  tags: string[]
  fileSize: string
  isPlaying?: boolean
  userLiked?: boolean
  userDisliked?: boolean
  userShared?: boolean
  trendingScore: number
  weeklyGrowth: number
  isVerified?: boolean
  isPremium?: boolean
  collaborators?: string[]
}

interface MonthlyWinner {
  month: string
  track: Track
  totalVotes: number
  prize: string
}

export default function EnhancedMusicDiscovery() {
  const [selectedGenre, setSelectedGenre] = useState("all")
  const [selectedStyle, setSelectedStyle] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("trending")
  const [timeFilter, setTimeFilter] = useState("all-time")
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState<string | null>(null)

  // Mock data for tracks with enhanced properties
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
      shares: 89,
      comments: 156,
      uploadDate: "2024-01-15",
      description: "A cyberpunk journey through neon-lit streets",
      tags: ["cyberpunk", "synthwave", "retro"],
      fileSize: "5.2 MB",
      trendingScore: 95,
      weeklyGrowth: 23,
      isVerified: true,
      isPremium: false,
      collaborators: ["NeonWolf", "DigitalDreamer"],
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
      shares: 234,
      comments: 89,
      uploadDate: "2024-01-20",
      description: "Heavy trap beats that'll melt your speakers",
      tags: ["trap", "heavy", "bass"],
      fileSize: "4.1 MB",
      trendingScore: 98,
      weeklyGrowth: 45,
      isVerified: true,
      isPremium: true,
      collaborators: ["FireDemon"],
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
      shares: 67,
      comments: 34,
      uploadDate: "2024-01-18",
      description: "Ethereal soundscapes for the digital age",
      tags: ["ambient", "chill", "atmospheric"],
      fileSize: "6.8 MB",
      trendingScore: 87,
      weeklyGrowth: 12,
      isVerified: false,
      isPremium: false,
      collaborators: [],
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
      shares: 145,
      comments: 78,
      uploadDate: "2024-01-22",
      description: "Industrial metal that hits like a freight train",
      tags: ["industrial", "heavy", "aggressive"],
      fileSize: "4.9 MB",
      trendingScore: 92,
      weeklyGrowth: 34,
      isVerified: true,
      isPremium: false,
      collaborators: ["MetalMaster"],
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
      shares: 98,
      comments: 45,
      uploadDate: "2024-01-19",
      description: "Smooth late-night vibes for your soul",
      tags: ["lofi", "chill", "smooth"],
      fileSize: "3.7 MB",
      trendingScore: 89,
      weeklyGrowth: 18,
      isVerified: false,
      isPremium: true,
      collaborators: ["SoulSinger"],
    },
  ])

  // Mock monthly winners
  const monthlyWinners: MonthlyWinner[] = [
    {
      month: "January 2024",
      track: tracks[1], // Fire Storm
      totalVotes: 2156,
      prize: "$500 + Featured Placement",
    },
    {
      month: "December 2023",
      track: tracks[0], // Neon Nights
      totalVotes: 1890,
      prize: "$500 + Studio Time",
    },
    {
      month: "November 2023",
      track: tracks[3], // Rage Mode
      totalVotes: 1654,
      prize: "$500 + Equipment Voucher",
    },
  ]

  const genres = ["all", "Electronic", "Hip Hop", "Metal", "R&B", "Pop", "Rock", "Jazz", "Classical"]
  const styles = ["all", "Synthwave", "Trap", "Ambient", "Industrial", "Lo-Fi", "House", "Dubstep", "Techno"]
  const sortOptions = [
    { value: "trending", label: "🔥 Trending Score", icon: TrendingUp },
    { value: "likes", label: "👍 Most Liked", icon: ThumbsUp },
    { value: "plays", label: "🎧 Most Played", icon: Headphones },
    { value: "recent", label: "⏰ Most Recent", icon: Clock },
    { value: "growth", label: "📈 Weekly Growth", icon: Zap },
    { value: "shares", label: "📤 Most Shared", icon: Share2 },
  ]

  // Enhanced filtering and sorting
  const getFilteredAndSortedTracks = () => {
    const filtered = tracks.filter((track) => {
      const matchesSearch =
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesGenre = selectedGenre === "all" || track.genre === selectedGenre
      const matchesStyle = selectedStyle === "all" || track.style === selectedStyle

      // Time filter logic
      const trackDate = new Date(track.uploadDate)
      const now = new Date()
      const daysDiff = (now.getTime() - trackDate.getTime()) / (1000 * 3600 * 24)

      let matchesTime = true
      if (timeFilter === "today") matchesTime = daysDiff <= 1
      else if (timeFilter === "week") matchesTime = daysDiff <= 7
      else if (timeFilter === "month") matchesTime = daysDiff <= 30

      return matchesSearch && matchesGenre && matchesStyle && matchesTime
    })

    // Sort tracks
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "trending":
          return b.trendingScore - a.trendingScore
        case "likes":
          return b.likes - a.likes
        case "plays":
          return b.plays - a.plays
        case "growth":
          return b.weeklyGrowth - a.weeklyGrowth
        case "shares":
          return b.shares - a.shares
        case "recent":
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        default:
          return b.trendingScore - a.trendingScore
      }
    })
  }

  const filteredTracks = getFilteredAndSortedTracks()

  // Get top tracks for different categories
  const getTopTracks = (category: string, limit = 10) => {
    const sorted = [...tracks].sort((a, b) => {
      switch (category) {
        case "likes":
          return b.likes - a.likes
        case "plays":
          return b.plays - a.plays
        case "trending":
          return b.trendingScore - a.trendingScore
        case "growth":
          return b.weeklyGrowth - a.weeklyGrowth
        default:
          return b.likes - a.likes
      }
    })
    return sorted.slice(0, limit)
  }

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

  const handleShare = (trackId: string) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id === trackId) {
          return {
            ...track,
            shares: track.shares + 1,
            userShared: true,
          }
        }
        return track
      }),
    )
    setShowShareModal(null)
  }

  const handlePlay = (trackId: string) => {
    setCurrentlyPlaying(currentlyPlaying === trackId ? null : trackId)
    // Increment play count
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id === trackId && currentlyPlaying !== trackId) {
          return { ...track, plays: track.plays + 1 }
        }
        return track
      }),
    )
  }

  const EnhancedTrackCard = ({
    track,
    rank,
    showRank = false,
  }: { track: Track; rank?: number; showRank?: boolean }) => (
    <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10 hover:border-green-400/50 transition-all group">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {showRank && rank && (
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-green-500 rounded-full text-white font-bold text-lg shadow-lg">
              {rank}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-green-100 font-semibold text-lg">{track.title}</h3>
                    {track.isVerified && <Badge className="bg-blue-500/20 text-blue-300 text-xs">✓ Verified</Badge>}
                    {track.isPremium && <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">⭐ Premium</Badge>}
                  </div>
                  <p className="text-green-400/80 text-sm">by {track.artist}</p>
                  {track.collaborators && track.collaborators.length > 0 && (
                    <p className="text-green-400/60 text-xs">feat. {track.collaborators.join(", ")}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame className="w-4 h-4" />
                    <span className="text-sm font-bold">{track.trendingScore}</span>
                  </div>
                  {track.weeklyGrowth > 0 && (
                    <Badge className="bg-green-500/20 text-green-300 text-xs">+{track.weeklyGrowth}% this week</Badge>
                  )}
                </div>
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
                  onClick={() => setShowShareModal(track.id)}
                  className="text-blue-300 hover:text-blue-100 hover:bg-blue-500/10"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-yellow-300 hover:text-yellow-100 hover:bg-yellow-500/10 font-bold"
                >
                  🏆 CONTEST
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

            {/* Enhanced Stats Row */}
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
                  <span className="text-xs">{track.likes.toLocaleString()}</span>
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

                <div className="flex items-center gap-1 text-blue-300/60">
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs">{track.shares}</span>
                </div>

                <div className="flex items-center gap-1 text-purple-300/60">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">{track.comments}</span>
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
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent mb-2">
              🏆 BURNT BEATS DISCOVERY HUB 🏆
            </h1>
            <p className="text-green-300/80">Discover fire tracks, compete for prizes, and climb the leaderboards!</p>
            <div className="flex items-center gap-4 mt-2">
              <Badge className="bg-green-500/20 text-green-300">
                <Users className="w-3 h-3 mr-1" />
                {tracks.length} Active Creators
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300">
                <Music className="w-3 h-3 mr-1" />
                {tracks.reduce((sum, track) => sum + track.plays, 0).toLocaleString()} Total Plays
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-300">
                <Heart className="w-3 h-3 mr-1" />
                {tracks.reduce((sum, track) => sum + track.likes, 0).toLocaleString()} Total Likes
              </Badge>
            </div>
          </div>
          <Button className="relative overflow-hidden bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white font-bold shadow-2xl shadow-orange-500/50 animate-pulse border-2 border-yellow-400/50 px-6 py-3">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            <Crown className="w-5 h-5 mr-2 animate-bounce" />🚀 SUBMIT YOUR TRACK! 🚀
          </Button>
        </div>

        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/60 border border-green-500/20 mb-8">
            <TabsTrigger value="discover" className="text-green-300 data-[state=active]:bg-green-500/30">
              🔥 Discover
            </TabsTrigger>
            <TabsTrigger value="leaderboards" className="text-green-300 data-[state=active]:bg-green-500/30">
              👑 Leaderboards
            </TabsTrigger>
            <TabsTrigger value="trending" className="text-green-300 data-[state=active]:bg-green-500/30">
              📈 Trending
            </TabsTrigger>
            <TabsTrigger value="winners" className="text-green-300 data-[state=active]:bg-green-500/30">
              🏆 Winners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Enhanced Search and Filters */}
            <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
              <CardHeader>
                <CardTitle className="text-green-300 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Advanced Discovery Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-4">
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
                      <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100">
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
                      <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100">
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
                  <div>
                    <Label className="text-green-300 mb-2 block">Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-green-500/30">
                        {sortOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="text-green-100 focus:bg-green-500/20"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-green-300 mb-2 block">Time Period</Label>
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                      <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-green-500/30">
                        <SelectItem value="all-time" className="text-green-100 focus:bg-green-500/20">
                          All Time
                        </SelectItem>
                        <SelectItem value="month" className="text-green-100 focus:bg-green-500/20">
                          This Month
                        </SelectItem>
                        <SelectItem value="week" className="text-green-100 focus:bg-green-500/20">
                          This Week
                        </SelectItem>
                        <SelectItem value="today" className="text-green-100 focus:bg-green-500/20">
                          Today
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Track Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                  🔥 {filteredTracks.length} TRACKS FOUND 🔥
                </h2>
              </div>

              {filteredTracks.map((track) => (
                <EnhancedTrackCard key={track.id} track={track} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaderboards" className="space-y-8">
            {/* Top Liked Tracks */}
            <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
              <CardHeader>
                <CardTitle className="text-green-300 flex items-center gap-2 text-2xl">
                  <ThumbsUp className="w-6 h-6 text-green-400" />🔥 MOST LIKED - TOP 10 🔥
                </CardTitle>
                <p className="text-green-400/80">The community's absolute favorites this month!</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {getTopTracks("likes", 10).map((track, index) => (
                  <EnhancedTrackCard key={track.id} track={track} rank={index + 1} showRank={true} />
                ))}
              </CardContent>
            </Card>

            {/* Most Played Tracks */}
            <Card className="bg-black/80 backdrop-blur-sm border border-purple-500/30 shadow-xl shadow-purple-500/10">
              <CardHeader>
                <CardTitle className="text-purple-300 flex items-center gap-2 text-2xl">
                  <Headphones className="w-6 h-6 text-purple-400" />🎧 MOST PLAYED - TOP 10 🎧
                </CardTitle>
                <p className="text-purple-400/80">What everyone's listening to right now!</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {getTopTracks("plays", 10).map((track, index) => (
                  <EnhancedTrackCard key={track.id} track={track} rank={index + 1} showRank={true} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trending" className="space-y-8">
            {/* Trending Tracks */}
            <Card className="bg-black/80 backdrop-blur-sm border border-orange-500/30 shadow-xl shadow-orange-500/10">
              <CardHeader>
                <CardTitle className="text-orange-300 flex items-center gap-2 text-2xl">
                  <TrendingUp className="w-6 h-6 text-orange-400" />📈 TRENDING NOW - HOT TRACKS 📈
                </CardTitle>
                <p className="text-orange-400/80">Tracks with the highest trending scores!</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {getTopTracks("trending", 10).map((track, index) => (
                  <EnhancedTrackCard key={track.id} track={track} rank={index + 1} showRank={true} />
                ))}
              </CardContent>
            </Card>

            {/* Weekly Growth */}
            <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 shadow-xl shadow-yellow-500/10">
              <CardHeader>
                <CardTitle className="text-yellow-300 flex items-center gap-2 text-2xl">
                  <Zap className="w-6 h-6 text-yellow-400" />⚡ FASTEST GROWING - THIS WEEK ⚡
                </CardTitle>
                <p className="text-yellow-400/80">Tracks with the biggest growth this week!</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {getTopTracks("growth", 10).map((track, index) => (
                  <EnhancedTrackCard key={track.id} track={track} rank={index + 1} showRank={true} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="winners" className="space-y-8">
            {/* Monthly Winners Hall of Fame */}
            <Card className="bg-black/80 backdrop-blur-sm border border-gold-500/30 shadow-xl shadow-gold-500/10">
              <CardHeader>
                <CardTitle className="text-yellow-300 flex items-center gap-2 text-3xl">
                  <Trophy className="w-8 h-8 text-yellow-400" />🏆 MONTHLY WINNERS HALL OF FAME 🏆
                </CardTitle>
                <p className="text-yellow-400/80">Champions who conquered the monthly contests!</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {monthlyWinners.map((winner, index) => (
                  <Card
                    key={winner.month}
                    className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-white font-bold text-xl">
                            👑
                          </div>
                          <div>
                            <h3 className="text-yellow-300 font-bold text-xl">{winner.month} Champion</h3>
                            <p className="text-yellow-400/80">{winner.totalVotes.toLocaleString()} total votes</p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-300 text-lg px-4 py-2">{winner.prize}</Badge>
                      </div>
                      <EnhancedTrackCard track={winner.track} />
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Current Month Contest Status */}
            <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
              <CardHeader>
                <CardTitle className="text-green-300 flex items-center gap-2 text-2xl">
                  <Calendar className="w-6 h-6 text-green-400" />
                  🗓️ FEBRUARY 2024 CONTEST - IN PROGRESS 🗓️
                </CardTitle>
                <p className="text-green-400/80">Current month's competition - vote for your favorites!</p>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-300">Contest Progress</span>
                    <span className="text-green-300">18 days remaining</span>
                  </div>
                  <Progress value={40} className="h-3 bg-black/60" />
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-green-500/10 border border-green-500/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-300">
                        {tracks.reduce((sum, track) => sum + track.likes, 0).toLocaleString()}
                      </div>
                      <div className="text-green-400/80 text-sm">Total Votes Cast</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-500/10 border border-blue-500/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-300">{tracks.length}</div>
                      <div className="text-blue-400/80 text-sm">Competing Tracks</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-500/10 border border-purple-500/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-300">$500</div>
                      <div className="text-purple-400/80 text-sm">Prize Pool</div>
                    </CardContent>
                  </Card>
                </div>

                <h3 className="text-xl font-bold text-green-300 mb-4">🔥 Current Top 5 Contenders 🔥</h3>
                <div className="space-y-3">
                  {getTopTracks("likes", 5).map((track, index) => (
                    <EnhancedTrackCard key={track.id} track={track} rank={index + 1} showRank={true} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="bg-black/90 border border-green-500/30 w-96">
              <CardHeader>
                <CardTitle className="text-green-300">Share Track</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleShare(showShareModal)}
                    className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                  >
                    Twitter
                  </Button>
                  <Button
                    onClick={() => handleShare(showShareModal)}
                    className="bg-blue-600/20 text-blue-300 hover:bg-blue-600/30"
                  >
                    Facebook
                  </Button>
                  <Button
                    onClick={() => handleShare(showShareModal)}
                    className="bg-pink-500/20 text-pink-300 hover:bg-pink-500/30"
                  >
                    Instagram
                  </Button>
                  <Button
                    onClick={() => handleShare(showShareModal)}
                    className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  >
                    YouTube
                  </Button>
                </div>
                <Button
                  onClick={() => setShowShareModal(null)}
                  variant="outline"
                  className="w-full text-green-300 border-green-500/30"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
