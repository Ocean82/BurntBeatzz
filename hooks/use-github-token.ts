"use client"

import { useState, useEffect, useCallback } from "react"

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

export function useGitHubToken() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [rateLimit, setRateLimit] = useState<GitHubRateLimit | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [lastValidation, setLastValidation] = useState<Date | null>(null)

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("github_token")
    if (savedToken) {
      setToken(savedToken)
      validateToken(savedToken)
    }
  }, [])

  const validateToken = useCallback(
    async (tokenToValidate?: string) => {
      const testToken = tokenToValidate || token
      if (!testToken) return null

      setIsValidating(true)
      try {
        const response = await fetch("/api/github/validate-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: testToken }),
        })

        const result: TokenValidationResult = await response.json()

        if (result.valid) {
          setUser(result.user || null)
          setRateLimit(result.rateLimit || null)
          setLastValidation(new Date())
        } else {
          setUser(null)
          setRateLimit(null)
        }

        return result
      } catch (error) {
        console.error("Token validation error:", error)
        return {
          valid: false,
          error: "Failed to validate token",
        }
      } finally {
        setIsValidating(false)
      }
    },
    [token],
  )

  const saveToken = useCallback(
    (newToken: string) => {
      localStorage.setItem("github_token", newToken)
      setToken(newToken)
      validateToken(newToken)
    },
    [validateToken],
  )

  const removeToken = useCallback(() => {
    localStorage.removeItem("github_token")
    setToken(null)
    setUser(null)
    setRateLimit(null)
    setLastValidation(null)
  }, [])

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Burnt-Beats-MIDI-Loader/1.0",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    return headers
  }, [token])

  const isRateLimited = useCallback(() => {
    if (!rateLimit) return false
    return rateLimit.remaining <= 0 && Date.now() < rateLimit.reset * 1000
  }, [rateLimit])

  const getRateLimitStatus = useCallback(() => {
    if (!rateLimit) {
      return {
        remaining: token ? "Unknown" : "60",
        limit: token ? "5000" : "60",
        percentage: token ? 100 : 16.67,
        resetTime: null,
        resetIn: null,
      }
    }

    const percentage = (rateLimit.remaining / rateLimit.limit) * 100
    const resetTime = new Date(rateLimit.reset * 1000)
    const resetIn = Math.max(0, resetTime.getTime() - Date.now())

    return {
      remaining: rateLimit.remaining.toString(),
      limit: rateLimit.limit.toString(),
      percentage,
      resetTime,
      resetIn,
    }
  }, [rateLimit, token])

  const refreshRateLimit = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch("https://api.github.com/rate_limit", {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setRateLimit(data.rate)
      }
    } catch (error) {
      console.error("Failed to refresh rate limit:", error)
    }
  }, [token, getAuthHeaders])

  return {
    // State
    token,
    user,
    rateLimit,
    isValidating,
    lastValidation,
    hasToken: !!token,

    // Actions
    validateToken,
    saveToken,
    removeToken,
    refreshRateLimit,

    // Utilities
    getAuthHeaders,
    isRateLimited,
    getRateLimitStatus,
  }
}
