"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Calendar, TrendingUp, Award, RotateCcw, Crown, Medal, Star } from "lucide-react"

interface ContestCycle {
  id: string
  startDate: string
  endDate: string
  status: "upcoming" | "active" | "ended" | "archived"
  totalPrizePool: number
  participantCount: number
  winnersAnnounced: boolean
  daysRemaining: number
}

interface LeaderboardEntry {
  rank: number
  songId: string
  title: string
  artist: string
  likes: number
  plays: number
  rating: number
  userId: string
  profileImage?: string
  potentialPrize: number
}

export default function ContestManagementDashboard() {
  const [currentContest, setCurrentContest] = useState<ContestCycle>({
    id: "contest_2024_1",
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2024-01-31T23:59:59Z",
    status: "active",
    totalPrizePool: 1500, // Total credits available
    participantCount: 47,
    winnersAnnounced: false,
    daysRemaining: 12,
  })

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([
    {
      rank: 1,
      songId: "song_1",
      title: "Neon Dreams",
      artist: "Alex Chen",
      likes: 234,
      plays: 1847,
      rating: 4.8,
      userId: "user_1",
      potentialPrize: 500,
    },
    {
      rank: 2,
      songId: "song_2",
      title: "Digital Sunrise",
      artist: "Maya Rodriguez",
      likes: 198,
      plays: 1523,
      rating: 4.7,
      userId: "user_2",
      potentialPrize: 300,
    },
    {
      rank: 3,
      songId: "song_3",
      title: "Cyber Funk",
      artist: "Jordan Kim",
      likes: 176,
      plays: 1334,
      rating: 4.6,
      userId: "user_3",
      potentialPrize: 200,
    },
    {
      rank: 4,
      songId: "song_4",
      title: "Electric Waves",
      artist: "Sam Taylor",
      likes: 145,
      plays: 1156,
      rating: 4.5,
      userId: "user_4",
      potentialPrize: 100,
    },
    {
      rank: 5,
      songId: "song_5",
      title: "Synthwave Nights",
      artist: "Riley Johnson",
      likes: 132,
      plays: 987,
      rating: 4.4,
      userId: "user_5",
      potentialPrize: 100,
    },
  ])

  const [contestHistory] = useState([
    {
      id: "contest_2023_12",
      month: "December 2023",
      winner: "Digital Dreams by Alex Chen",
      totalVotes: 1847,
      participants: 52,
      status: "completed",
    },
    {
      id: "contest_2023_11",
      month: "November 2023",
      winner: "Neon Pulse by Maya Rodriguez",
      totalVotes: 1634,
      participants: 48,
      status: "completed",
    },
  ])

  const progressPercentage = ((31 - currentContest.daysRemaining) / 31) * 100

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <Star className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "upcoming":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "ended":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  return (
    <div className="space-y-6">
      {/* Contest Status Overview */}
      <Card className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 border border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-300 flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Monthly Contest - January 2024
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="text-2xl font-bold text-green-300">{currentContest.daysRemaining}</div>
              <div className="text-green-400/80 text-sm">Days Remaining</div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-300">{currentContest.participantCount}</div>
              <div className="text-blue-400/80 text-sm">Participants</div>
            </div>
            <div className="text-center p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-300">{currentContest.totalPrizePool.toLocaleString()}</div>
              <div className="text-purple-400/80 text-sm">Total Credits</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <Badge className={getStatusColor(currentContest.status)}>{currentContest.status.toUpperCase()}</Badge>
              <div className="text-yellow-400/80 text-sm mt-1">Contest Status</div>
            </div>
          </div>

          {/* Contest Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Contest Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Started: Jan 1, 2024</span>
              <span>Ends: Jan 31, 2024</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contest Tabs */}
      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="bg-black/60 border border-gray-500/30 grid grid-cols-3">
          <TabsTrigger
            value="leaderboard"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300"
          >
            Current Leaderboard
          </TabsTrigger>
          <TabsTrigger
            value="prizes"
            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300"
          >
            Prize Structure
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
            Contest History
          </TabsTrigger>
        </TabsList>

        {/* Current Leaderboard */}
        <TabsContent value="leaderboard">
          <Card className="bg-black/80 border border-gray-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Live Leaderboard
              </CardTitle>
              <p className="text-gray-400">Rankings update in real-time • Votes reset monthly</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.songId}
                    className={`p-4 border rounded-lg transition-all hover:border-purple-500/50 ${
                      entry.rank <= 3 ? "border-yellow-500/30 bg-yellow-500/5" : "border-gray-500/30 bg-gray-500/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                          <span className="text-2xl font-bold text-white">#{entry.rank}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
                          <p className="text-gray-400">by {entry.artist}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-green-300 font-bold text-lg">{entry.potentialPrize} credits</div>
                        <div className="text-gray-400 text-sm">
                          {entry.likes} likes • {entry.plays} plays
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reset Warning */}
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-300 font-semibold">
                  <RotateCcw className="w-4 h-4" />
                  Monthly Reset Notice
                </div>
                <p className="text-yellow-400/80 text-sm mt-1">
                  All votes and rankings reset to zero on the 1st of each month. Contest winners are announced and
                  prizes awarded automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prize Structure */}
        <TabsContent value="prizes">
          <Card className="bg-black/80 border border-gray-500/30">
            <CardHeader>
              <CardTitle className="text-green-300 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Prize Structure
              </CardTitle>
              <p className="text-gray-400">Credit rewards for monthly contest winners</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-semibold mb-4">🏆 Top Winners</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        <span className="text-white font-semibold">1st Place</span>
                      </div>
                      <span className="text-green-300 font-bold">500 credits</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Medal className="w-5 h-5 text-gray-300" />
                        <span className="text-white font-semibold">2nd Place</span>
                      </div>
                      <span className="text-green-300 font-bold">300 credits</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-600/10 border border-amber-600/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-600" />
                        <span className="text-white font-semibold">3rd Place</span>
                      </div>
                      <span className="text-green-300 font-bold">200 credits</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-4">🎖️ Other Prizes</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <span className="text-white">4th - 5th Place</span>
                      <span className="text-green-300 font-bold">100 credits</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <span className="text-white">6th - 10th Place</span>
                      <span className="text-green-300 font-bold">50 credits</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
                      <span className="text-white">All Participants</span>
                      <span className="text-green-300 font-bold">25 credits</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prize Pool Info */}
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <h4 className="text-green-300 font-semibold mb-2">💰 Total Prize Pool: 1,500 Credits</h4>
                <p className="text-green-400/80 text-sm">
                  Equivalent to ~$15 in platform value. Credits never expire and can be used for AI generation,
                  downloads, premium features, and more!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contest History */}
        <TabsContent value="history">
          <Card className="bg-black/80 border border-gray-500/30">
            <CardHeader>
              <CardTitle className="text-blue-300 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Contest History
              </CardTitle>
              <p className="text-gray-400">Previous monthly contest results</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contestHistory.map((contest) => (
                  <div key={contest.id} className="p-4 border border-gray-500/30 rounded-lg bg-gray-500/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold">{contest.month}</h3>
                        <p className="text-gray-400">Winner: {contest.winner}</p>
                        <p className="text-gray-500 text-sm">
                          {contest.totalVotes} total votes • {contest.participants} participants
                        </p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">{contest.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
