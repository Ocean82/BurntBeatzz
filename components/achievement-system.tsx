"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star, Zap, Music, Users, Crown, Gift, Target } from "lucide-react"

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: "creation" | "social" | "technical" | "milestone"
  rarity: "common" | "rare" | "epic" | "legendary"
  points: number
  progress: number
  maxProgress: number
  isUnlocked: boolean
  unlockedAt?: Date
  reward?: {
    type: "credits" | "badge" | "feature" | "discount"
    value: string | number
  }
}

interface UserStats {
  level: number
  totalPoints: number
  pointsToNextLevel: number
  songsCreated: number
  collaborations: number
  totalPlays: number
  totalLikes: number
  streak: number
  rank: string
}

export function AchievementSystem({ userId }: { userId: string }) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showRewardModal, setShowRewardModal] = useState<Achievement | null>(null)

  useEffect(() => {
    loadAchievements()
    loadUserStats()
  }, [userId])

  const loadAchievements = () => {
    const mockAchievements: Achievement[] = [
      {
        id: "first-song",
        title: "First Fire Track",
        description: "Create your first song",
        icon: "🎵",
        category: "creation",
        rarity: "common",
        points: 100,
        progress: 1,
        maxProgress: 1,
        isUnlocked: true,
        unlockedAt: new Date(),
        reward: { type: "credits", value: 50 },
      },
      {
        id: "beat-master",
        title: "Beat Master",
        description: "Create 10 songs",
        icon: "🥁",
        category: "creation",
        rarity: "rare",
        points: 500,
        progress: 7,
        maxProgress: 10,
        isUnlocked: false,
      },
      {
        id: "viral-hit",
        title: "Viral Hit",
        description: "Get 1000 plays on a single track",
        icon: "🔥",
        category: "social",
        rarity: "epic",
        points: 1000,
        progress: 650,
        maxProgress: 1000,
        isUnlocked: false,
      },
      {
        id: "collaboration-king",
        title: "Collaboration King",
        description: "Collaborate on 5 different projects",
        icon: "👑",
        category: "social",
        rarity: "rare",
        points: 750,
        progress: 3,
        maxProgress: 5,
        isUnlocked: false,
      },
      {
        id: "ai-whisperer",
        title: "AI Whisperer",
        description: "Use voice cloning 25 times",
        icon: "🤖",
        category: "technical",
        rarity: "epic",
        points: 1200,
        progress: 18,
        maxProgress: 25,
        isUnlocked: false,
      },
      {
        id: "legend",
        title: "Burnt Beats Legend",
        description: "Reach level 50",
        icon: "🏆",
        category: "milestone",
        rarity: "legendary",
        points: 5000,
        progress: 12,
        maxProgress: 50,
        isUnlocked: false,
        reward: { type: "feature", value: "Lifetime Premium" },
      },
    ]

    setAchievements(mockAchievements)
  }

  const loadUserStats = () => {
    const mockStats: UserStats = {
      level: 12,
      totalPoints: 3450,
      pointsToNextLevel: 550,
      songsCreated: 7,
      collaborations: 3,
      totalPlays: 2847,
      totalLikes: 156,
      streak: 5,
      rank: "Fire Producer",
    }

    setUserStats(mockStats)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "border-gray-400 text-gray-400"
      case "rare":
        return "border-blue-400 text-blue-400"
      case "epic":
        return "border-purple-400 text-purple-400"
      case "legendary":
        return "border-yellow-400 text-yellow-400"
      default:
        return "border-gray-400 text-gray-400"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "creation":
        return <Music className="w-4 h-4" />
      case "social":
        return <Users className="w-4 h-4" />
      case "technical":
        return <Zap className="w-4 h-4" />
      case "milestone":
        return <Crown className="w-4 h-4" />
      default:
        return <Star className="w-4 h-4" />
    }
  }

  const filteredAchievements = achievements.filter(
    (achievement) => selectedCategory === "all" || achievement.category === selectedCategory,
  )

  const categories = [
    { id: "all", label: "All", icon: <Star className="w-4 h-4" /> },
    { id: "creation", label: "Creation", icon: <Music className="w-4 h-4" /> },
    { id: "social", label: "Social", icon: <Users className="w-4 h-4" /> },
    { id: "technical", label: "Technical", icon: <Zap className="w-4 h-4" /> },
    { id: "milestone", label: "Milestones", icon: <Crown className="w-4 h-4" /> },
  ]

  if (!userStats) return null

  return (
    <div className="space-y-6">
      {/* User Level & Stats */}
      <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-yellow-300 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Level {userStats.level} - {userStats.rank}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Level Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-yellow-300">Progress to Level {userStats.level + 1}</span>
                <span className="text-yellow-400">{userStats.pointsToNextLevel} points needed</span>
              </div>
              <Progress value={((4000 - userStats.pointsToNextLevel) / 4000) * 100} className="h-3 bg-black/40" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-300">{userStats.totalPoints.toLocaleString()}</div>
                <div className="text-yellow-400/60 text-sm">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-300">{userStats.songsCreated}</div>
                <div className="text-yellow-400/60 text-sm">Songs Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-300">{userStats.totalPlays.toLocaleString()}</div>
                <div className="text-yellow-400/60 text-sm">Total Plays</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-300">{userStats.streak}</div>
                <div className="text-yellow-400/60 text-sm">Day Streak</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Categories */}
      <Card className="bg-black/80 border-green-500/30">
        <CardHeader>
          <CardTitle className="text-green-300">Achievements</CardTitle>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={
                  selectedCategory === category.id
                    ? "bg-green-500 text-white"
                    : "border-green-500/30 text-green-300 hover:bg-green-500/10"
                }
              >
                {category.icon}
                <span className="ml-1">{category.label}</span>
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border transition-all ${
                  achievement.isUnlocked
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-black/40 border-gray-500/30 hover:border-green-500/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Achievement Icon */}
                  <div
                    className={`text-3xl p-2 rounded-lg ${
                      achievement.isUnlocked ? "bg-green-500/20" : "bg-gray-500/20 grayscale"
                    }`}
                  >
                    {achievement.icon}
                  </div>

                  {/* Achievement Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${achievement.isUnlocked ? "text-green-100" : "text-gray-300"}`}>
                        {achievement.title}
                      </h3>
                      <Badge variant="outline" className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </Badge>
                    </div>

                    <p className={`text-sm mb-2 ${achievement.isUnlocked ? "text-green-300" : "text-gray-400"}`}>
                      {achievement.description}
                    </p>

                    {/* Progress */}
                    {!achievement.isUnlocked && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">
                            {achievement.progress} / {achievement.maxProgress}
                          </span>
                          <span className="text-green-400">{achievement.points} points</span>
                        </div>
                        <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                      </div>
                    )}

                    {/* Unlocked Info */}
                    {achievement.isUnlocked && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <Trophy className="w-3 h-3" />
                          <span>Unlocked {achievement.unlockedAt?.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <Star className="w-3 h-3" />
                          <span>{achievement.points} points</span>
                        </div>
                      </div>
                    )}

                    {/* Reward */}
                    {achievement.reward && achievement.isUnlocked && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
                        <Gift className="w-3 h-3" />
                        <span>
                          Reward:{" "}
                          {achievement.reward.type === "credits"
                            ? `${achievement.reward.value} credits`
                            : achievement.reward.value}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category Icon */}
                  <div className="text-gray-400">{getCategoryIcon(achievement.category)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Challenges */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-blue-300 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Daily Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
              <div>
                <h4 className="text-blue-100 font-medium">Upload a new song</h4>
                <p className="text-blue-300/60 text-sm">Share your creativity with the world</p>
              </div>
              <div className="text-right">
                <div className="text-blue-300 font-semibold">+200 XP</div>
                <Badge variant="outline" className="border-blue-400 text-blue-400 text-xs">
                  0/1
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
              <div>
                <h4 className="text-blue-100 font-medium">Like 5 community tracks</h4>
                <p className="text-blue-300/60 text-sm">Support fellow creators</p>
              </div>
              <div className="text-right">
                <div className="text-blue-300 font-semibold">+100 XP</div>
                <Badge variant="outline" className="border-green-400 text-green-400 text-xs">
                  5/5 ✓
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
              <div>
                <h4 className="text-blue-100 font-medium">Use AI voice cloning</h4>
                <p className="text-blue-300/60 text-sm">Experiment with voice synthesis</p>
              </div>
              <div className="text-right">
                <div className="text-blue-300 font-semibold">+150 XP</div>
                <Badge variant="outline" className="border-blue-400 text-blue-400 text-xs">
                  0/1
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
