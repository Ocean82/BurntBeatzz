"use client"

import { useEffect, useState } from "react"
import { GitHubTokenSetup } from "@/components/github-token-setup"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Github, Zap } from "lucide-react"

interface GitHubUser {
  login: string
  name: string
  avatar_url: string
  public_repos: number
  private_repos: number
}

export default function GitHubSetupPage() {
  const [tokenStatus, setTokenStatus] = useState<{
    configured: boolean
    user?: GitHubUser
    rateLimit?: { remaining: number; limit: number }
  }>({ configured: false })

  useEffect(() => {
    checkPreConfiguredToken()
  }, [])

  const checkPreConfiguredToken = async () => {
    try {
      // Check if we have a pre-configured token
      const response = await fetch("/api/github/validate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "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",
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.valid) {
          setTokenStatus({
            configured: true,
            user: result.user,
            rateLimit: result.rateLimit,
          })

          // Save to localStorage for client-side components
          localStorage.setItem(
            "github_token",
            "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",
          )
        }
      }
    } catch (error) {
      console.error("Error checking pre-configured token:", error)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">GitHub Configuration</h1>
        <p className="text-muted-foreground">Manage your GitHub token for repository access and enhanced API limits</p>
      </div>

      {/* Pre-configured Status */}
      {tokenStatus.configured && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              GitHub Token Pre-Configured
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {tokenStatus.user?.avatar_url && (
                <img
                  src={tokenStatus.user.avatar_url || "/placeholder.svg"}
                  alt={tokenStatus.user.login}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <div className="font-medium text-green-800">{tokenStatus.user?.name || tokenStatus.user?.login}</div>
                <div className="text-sm text-green-600">@{tokenStatus.user?.login}</div>
                <div className="flex items-center gap-4 mt-1 text-xs text-green-600">
                  <span>{tokenStatus.user?.public_repos} public repos</span>
                  <span>{tokenStatus.user?.private_repos} private repos</span>
                </div>
              </div>
            </div>

            {tokenStatus.rateLimit && (
              <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Enhanced Rate Limits Active</span>
                </div>
                <Badge variant="outline" className="border-green-300 text-green-700">
                  {tokenStatus.rateLimit.remaining}/{tokenStatus.rateLimit.limit} requests remaining
                </Badge>
              </div>
            )}

            <div className="text-sm text-green-700">
              ✅ Your GitHub token is already configured and working! You have full access to:
              <ul className="mt-2 ml-4 space-y-1">
                <li>• Private repositories</li>
                <li>• Organization repositories</li>
                <li>• 5,000 API requests per hour</li>
                <li>• Faster MIDI file downloads</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Setup Component */}
      <GitHubTokenSetup />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Github className="h-5 w-5" />
                <span className="font-medium">Test Repository Access</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Test your token by accessing a sample repository</p>
              <button
                onClick={() => window.open("/midi-processor", "_blank")}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Open MIDI Processor →
              </button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5" />
                <span className="font-medium">Check Rate Limits</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Monitor your current API usage and limits</p>
              <button onClick={checkPreConfiguredToken} className="text-sm text-blue-600 hover:text-blue-800">
                Refresh Status →
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
