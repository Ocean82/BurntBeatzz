import {
  pgTable,
  text,
  varchar,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import type { z } from "zod"

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
)

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  plan: text("plan").notNull().default("free"), // free, basic, pro, enterprise
  planExpiresAt: timestamp("plan_expires_at"),
  songsThisMonth: integer("songs_this_month").default(0).notNull(),
  monthlyLimit: integer("monthly_limit").default(2).notNull(), // free: 2, basic: 4, pro: 50, enterprise: unlimited
  lastUsageReset: timestamp("last_usage_reset").defaultNow(),
  credits: integer("credits").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Vocal sample bank - shared samples for all users
export const vocalSampleBank = pgTable("vocal_sample_bank", {
  id: serial("id").primaryKey(),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  anonymousName: text("anonymous_name").notNull(), // e.g., "Midnight Voice", "Golden Tone"
  filePath: text("file_path").notNull(),
  gsUrl: text("gs_url").notNull(),
  publicUrl: text("public_url").notNull(),
  duration: integer("duration"), // in seconds
  sampleRate: integer("sample_rate").default(44100),
  characteristics: jsonb("characteristics"), // Voice analysis data
  isApproved: boolean("is_approved").default(false), // Admin approval required
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  quality: text("quality").default("good"), // poor, good, excellent
  tags: jsonb("tags"), // Array of tags like ["male", "deep", "rock"]
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
})

export const voiceSamples = pgTable("voice_samples", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  filePath: text("file_path").notNull(),
  duration: integer("duration"), // in seconds
  voiceType: text("voice_type").notNull().default("custom"), // custom, text-reader
  isProcessed: boolean("is_processed").default(false),
  submittedToBank: boolean("submitted_to_bank").default(false), // Track if submitted to shared bank
  createdAt: timestamp("created_at").defaultNow(),
})

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  lyrics: text("lyrics").notNull(),
  genre: text("genre").notNull(),
  vocalStyle: text("vocal_style").notNull(),
  singingStyle: text("singing_style"), // smooth, powerful, emotional, etc.
  mood: text("mood"), // happy, sad, energetic, calm, etc.
  tone: text("tone"), // warm, bright, deep, light, etc.
  tempo: integer("tempo").notNull(),
  songLength: text("song_length").notNull(),
  voiceSampleId: integer("voice_sample_id").references(() => voiceSamples.id),
  bankVoiceId: integer("bank_voice_id").references(() => vocalSampleBank.id), // Reference to shared bank
  generatedAudioPath: text("generated_audio_path"),
  status: text("status").notNull().default("pending"), // pending, generating, completed, failed
  generationProgress: integer("generation_progress").default(0),
  sections: jsonb("sections"), // Array of song sections with timestamps
  settings: jsonb("settings"), // Advanced settings like intro/outro, harmonies, etc.
  planRestricted: boolean("plan_restricted").default(false), // true for free plan limitations
  playCount: integer("play_count").default(0),
  likes: integer("likes").default(0),
  rating: doublePrecision("rating").default(4.0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const songVersions = pgTable("song_versions", {
  id: serial("id").primaryKey(),
  songId: integer("song_id").references(() => songs.id),
  versionNumber: text("version_number").notNull(),
  title: text("title").notNull(),
  commitMessage: text("commit_message").notNull(),
  changes: jsonb("changes").notNull(),
  createdBy: text("created_by").notNull(),
  isActive: boolean("is_active").default(false),
  size: doublePrecision("size").default(0),
  createdAt: timestamp("created_at").defaultNow(),
})

// Type exports
export type UpsertUser = typeof users.$inferInsert
export type User = typeof users.$inferSelect

export const insertVoiceSampleSchema = createInsertSchema(voiceSamples).omit({
  id: true,
  createdAt: true,
})

export const insertSongSchema = createInsertSchema(songs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const insertVocalBankSchema = createInsertSchema(vocalSampleBank).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
})

export type InsertVoiceSample = z.infer<typeof insertVoiceSampleSchema>
export type VoiceSample = typeof voiceSamples.$inferSelect

export type InsertSong = z.infer<typeof insertSongSchema>
export type Song = typeof songs.$inferSelect

export type InsertVocalBank = z.infer<typeof insertVocalBankSchema>
export type VocalBankSample = typeof vocalSampleBank.$inferSelect
