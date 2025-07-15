import { type NextRequest, NextResponse } from "next/server"
import { stackAuth } from "@/lib/auth/stack-auth"

export async function requireAuth(request: NextRequest) {
  try {
    const user = await stackAuth.getUser(request)

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    return { user, error: null }
  } catch (error) {
    console.error("Auth middleware error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }
}

export async function requireAdmin(request: NextRequest) {
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  // Check if user is admin (implement your admin logic)
  const isAdmin = user.email?.endsWith("@burntbeats.com") || user.id === "admin-user-id"

  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  return { user, error: null }
}
