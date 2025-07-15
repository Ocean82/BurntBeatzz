"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Calendar,
  Users,
  DollarSign,
  Play,
  Pause,
  Heart,
  Share2,
  Upload,
  Flame,
  Star,
  Timer,
  Award,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Contest {
  id: number
  title: string
  description: string
  theme: string
  prizePool: number
  participants: number
  maxParticipants: number
  startDate: string
  endDate: string
  status: "upcoming" | "active" | "ended"
  timeLeft: string
  entries: ContestEntry[]
}

interface ContestEntry {
  id: number
  title: string
  artist: string
  votes: number
  audioUrl: string
  rank: number
  isUserEntry?: boolean
}

export default function ContestPage() {
  const [isPlaying, setIsPlaying] = useState<number | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [votedEntries, setVotedEntries] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  // Mock contest data
  const [contests] = useState<Contest[]>([
    {
      id: 1,
      title: "🔥 Fire Beats Challenge",
      description: "Create the hottest track that embodies the spirit of fire and passion",
      theme: "Fire & Energy",
      prizePool: 1000,
      participants: 47,
      maxParticipants: 100,
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      status: "active",
      timeLeft: "12 days, 5 hours",
      entries: [
        {
          id: 1,
          title: "Inferno Nights",
          artist: "BeatMaster_2024",
          votes: 234,
          audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio%20sample%20BB1-H1FFSxbomW3iCfaAgmk0Hg37VA8KUb.mp3",
          rank: 1,
        },
        {
          id: 2,
          title: "Blazing Trails",
          artist: "FireProducer",
          votes: 198,
          audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Audion%20Sample%20BB2-sKRqesjrFVwnjY2IpduXNVzw8o0R5A.mp3",
          rank: 2,
        },
        {
          id: 3,
          title: "Phoenix Rising",
          artist: "FlameBeats",
          votes: 156,
          audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio%20VM%20for%20BB-e0JfvAP82p7pTkU6IkedDbiqkgNKc2.mp3",
          rank: 3,
        },
      ],
    },
    {
      id: 2,
      title: "🌊 Chill Vibes Contest",
      description: "Craft the perfect chill track for relaxation and good vibes",
      theme: "Chill & Ambient",
      prizePool: 750,
      participants: 32,
      maxParticipants: 75,
      startDate: "2024-02-01",
      endDate: "2024-02-28",
      status: "upcoming",
      timeLeft: "Starting in 3 days",
      entries: [],
    },
    {
      id: 3,
      title: "🎸 Rock Revolution",
      description: "Bring back the power of rock with modern AI generation",
      theme: "Rock & Metal",
      prizePool: 500,
      participants: 28,
      maxParticipants: 50,
      startDate: "2023-12-01",
      endDate: "2023-12-31",
      status: "ended",
      timeLeft: "Contest ended",
      entries: [
        {
          id: 4,
          title: "Thunder Strike",
          artist: "RockAI_Master",
          votes: 312,
          audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio%20sample%20BB1-H1FFSxbomW3iCfaAgmk0Hg37VA8KUb.mp3",
          rank: 1,
        },
      ],
    },
  ])

  const handlePlayPause = async (entryId: number, audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setCurrentAudio(null)
    }

    if (isPlaying === entryId) {
      setIsPlaying(null)
    } else {
      try {
        const audio = new Audio(audioUrl)
        audio.volume = 0.7

        audio.onended = () => {
          setIsPlaying(null)
          setCurrentAudio(null)
        }

        audio.onerror = () => {
          toast({
            title: "Playback Error",
            description: "Failed to play contest entry",
            variant: "destructive",
          })
          setIsPlaying(null)
          setCurrentAudio(null)
        }

        await audio.play()
        setIsPlaying(entryId)
        setCurrentAudio(audio)
      } catch (error) {
        toast({
          title: "Playback Error",
          description: "Failed to play contest entry",
          variant: "destructive",
        })
      }
    }
  }

  const handleVote = (entryId: number) => {
    setVotedEntries((prev) => {
      const newVoted = new Set(prev)
      if (newVoted.has(entryId)) {
        newVoted.delete(entryId)
        toast({
          title: "Vote Removed",
          description: "Your vote has been removed",
        })
      } else {
        newVoted.add(entryId)
        toast({
          title: "Vote Cast!",
          description: "Your vote has been recorded",
        })
      }
      return newVoted
    })
  }

  const handleJoinContest = (contestId: number) => {
    toast({
      title: "🎵 Joining Contest",
      description: "Redirecting to music generator...",
    })
    // In a real app, this would redirect to the generator with contest parameters
    setTimeout(() => {
      window.location.href = "/"
    }, 1500)
  }

  const getStatusColor = (status: Contest["status"]) => {
    switch (status) {
      case "active":
        return "text-green-400 border-green-500/30"
      case "upcoming":
        return "text-blue-400 border-blue-500/30"
      case "ended":
        return "text-gray-400 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: Contest["status"]) => {
    switch (status) {
      case "active":
        return <Flame className="w-4 h-4" />
      case "upcoming":
        return <Timer className="w-4 h-4" />
      case "ended":
        return <Award className="w-4 h-4" />
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-2xl">🥇</span>
      case 2:
        return <span className="text-2xl">🥈</span>
      case 3:
        return <span className="text-2xl">🥉</span>
      default:
        return <span className="text-lg font-bold text-green-400">#{rank}</span>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Music Contests
            </h1>
            <p className="text-green-300/80 mt-2">Compete with AI-generated tracks and win prizes</p>
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

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/60 border border-green-500/20 mb-8">
            <TabsTrigger
              value="active"
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              <Flame className="w-4 h-4 mr-2" />
              Active Contests
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              <Timer className="w-4 h-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger
              value="ended"
              className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
            >
              <Award className="w-4 h-4 mr-2" />
              Past Winners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="space-y-8">
              {contests
                .filter((c) => c.status === "active")
                .map((contest) => (
                  <Card
                    key={contest.id}
                    className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 shadow-xl shadow-yellow-500/10"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-yellow-300 text-2xl flex items-center gap-2">
                            {contest.title}
                            <Badge variant="outline" className={getStatusColor(contest.status)}>
                              {getStatusIcon(contest.status)}
                              {contest.status.toUpperCase()}
                            </Badge>
                          </CardTitle>
                          <p className="text-green-300/80 mt-2">{contest.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-yellow-400">${contest.prizePool}</div>
                          <div className="text-sm text-yellow-300/60">Prize Pool</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Contest Info */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                          <Users className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                          <div className="text-lg font-bold text-yellow-300">{contest.participants}</div>
                          <div className="text-xs text-yellow-400/60">Participants</div>
                          <Progress
                            value={(contest.participants / contest.maxParticipants) * 100}
                            className="mt-2 h-2"
                          />
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                          <Calendar className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                          <div className="text-lg font-bold text-yellow-300">{contest.timeLeft}</div>
                          <div className="text-xs text-yellow-400/60">Time Left</div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                          <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                          <div className="text-lg font-bold text-yellow-300">{contest.theme}</div>
                          <div className="text-xs text-yellow-400/60">Theme</div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                          <Button
                            onClick={() => handleJoinContest(contest.id)}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Join Contest
                          </Button>
                        </div>
                      </div>

                      {/* Top Entries */}
                      <div>
                        <h3 className="text-xl font-semibold text-yellow-300 mb-4 flex items-center gap-2">
                          <Trophy className="w-5 h-5" />
                          Top Entries
                        </h3>
                        <div className="space-y-3">
                          {contest.entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-center justify-between p-4 bg-black/60 border border-yellow-500/20 rounded-lg hover:border-yellow-400/40 transition-all"
                            >
                              <div className="flex items-center gap-4">
                                {getRankIcon(entry.rank)}
                                <div>
                                  <h4 className="font-semibold text-yellow-100">{entry.title}</h4>
                                  <p className="text-yellow-400/80 text-sm">by {entry.artist}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-yellow-400/60">{entry.votes} votes</span>
                                    {entry.rank <= 3 && (
                                      <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 text-xs">
                                        Top 3
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => handlePlayPause(entry.id, entry.audioUrl)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-yellow-300 hover:text-yellow-100 hover:bg-yellow-500/10"
                                >
                                  {isPlaying === entry.id ? (
                                    <Pause className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4" />
                                  )}
                                </Button>

                                <Button
                                  onClick={() => handleVote(entry.id)}
                                  variant="ghost"
                                  size="sm"
                                  className={`${
                                    votedEntries.has(entry.id)
                                      ? "text-red-400 hover:text-red-300"
                                      : "text-yellow-300 hover:text-yellow-100"
                                  } hover:bg-yellow-500/10`}
                                >
                                  <Heart className={`w-4 h-4 ${votedEntries.has(entry.id) ? "fill-current" : ""}`} />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-yellow-300 hover:text-yellow-100 hover:bg-yellow-500/10"
                                >
                                  <Share2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming">
            <div className="space-y-6">
              {contests
                .filter((c) => c.status === "upcoming")
                .map((contest) => (
                  <Card
                    key={contest.id}
                    className="bg-black/80 backdrop-blur-sm border border-blue-500/30 shadow-xl shadow-blue-500/10"
                  >
                    <CardHeader>
                      <CardTitle className="text-blue-300 text-2xl flex items-center gap-2">
                        {contest.title}
                        <Badge variant="outline" className={getStatusColor(contest.status)}>
                          {getStatusIcon(contest.status)}
                          UPCOMING
                        </Badge>
                      </CardTitle>
                      <p className="text-green-300/80">{contest.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                          <DollarSign className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                          <div className="text-lg font-bold text-blue-300">${contest.prizePool}</div>
                          <div className="text-xs text-blue-400/60">Prize Pool</div>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                          <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                          <div className="text-lg font-bold text-blue-300">{contest.timeLeft}</div>
                          <div className="text-xs text-blue-400/60">Starts In</div>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                          <Star className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                          <div className="text-lg font-bold text-blue-300">{contest.theme}</div>
                          <div className="text-xs text-blue-400/60">Theme</div>
                        </div>
                      </div>
                      <Button disabled className="w-full mt-4 bg-blue-500/20 text-blue-300 cursor-not-allowed">
                        <Timer className="w-4 h-4 mr-2" />
                        Contest Not Started
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="ended">
            <div className="space-y-6">
              {contests
                .filter((c) => c.status === "ended")
                .map((contest) => (
                  <Card
                    key={contest.id}
                    className="bg-black/80 backdrop-blur-sm border border-gray-500/30 shadow-xl shadow-gray-500/10"
                  >
                    <CardHeader>
                      <CardTitle className="text-gray-300 text-2xl flex items-center gap-2">
                        {contest.title}
                        <Badge variant="outline" className={getStatusColor(contest.status)}>
                          {getStatusIcon(contest.status)}
                          ENDED
                        </Badge>
                      </CardTitle>
                      <p className="text-green-300/80">{contest.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400 mb-2">🏆 Winners</div>
                        </div>
                        {contest.entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-4 bg-black/60 border border-gray-500/20 rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              {getRankIcon(entry.rank)}
                              <div>
                                <h4 className="font-semibold text-gray-100">{entry.title}</h4>
                                <p className="text-gray-400/80 text-sm">by {entry.artist}</p>
                                <div className="text-xs text-gray-400/60">{entry.votes} votes</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handlePlayPause(entry.id, entry.audioUrl)}
                                variant="ghost"
                                size="sm"
                                className="text-gray-300 hover:text-gray-100 hover:bg-gray-500/10"
                              >
                                {isPlaying === entry.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </Button>
                              <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                                Winner
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
