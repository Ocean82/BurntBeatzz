import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/database/connection"
import { users } from "@/shared/schema"
import { eq } from "drizzle-orm"

const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be less than 20 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    password: z
      .string()
      .min(5, "Password must be at least 5 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/\d/, "Password must contain at least one number")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    agreedToTerms: z.boolean().refine((val) => val === true, "You must agree to the terms and conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Registration attempt:", { email: body.email, username: body.username })

    // Validate input
    const validatedData = registerSchema.parse(body)

    // Check if user already exists by email
    const existingUserByEmail = await db.select().from(users).where(eq(users.email, validatedData.email)).limit(1)

    if (existingUserByEmail.length > 0) {
      return NextResponse.json(
        {
          error: "User already exists",
          details: [{ field: "email", message: "Email is already registered" }],
        },
        { status: 400 },
      )
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds)

    // Generate unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create user in database with acknowledgement metadata
    const newUser = await db
      .insert(users)
      .values({
        id: userId,
        email: validatedData.email,
        firstName: validatedData.username, // Using username as firstName for now
        lastName: "",
        plan: "free",
        credits: 100, // Welcome bonus
        songsThisMonth: 0,
        monthlyLimit: 2,
        lastUsageReset: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    // Store acknowledgement metadata
    const acknowledgementData = {
      userId: userId,
      agreedToTerms: validatedData.agreedToTerms,
      agreementVersion: "2025-01",
      agreementText: "Burnt Beats Contributor Acknowledgment & Usage Agreement",
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      timestamp: new Date().toISOString(),
      termsAcceptedAt: new Date().toISOString(),
    }

    console.log("User created successfully:", {
      id: userId,
      email: validatedData.email,
      acknowledgement: acknowledgementData,
    })

    // In a real app, you'd store this acknowledgement data in a separate table
    // For now, we'll log it and could extend the users table to include this metadata

    // Send verification email (mock for now)
    console.log(`Verification email would be sent to: ${validatedData.email}`)

    // Return success (don't include sensitive data)
    return NextResponse.json({
      success: true,
      message: "Account created successfully! Welcome to Burnt Beats!",
      user: {
        id: userId,
        email: validatedData.email,
        username: validatedData.username,
        credits: 100,
        plan: "free",
        acknowledgement: {
          agreed: true,
          version: acknowledgementData.agreementVersion,
          timestamp: acknowledgementData.timestamp,
        },
      },
    })
  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error. Please try again later.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
