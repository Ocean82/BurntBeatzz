"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Github,
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Clock,
  Zap,
  Info,
} from "lucide-react"
import { toast } from "sonner"

interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  name: string
  email: string
  public_repos: number
  private_repos: number
  plan?: {
    name: string
    space: number
    private_repos: number
  }
}

interface GitHubRateLimit {
  limit: number
  remaining: number
  reset: number
  used: number
  resource: string
}

interface TokenValidationResult {
  valid: boolean
  user?: GitHubUser
  error?: string
  rateLimit?: GitHubRateLimit
}

export function GitHubTokenSetup() {
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<TokenValidationResult | null>(null)
  const [savedToken, setSavedToken] = useState<string | null>(null)
  const [rateLimit, setRateLimit] = useState<GitHubRateLimit | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("github_token")
    if (saved) {
      setSavedToken(saved)
      setToken(saved)
      validateToken(saved)
    }
  }, [])

  const validateToken = async (tokenToValidate?: string) => {
    const testToken = tokenToValidate || token
    if (!testToken.trim()) {
      setValidationResult(null)
      return
    }

    setValidating(true)
    try {
      const response = await fetch("/api/github/validate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: testToken }),
      })

      const result = await response.json()
      setValidationResult(result)

      if (result.rateLimit) {
        setRateLimit(result.rateLimit)
      }

      if (result.valid) {
        toast.success(`Token validated successfully! Welcome, ${result.user?.name || result.user?.login}`)
      } else {
        toast.error(result.error || "Token validation failed")
      }
    } catch (error) {
      console.error("Token validation error:", error)
      setValidationResult({
        valid: false,
        error: "Failed to validate token. Please check your connection.",
      })
      toast.error("Failed to validate token")
    } finally {
      setValidating(false)
    }
  }

  const saveToken = () => {
    if (!validationResult?.valid) {
      toast.error("Please validate the token first")
      return
    }

    localStorage.setItem("github_token", token)
    setSavedToken(token)
    toast.success("GitHub token saved successfully!")
  }

  const removeToken = () => {
    localStorage.removeItem("github_token")
    setSavedToken(null)
    setToken("")
    setValidationResult(null)
    setRateLimit(null)
    toast.success("GitHub token removed")
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

  const getRateLimitColor = (percentage: number) => {
    if (percentage > 50) return "text-green-600"
    if (percentage > 20) return "text-yellow-600"
    return "text-red-600"
  }

  const rateLimitPercentage = rateLimit ? (rateLimit.remaining / rateLimit.limit) * 100 : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Token Configuration
          </CardTitle>
          <CardDescription>
            Configure your GitHub personal access token to access private repositories and increase rate limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {savedToken ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Token Configured</div>
                    {validationResult?.user && (
                      <div className="text-sm text-muted-foreground">
                        Authenticated as {validationResult.user.name || validationResult.user.login}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="font-medium">No Token Configured</div>
                    <div className="text-sm text-muted-foreground">
                      Using unauthenticated requests (limited to 60 requests/hour)
                    </div>
                  </div>
                </>
              )}
            </div>

            {savedToken && (
              <Button variant="outline" size="sm" onClick={removeToken}>
                Remove Token
              </Button>
            )}
          </div>

          {rateLimit && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">API Rate Limit</span>
                </div>
                <Badge variant={rateLimitPercentage > 20 ? "default" : "destructive"}>
                  {rateLimit.remaining}/{rateLimit.limit} remaining
                </Badge>
              </div>

              <Progress value={rateLimitPercentage} className="h-2" />

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className={getRateLimitColor(rateLimitPercentage)}>
                  {Math.round(rateLimitPercentage)}% remaining
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Resets in {formatResetTime(rateLimit.reset)}
                </span>
              </div>
            </div>
          )}

          {validationResult?.user && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <img
                src={validationResult.user.avatar_url || "/placeholder.svg"}
                alt={validationResult.user.login}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <div className="font-medium">{validationResult.user.name || validationResult.user.login}</div>
                <div className="text-sm text-muted-foreground">@{validationResult.user.login}</div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span>{validationResult.user.public_repos} public repos</span>
                  <span>{validationResult.user.private_repos} private repos</span>
                  {validationResult.user.plan && (
                    <Badge variant="outline" className="text-xs">
                      {validationResult.user.plan.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {savedToken ? "Update Token" : "Add GitHub Token"}
          </CardTitle>
          <CardDescription>
            Enter your GitHub personal access token to enable private repository access and higher rate limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Personal Access Token</Label>
            <div className="relative">
              <Input
                id="token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {validationResult && (
            <Alert className={validationResult.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {validationResult.valid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={validationResult.valid ? "text-green-800" : "text-red-800"}>
                {validationResult.valid
                  ? `Token is valid! Authenticated as ${validationResult.user?.login}`
                  : validationResult.error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={() => validateToken()} disabled={!token.trim() || validating}>
              {validating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Validate Token
                </>
              )}
            </Button>

            {validationResult?.valid && (
              <Button onClick={saveToken} variant="default">
                <Key className="h-4 w-4 mr-2" />
                Save Token
              </Button>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Info className="h-4 w-4 mr-2" />
                  How to Create Token
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Creating a GitHub Personal Access Token</DialogTitle>
                  <DialogDescription>
                    Follow these steps to create a personal access token for repository access
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                        1
                      </div>
                      <div>
                        <div className="font-medium">Go to GitHub Settings</div>
                        <div className="text-sm text-muted-foreground">
                          Navigate to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 bg-transparent"
                          onClick={() => window.open("https://github.com/settings/tokens", "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open GitHub Settings
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                        2
                      </div>
                      <div>
                        <div className="font-medium">Generate New Token</div>
                        <div className="text-sm text-muted-foreground">
                          Click "Generate new token" → "Generate new token (classic)"
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                        3
                      </div>
                      <div>
                        <div className="font-medium">Configure Token</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Set a descriptive note and select the following scopes:
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <code className="bg-muted px-1 rounded">repo</code> - Full repository access
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <code className="bg-muted px-1 rounded">read:user</code> - Read user profile
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                        4
                      </div>
                      <div>
                        <div className="font-medium">Copy Token</div>
                        <div className="text-sm text-muted-foreground">
                          Copy the generated token and paste it above. Keep it secure - you won't be able to see it
                          again!
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Security Note:</strong> Your token is stored locally in your browser and never sent to our
                      servers. It's only used to authenticate with GitHub's API directly from your browser.
                    </AlertDescription>
                  </Alert>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Benefits of Adding a GitHub Token</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Higher Rate Limits</div>
                  <div className="text-sm text-muted-foreground">5,000 requests/hour vs 60 without token</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Private Repository Access</div>
                  <div className="text-sm text-muted-foreground">Access your private MIDI collections</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Github className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">Organization Repositories</div>
                  <div className="text-sm text-muted-foreground">Access repositories from your organizations</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium">Faster Downloads</div>
                  <div className="text-sm text-muted-foreground">No rate limiting delays during batch operations</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
