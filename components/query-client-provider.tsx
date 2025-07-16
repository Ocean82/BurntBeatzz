"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useState } from "react"

/**
 * Provides a React-Query client for the entire app.
 * Keeps a single QueryClient instance alive for the life of the session.
 */
export default function QueryClientProviderWrapper({
  children,
}: {
  children: ReactNode
}) {
  // Lazily create the client once per session
  const [client] = useState(() => new QueryClient())

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

// Optional named export so it can be imported two ways.
export { QueryClientProviderWrapper as QueryProvider }
