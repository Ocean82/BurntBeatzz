<<<<<<< HEAD
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
=======
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { users, songs, voiceSamples, songVersions } from "@shared/schema"

// Database connection
const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required")
}

// Create the connection
const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Create drizzle instance
export const db = drizzle(client, {
  schema: {
    users,
    songs,
    voiceSamples,
    songVersions,
  },
})

// Connection health check
export async function checkDatabaseConnection() {
  try {
    await client`SELECT 1`
    console.log("✅ Database connected successfully")
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Check if tables exist and create if needed
    await client`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY,
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        plan TEXT NOT NULL DEFAULT 'free',
        plan_expires_at TIMESTAMP,
        songs_this_month INTEGER DEFAULT 0,
        monthly_limit INTEGER DEFAULT 2,
        last_usage_reset TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    await client`
      CREATE TABLE IF NOT EXISTS voice_samples (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR REFERENCES users(id),
        name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        duration INTEGER,
        voice_type TEXT DEFAULT 'custom',
        is_processed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    await client`
      CREATE TABLE IF NOT EXISTS songs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR REFERENCES users(id),
        title TEXT NOT NULL,
        lyrics TEXT NOT NULL,
        genre TEXT NOT NULL,
        vocal_style TEXT NOT NULL,
        singing_style TEXT,
        mood TEXT,
        tone TEXT,
        tempo INTEGER NOT NULL,
        song_length TEXT NOT NULL,
        voice_sample_id INTEGER REFERENCES voice_samples(id),
        generated_audio_path TEXT,
        status TEXT DEFAULT 'pending',
        generation_progress INTEGER DEFAULT 0,
        sections JSONB,
        settings JSONB,
        plan_restricted BOOLEAN DEFAULT false,
        play_count INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        rating DOUBLE PRECISION DEFAULT 4.0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    console.log("✅ Database tables initialized")
    return true
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    return false
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
  }
}
