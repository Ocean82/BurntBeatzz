"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  Users,
  Heart,
  Eye,
  Share2,
  MessageCircle,
  Trophy,
  Calendar,
  Award,
  Zap,
  Target,
  BarChart3,
} from "lucide-react"

interface ContestStats {
  totalVotes: number
  totalPlays: number
  totalShares: number
  totalComments: number
  participatingArtists: number
  daysRemaining: number
  prizePool: string
  votingTrend: Array<{ day: string; votes: number }>
  topGenres: Array<{ genre: string; percentage: number }>
  engagementRate: number
}

export default function ContestAnalytics() {
  const [contestStats] = useState<ContestStats>({
    totalVotes: 15847,
    totalPlays: 89234,
    totalShares: 2156,
    totalComments: 1834,
    participatingArtists: 127,
    daysRemaining: 18,
    prizePool: "$500 + Prizes",
    votingTrend: [
      { day: "Mon", votes: 1200 },
      { day: "Tue", votes: 1450 },
      { day: "Wed", votes: 1800 },
      { day: "Thu", votes: 2100 },
      { day: "Fri", votes: 2800 },
      { day: "Sat", votes: 3200 },
      { day: "Sun", votes: 3297 },
    ],
    topGenres: [
      { genre: "Hip Hop", percentage: 35 },
      { genre: "Electronic", percentage: 28 },
      { genre: "R&B", percentage: 18 },
      { genre: "Metal", percentage: 12 },
      { genre: "Pop", percentage: 7 },
    ],
    engagementRate: 87,
  })

  const progressPercentage = ((30 - contestStats.daysRemaining) / 30) * 100

  return (
    <div className="space-y-6">
      {/* Contest Overview */}
      <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center gap-2 text-2xl">
            <Trophy className="w-6 h-6 text-yellow-400" />🏆 FEBRUARY 2024 CONTEST ANALYTICS 🏆
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge className="bg-green-500/20 text-green-300">
              <Calendar className="w-3 h-3 mr-1" />
              {contestStats.daysRemaining} days left
            </Badge>
            <Badge className="bg-yellow-500/20 text-yellow-300">
              <Award className="w-3 h-3 mr-1" />
              {contestStats.prizePool}
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300">
              <Users className="w-3 h-3 mr-1" />
              {contestStats.participatingArtists} artists
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-300 font-semibold">Contest Progress</span>
              <span className="text-green-300">{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-black/60" />
          </div>

          {/* Key Metrics Grid */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-green-500/10 border border-green-500/30">
              <CardContent className="p-4 text-center">
                <Heart className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-300">{contestStats.totalVotes.toLocaleString()}</div>
                <div className="text-green-400/80 text-sm">Total Votes</div>
                <Badge className="bg-green-500/20 text-green-300 text-xs mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +23% this week
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/10 border border-blue-500/30">
              <CardContent className="p-4 text-center">
                <Eye className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-300">{contestStats.totalPlays.toLocaleString()}</div>
                <div className="text-blue-400/80 text-sm">Total Plays</div>
                <Badge className="bg-blue-500/20 text-blue-300 text-xs mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +45% this week
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-purple-500/10 border border-purple-500/30">
              <CardContent className="p-4 text-center">
                <Share2 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-300">{contestStats.totalShares.toLocaleString()}</div>
                <div className="text-purple-400/80 text-sm">Total Shares</div>
                <Badge className="bg-purple-500/20 text-purple-300 text-xs mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +67% this week
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-orange-500/10 border border-orange-500/30">
              <CardContent className="p-4 text-center">
                <MessageCircle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-300">{contestStats.totalComments.toLocaleString()}</div>
                <div className="text-orange-400/80 text-sm">Comments</div>
                <Badge className="bg-orange-500/20 text-orange-300 text-xs mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +34% this week
                </Badge>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Voting Trends */}
      <Card className="bg-black/80 backdrop-blur-sm border border-blue-500/30 shadow-xl shadow-blue-500/10">
        <CardHeader>
          <CardTitle className="text-blue-300 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />📊 Weekly Voting Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contestStats.votingTrend.map((day, index) => (
              <div key={day.day} className="flex items-center gap-4">
                <div className="w-12 text-blue-300 font-semibold">{day.day}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-blue-300/80 text-sm">{day.votes.toLocaleString()} votes</span>
                    <span className="text-blue-300/60 text-xs">
                      {Math.round((day.votes / Math.max(...contestStats.votingTrend.map((d) => d.votes))) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={(day.votes / Math.max(...contestStats.votingTrend.map((d) => d.votes))) * 100}
                    className="h-2 bg-black/60"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Genre Distribution */}
      <Card className="bg-black/80 backdrop-blur-sm border border-purple-500/30 shadow-xl shadow-purple-500/10">
        <CardHeader>
          <CardTitle className="text-purple-300 flex items-center gap-2">
            <Target className="w-5 h-5" />🎵 Genre Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contestStats.topGenres.map((genre, index) => (
              <div key={genre.genre} className="flex items-center gap-4">
                <div className="w-20 text-purple-300 font-semibold">{genre.genre}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-purple-300/80 text-sm">{genre.percentage}% of submissions</span>
                  </div>
                  <Progress value={genre.percentage} className="h-3 bg-black/60" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Engagement Score */}
      <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 shadow-xl shadow-yellow-500/10">
        <CardHeader>
          <CardTitle className="text-yellow-300 flex items-center gap-2">
            <Zap className="w-5 h-5" />⚡ Contest Engagement Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className="text-6xl font-bold text-yellow-300 mb-2">{contestStats.engagementRate}%</div>
            <div className="text-yellow-400/80">Overall Engagement Rate</div>
            <Badge className="bg-yellow-500/20 text-yellow-300 mt-2">🔥 Extremely High Engagement!</Badge>
          </div>
          <Progress value={contestStats.engagementRate} className="h-4 bg-black/60 mb-4" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-yellow-300/80">
              <strong>Voting Rate:</strong> 94% of listeners vote
            </div>
            <div className="text-yellow-300/80">
              <strong>Share Rate:</strong> 12% of listeners share
            </div>
            <div className="text-yellow-300/80">
              <strong>Comment Rate:</strong> 8% leave comments
            </div>
            <div className="text-yellow-300/80">
              <strong>Return Rate:</strong> 76% return daily
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
