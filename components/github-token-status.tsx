"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Github, Zap, Clock, Settings, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface GitHubRateLimit {
  limit: number
  remaining: number
  reset: number
  used: number
  resource: string
}

interface GitHubTokenStatusProps {
  onOpenSettings?: () => void
}

export function GitHubTokenStatus({ onOpenSettings }: GitHubTokenStatusProps) {
  const [hasToken, setHasToken] = useState(false)
  const [rateLimit, setRateLimit] = useState<GitHubRateLimit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkTokenStatus()
  }, [])

  const checkTokenStatus = async () => {
    setLoading(true)
    try {
      const savedToken = localStorage.getItem("github_token")
      setHasToken(!!savedToken)

      if (savedToken) {
        // Validate token and get rate limit
        const response = await fetch("/api/github/validate-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: savedToken }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.valid && result.rateLimit) {
            setRateLimit(result.rateLimit)
          }
        }
      }
    } catch (error) {
      console.error("Error checking token status:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatResetTime = (resetTimestamp: number) => {
    const resetTime = new Date(resetTimestamp * 1000)
    const now = new Date()
    const diffMs = resetTime.getTime() - now.getTime()
    const diffMins = Math.ceil(diffMs / (1000 * 60))

    if (diffMins <= 0) return "Now"
    if (diffMins < 60) return `${diffMins}m`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m`
  }

  const getRateLimitStatus = () => {
    if (!rateLimit) {
      return {
        percentage: hasToken ? 100 : 16.67, // 60/3600 for unauthenticated
        color: hasToken ? "bg-green-500" : "bg-red-500",
        status: hasToken ? "unknown" : "limited",
        remaining: hasToken ? "Unknown" : "60",
        limit: hasToken ? "5000" : "60",
      }
    }

    const percentage = (rateLimit.remaining / rateLimit.limit) * 100
    let color = "bg-green-500"
    let status = "good"

    if (percentage < 20) {
      color = "bg-red-500"
      status = "critical"
    } else if (percentage < 50) {
      color = "bg-yellow-500"
      status = "warning"
    }

    return {
      percentage,
      color,
      status,
      remaining: rateLimit.remaining.toString(),
      limit: rateLimit.limit.toString(),
    }
  }

  const rateLimitStatus = getRateLimitStatus()

  if (loading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <Github className="h-3 w-3 mr-1" />
        Loading...
      </Badge>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <div className="flex items-center gap-2">
            {hasToken ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <Github className="h-4 w-4" />
            <Badge variant={rateLimitStatus.status === "critical" ? "destructive" : "secondary"} className="text-xs">
              {rateLimitStatus.remaining}/{rateLimitStatus.limit}
            </Badge>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Card className="border-0 shadow-none">
          <CardContent className="p-0 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                <span className="font-medium">GitHub API Status</span>
              </div>
              <Button variant="outline" size="sm" onClick={onOpenSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>

            {/* Token Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Authentication</span>
                <Badge variant={hasToken ? "default" : "destructive"}>
                  {hasToken ? "Configured" : "Not Configured"}
                </Badge>
              </div>

              {!hasToken && (
                <div className="text-xs text-muted-foreground">
                  Using unauthenticated requests with limited rate limits
                </div>
              )}
            </div>

            {/* Rate Limit */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">Rate Limit</span>
                </div>
                <Badge variant={rateLimitStatus.status === "critical" ? "destructive" : "secondary"}>
                  {rateLimitStatus.remaining}/{rateLimitStatus.limit}
                </Badge>
              </div>

              <div className="space-y-2">
                <Progress value={rateLimitStatus.percentage} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{Math.round(rateLimitStatus.percentage)}% remaining</span>
                  {rateLimit && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Resets in {formatResetTime(rateLimit.reset)}
                    </span>
                  )}
                </div>
              </div>

              {rateLimitStatus.status === "critical" && (
                <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="text-xs text-red-700">
                    Rate limit nearly exhausted. Consider waiting or adding a GitHub token for higher limits.
                  </div>
                </div>
              )}
            </div>

            {/* Benefits */}
            {!hasToken && (
              <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm font-medium text-blue-900">Add GitHub Token for:</div>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 5,000 requests/hour (vs 60)</li>
                  <li>• Private repository access</li>
                  <li>• Organization repositories</li>
                  <li>• Faster batch downloads</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
