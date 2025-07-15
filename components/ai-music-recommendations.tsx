"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, TrendingUp, Users, Heart, Play, Download } from "lucide-react"

interface RecommendedSong {
  id: string
  title: string
  artist: string
  genre: string
  similarity: number
  reason: string
  audioUrl: string
  coverUrl: string
  duration: number
  likes: number
  plays: number
  isLiked: boolean
  tags: string[]
}

interface RecommendationEngine {
  userPreferences: {
    genres: string[]
    tempo: { min: number; max: number }
    energy: { min: number; max: number }
    mood: string[]
  }
  listeningHistory: string[]
  collaborativeFiltering: RecommendedSong[]
  contentBasedFiltering: RecommendedSong[]
  trendingTracks: RecommendedSong[]
}

export function AIRecommendations({ userId }: { userId: string }) {
  const [recommendations, setRecommendations] = useState<RecommendationEngine | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"for-you" | "trending" | "similar">("for-you")

  useEffect(() => {
    loadRecommendations()
  }, [userId])

  const loadRecommendations = async () => {
    setIsLoading(true)
    try {
      // Simulate AI recommendation loading
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockRecommendations: RecommendationEngine = {
        userPreferences: {
          genres: ["Electronic", "Hip Hop", "Pop"],
          tempo: { min: 120, max: 140 },
          energy: { min: 70, max: 90 },
          mood: ["energetic", "uplifting", "danceable"],
        },
        listeningHistory: ["song1", "song2", "song3"],
        collaborativeFiltering: [
          {
            id: "rec1",
            title: "Neon Dreams",
            artist: "CyberBeats",
            genre: "Electronic",
            similarity: 94,
            reason: "Similar to your recent likes",
            audioUrl: "/audio/neon-dreams.mp3",
            coverUrl: "/covers/neon-dreams.jpg",
            duration: 210,
            likes: 1247,
            plays: 15632,
            isLiked: false,
            tags: ["energetic", "futuristic", "danceable"],
          },
          {
            id: "rec2",
            title: "Fire Flow",
            artist: "RapMaster",
            genre: "Hip Hop",
            similarity: 89,
            reason: "Matches your tempo preferences",
            audioUrl: "/audio/fire-flow.mp3",
            coverUrl: "/covers/fire-flow.jpg",
            duration: 195,
            likes: 892,
            plays: 12450,
            isLiked: false,
            tags: ["aggressive", "fast", "lyrical"],
          },
        ],
        contentBasedFiltering: [
          {
            id: "rec3",
            title: "Sunset Vibes",
            artist: "ChillWave",
            genre: "Electronic",
            similarity: 87,
            reason: "Similar audio features to your uploads",
            audioUrl: "/audio/sunset-vibes.mp3",
            coverUrl: "/covers/sunset-vibes.jpg",
            duration: 240,
            likes: 2156,
            plays: 28934,
            isLiked: true,
            tags: ["chill", "atmospheric", "melodic"],
          },
        ],
        trendingTracks: [
          {
            id: "trend1",
            title: "Viral Beat Drop",
            artist: "TrendSetter",
            genre: "Electronic",
            similarity: 76,
            reason: "Trending in your area",
            audioUrl: "/audio/viral-beat.mp3",
            coverUrl: "/covers/viral-beat.jpg",
            duration: 180,
            likes: 5432,
            plays: 89765,
            isLiked: false,
            tags: ["viral", "energetic", "catchy"],
          },
        ],
      }

      setRecommendations(mockRecommendations)
    } catch (error) {
      console.error("Failed to load recommendations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 90) return "text-green-400"
    if (similarity >= 80) return "text-yellow-400"
    return "text-orange-400"
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isLoading) {
    return (
      <Card className="bg-black/80 border-green-500/30">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-green-400 mx-auto mb-4 animate-pulse" />
          <h3 className="text-green-300 text-lg font-semibold mb-2">AI is analyzing your taste...</h3>
          <p className="text-gray-400 mb-4">Finding the perfect tracks for you</p>
          <Progress value={75} className="h-2" />
        </CardContent>
      </Card>
    )
  }

  if (!recommendations) return null

  const getCurrentRecommendations = () => {
    switch (activeTab) {
      case "trending":
        return recommendations.trendingTracks
      case "similar":
        return recommendations.contentBasedFiltering
      default:
        return recommendations.collaborativeFiltering
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-300 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Your Music DNA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-300">
                {recommendations.userPreferences.tempo.min}-{recommendations.userPreferences.tempo.max}
              </div>
              <div className="text-purple-400/60 text-sm">BPM Range</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-300">{recommendations.userPreferences.energy.min}%</div>
              <div className="text-purple-400/60 text-sm">Energy Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-300">{recommendations.userPreferences.genres.length}</div>
              <div className="text-purple-400/60 text-sm">Favorite Genres</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-300">{recommendations.listeningHistory.length}</div>
              <div className="text-purple-400/60 text-sm">Recent Tracks</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {recommendations.userPreferences.genres.map((genre) => (
                <Badge key={genre} variant="outline" className="border-purple-400 text-purple-300">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendation Tabs */}
      <Card className="bg-black/80 border-green-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-green-300">AI Recommendations</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "for-you" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("for-you")}
                className={
                  activeTab === "for-you"
                    ? "bg-green-500 text-white"
                    : "border-green-500/30 text-green-300 hover:bg-green-500/10"
                }
              >
                <Heart className="w-4 h-4 mr-1" />
                For You
              </Button>
              <Button
                variant={activeTab === "trending" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("trending")}
                className={
                  activeTab === "trending"
                    ? "bg-green-500 text-white"
                    : "border-green-500/30 text-green-300 hover:bg-green-500/10"
                }
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Trending
              </Button>
              <Button
                variant={activeTab === "similar" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("similar")}
                className={
                  activeTab === "similar"
                    ? "bg-green-500 text-white"
                    : "border-green-500/30 text-green-300 hover:bg-green-500/10"
                }
              >
                <Users className="w-4 h-4 mr-1" />
                Similar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getCurrentRecommendations().map((song) => (
              <div
                key={song.id}
                className="flex items-center gap-4 p-4 bg-black/40 border border-green-500/20 rounded-lg hover:bg-green-500/5 transition-colors"
              >
                {/* Cover Art */}
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>

                {/* Song Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-green-100 font-medium">{song.title}</h3>
                    <Badge className={`${getSimilarityColor(song.similarity)} bg-transparent border-current text-xs`}>
                      {song.similarity}% match
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-sm mb-1">{song.artist}</p>
                  <p className="text-green-400/60 text-xs">{song.reason}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Heart className="w-3 h-3" />
                      {formatNumber(song.likes)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Play className="w-3 h-3" />
                      {formatNumber(song.plays)}
                    </div>
                    <span className="text-xs text-gray-400">{formatDuration(song.duration)}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {song.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs border-gray-500 text-gray-400">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300">
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`${song.isLiked ? "text-red-400" : "text-gray-400"} hover:text-red-300`}
                  >
                    <Heart className={`w-4 h-4 ${song.isLiked ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
