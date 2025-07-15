import "server-only"
import { env } from "./env"

interface GitHubConfig {
  token?: string
  apiUrl: string
  userAgent: string
  rateLimit: {
    remaining: number
    limit: number
    resetTime: number
  }
}

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

class GitHubConfigManager {
  private static instance: GitHubConfigManager
  private config: GitHubConfig

  private constructor() {
    this.config = {
      token: env.GITHUB_TOKEN,
      apiUrl: "https://api.github.com",
      userAgent: "Burnt-Beats-MIDI-Loader/1.0",
      rateLimit: {
        remaining: 5000,
        limit: 5000,
        resetTime: Date.now() + 3600000,
      },
    }

    if (this.config.token) {
      this.validateToken().then((result) => {
        if (result.valid) {
          console.log(`✅ GitHub token validated for user: ${result.user?.login}`)
          if (result.rateLimit) {
            this.updateRateLimit(result.rateLimit)
          }
        } else {
          console.warn(`⚠️ GitHub token validation failed: ${result.error}`)
        }
      })
    }
  }

  public static getInstance(): GitHubConfigManager {
    if (!GitHubConfigManager.instance) {
      GitHubConfigManager.instance = new GitHubConfigManager()
    }
    return GitHubConfigManager.instance
  }

  public getConfig(): GitHubConfig {
    return { ...this.config }
  }

  public setToken(token: string): void {
    this.config.token = token
  }

  public hasToken(): boolean {
    return !!this.config.token && this.config.token.length > 0
  }

  public getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": this.config.userAgent,
      "X-GitHub-Api-Version": "2022-11-28",
    }

    if (this.config.token) {
      headers["Authorization"] = `Bearer ${this.config.token}`
    }

    return headers
  }

  public updateRateLimit(rateLimit: GitHubRateLimit): void {
    this.config.rateLimit = {
      limit: rateLimit.limit,
      remaining: rateLimit.remaining,
      resetTime: rateLimit.reset * 1000,
    }
  }

  public async validateToken(token?: string): Promise<{
    valid: boolean
    user?: GitHubUser
    error?: string
    rateLimit?: GitHubRateLimit
  }> {
    const testToken = token || this.config.token

    if (!testToken) {
      return {
        valid: false,
        error: "No token provided",
      }
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/user`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) {
          return {
            valid: false,
            error: "Invalid token or token has expired",
          }
        }
        if (response.status === 403) {
          return {
            valid: false,
            error: "Token does not have sufficient permissions",
          }
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const user: GitHubUser = await response.json()

      const rateLimitResponse = await fetch(`${this.config.apiUrl}/rate_limit`, {
        headers: this.getHeaders(),
      })

      let rateLimit: GitHubRateLimit | undefined
      if (rateLimitResponse.ok) {
        const rateLimitData = await rateLimitResponse.json()
        rateLimit = rateLimitData.rate
        this.updateRateLimit(rateLimit)
      }

      return {
        valid: true,
        user,
        rateLimit,
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  public getRateLimitStatus(): {
    remaining: number
    limit: number
    resetTime: number
    resetIn: number
    percentage: number
  } {
    const now = Date.now()
    const resetIn = Math.max(0, this.config.rateLimit.resetTime - now)
    const percentage = (this.config.rateLimit.remaining / this.config.rateLimit.limit) * 100

    return {
      remaining: this.config.rateLimit.remaining,
      limit: this.config.rateLimit.limit,
      resetTime: this.config.rateLimit.resetTime,
      resetIn,
      percentage,
    }
  }

  public isRateLimited(): boolean {
    return this.config.rateLimit.remaining <= 0 && Date.now() < this.config.rateLimit.resetTime
  }

  public async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...this.getHeaders(),
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining")
    const rateLimitLimit = response.headers.get("x-ratelimit-limit")
    const rateLimitReset = response.headers.get("x-ratelimit-reset")

    if (rateLimitRemaining && rateLimitLimit && rateLimitReset) {
      this.config.rateLimit = {
        remaining: Number.parseInt(rateLimitRemaining),
        limit: Number.parseInt(rateLimitLimit),
        resetTime: Number.parseInt(rateLimitReset) * 1000,
      }
    }

    return response
  }
}

const githubConfig = GitHubConfigManager.getInstance()

export default githubConfig
