// Minimal error handler hook for compatibility
import { useState } from "react"

export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null)
  return { error, setError }
}
