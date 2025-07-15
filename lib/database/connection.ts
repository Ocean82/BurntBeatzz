import { neon } from "@neondatabase/serverless"
import { env } from "../config/env"

// Validate database URL exists
if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

// Create SQL client using Neon
export const sql = neon(env.DATABASE_URL)

// Connection test function
export async function testDatabaseConnection() {
  try {
    const result = await sql`SELECT 1 as test, NOW() as timestamp`
    return {
      success: true,
      timestamp: result[0]?.timestamp,
      message: "Database connection successful",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown database error",
      message: "Database connection failed",
    }
  }
}

// Database health check
export async function getDatabaseHealth() {
  try {
    const startTime = Date.now()
    const result = await sql`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        version() as version,
        NOW() as timestamp
    `
    const responseTime = Date.now() - startTime

    return {
      success: true,
      data: result[0],
      responseTime: `${responseTime}ms`,
      provider: "Neon PostgreSQL",
    }
  } catch (error) {
    throw new Error(`Database health check failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
