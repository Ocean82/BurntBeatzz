interface RateLimiterOptions {
  max: number
  windowMs: string
}

export const createRateLimiter = ({ max, windowMs }: RateLimiterOptions) => {
  const parseWindow = (window: string): number => {
    const [value, unit] = window.split(" ")
    const num = Number.parseInt(value, 10)

    switch (unit) {
      case "second":
      case "seconds":
        return num * 1000
      case "minute":
      case "minutes":
        return num * 60 * 1000
      case "hour":
      case "hours":
        return num * 60 * 60 * 1000
      default:
        return 60 * 1000 // Default to 1 minute
    }
  }

  const windowDuration = parseWindow(windowMs)
  const requests = new Map<string, { count: number; resetTime: number }>()

  return (req: any, res: any, next: any) => {
    const clientId = req.ip || req.connection.remoteAddress || "unknown"
    const now = Date.now()

    const clientData = requests.get(clientId)

    if (!clientData || now > clientData.resetTime) {
      requests.set(clientId, {
        count: 1,
        resetTime: now + windowDuration,
      })
      return next()
    }

    if (clientData.count >= max) {
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: `${Math.ceil((clientData.resetTime - now) / 1000)} seconds`,
        timestamp: new Date().toISOString(),
      })
    }

    clientData.count++
    next()
  }
}

// Pre-configured rate limiters for different endpoints
export const musicGenerationRateLimit = createRateLimiter({ max: 5, windowMs: "1 hour" })
export const generalRateLimit = createRateLimiter({ max: 100, windowMs: "15 minutes" })
export const authRateLimit = createRateLimiter({ max: 10, windowMs: "15 minutes" })
