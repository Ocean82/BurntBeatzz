// Parse whitelisted IPs
const parseWhitelistedIps = (ips?: string): string[] => {
  if (!ips) return []
  return ips.split(",").map((ip) => ip.trim())
}

// Configuration object
export const env = {
  // Core
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_VERSION: process.env.APP_VERSION || "1.0.0",
  PORT: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 5000,

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  STRIPE_WHITELISTED_IPS: parseWhitelistedIps(process.env.STRIPE_WHITELISTED_IPS),

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || "burnt-beats-secret-key",

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  // Support
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "support@burnt-beats.com",

  // Security
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== "false",
  IP_FILTER_ENABLED: process.env.IP_FILTER_ENABLED !== "false",
}

// Type-safe environment export
export type EnvConfig = typeof env
export default env
