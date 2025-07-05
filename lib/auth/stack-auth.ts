import { StackServerApp } from "@stackframe/stack"

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    afterSignIn: "/dashboard",
    afterSignUp: "/onboarding",
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
  }
}
