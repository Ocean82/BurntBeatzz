<<<<<<< HEAD
import "server-only"
import { StackServerApp } from "@stackframe/stack"
import { env } from "../config/env"

if (!env.NEXT_PUBLIC_STACK_PROJECT_ID) {
  throw new Error("NEXT_PUBLIC_STACK_PROJECT_ID environment variable is required")
}

if (!env.STACK_SECRET_SERVER_KEY) {
  throw new Error("STACK_SECRET_SERVER_KEY environment variable is required")
}
=======
import { StackServerApp } from "@stackframe/stack"
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    afterSignIn: "/dashboard",
    afterSignUp: "/onboarding",
<<<<<<< HEAD
    afterSignOut: "/",
  },
})

export async function getCurrentUser() {
  try {
    const user = await stackServerApp.getUser()
    return user
  } catch (error) {
    console.error("Failed to get current user:", error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function getAuthStatus() {
  try {
    const user = await getCurrentUser()
    return {
      success: true,
      authenticated: !!user,
      user: user
        ? {
            id: user.id,
            email: user.primaryEmail,
            displayName: user.displayName,
          }
        : null,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Auth status check failed",
    }
=======
  },
})

// Auth middleware for API routes
export async function requireAuth(request: Request) {
  const user = await stackServerApp.getUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  return user
}

// Get current user safely
export async function getCurrentUser() {
  try {
    return await stackServerApp.getUser()
  } catch {
    return null
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
  }
}
