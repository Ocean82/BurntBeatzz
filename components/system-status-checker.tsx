"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Server,
  Database,
  Cloud,
  Shield,
  RefreshCw,
  Terminal,
  FileText,
} from "lucide-react"
import { toast } from "sonner"

interface SystemStatus {
  name: string
  status: "healthy" | "unhealthy" | "warning" | "checking"
  message: string
  details?: any
  lastChecked?: string
  responseTime?: string
}

export function SystemStatusChecker() {
  const [systems, setSystems] = useState<SystemStatus[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [overallHealth, setOverallHealth] = useState<"healthy" | "unhealthy" | "warning">("healthy")

  const systemChecks = [
    {
      name: "Application Health",
      endpoint: "/api/health",
      icon: Server,
      critical: true,
    },
    {
      name: "Database Connection",
      endpoint: "/api/health/database",
      icon: Database,
      critical: true,
    },
    {
      name: "Google Cloud Storage",
      endpoint: "/api/health/storage",
      icon: Cloud,
      critical: true,
    },
    {
      name: "GitHub API",
      endpoint: "/api/github/validate-token",
      icon: FileText,
      critical: false,
    },
    {
      name: "Stripe Integration",
      endpoint: "/api/health/stripe",
      icon: Shield,
      critical: false,
    },
    {
      name: "Authentication",
      endpoint: "/api/auth/status",
      icon: Shield,
      critical: true,
    },
    {
      name: "Python Backend",
      endpoint: "/api/system/chord-processor-status",
      icon: Terminal,
      critical: false,
    },
    {
      name: "File System",
      endpoint: "/api/health/filesystem",
      icon: Server,
      critical: true,
    },
  ]

  useEffect(() => {
    checkAllSystems()

    // Set up periodic health checks every 30 seconds
    const interval = setInterval(checkAllSystems, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkAllSystems = async () => {
    setIsChecking(true)
    const results: SystemStatus[] = []

    for (const system of systemChecks) {
      try {
        const startTime = Date.now()
        const response = await fetch(system.endpoint, {
          method: system.endpoint === "/api/health/filesystem" ? "POST" : "GET",
          headers: {
            "Content-Type": "application/json",
          },
          body: system.endpoint === "/api/health/filesystem" ? JSON.stringify({ test: "all" }) : undefined,
        })

        const responseTime = Date.now() - startTime
        const data = await response.json()

        results.push({
          name: system.name,
          status: response.ok && data.success !== false ? "healthy" : "unhealthy",
          message: data.message || (response.ok ? "System is healthy" : "System check failed"),
          details: data.data || data.details,
          lastChecked: new Date().toISOString(),
          responseTime: `${responseTime}ms`,
        })
      } catch (error) {
        results.push({
          name: system.name,
          status: "unhealthy",
          message: error instanceof Error ? error.message : "System check failed",
          lastChecked: new Date().toISOString(),
        })
      }
    }

    setSystems(results)

    // Calculate overall health
    const criticalSystems = systemChecks.filter((s) => s.critical).map((s) => s.name)
    const criticalResults = results.filter((r) => criticalSystems.includes(r.name))

    const hasUnhealthy = criticalResults.some((r) => r.status === "unhealthy")
    const hasWarnings = results.some((r) => r.status === "warning")

    if (hasUnhealthy) {
      setOverallHealth("unhealthy")
      toast.error("Critical system issues detected!")
    } else if (hasWarnings) {
      setOverallHealth("warning")
      toast.warning("Some systems have warnings")
    } else {
      setOverallHealth("healthy")
      if (systems.length > 0) {
        // Only show success if this isn't the first check
        toast.success("All systems healthy!")
      }
    }

    setIsChecking(false)
  }

  const getStatusIcon = (status: SystemStatus["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "unhealthy":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "checking":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusBadge = (status: SystemStatus["status"]) => {
    switch (status) {
      case "healthy":
        return <Badge variant="default">Healthy</Badge>
      case "unhealthy":
        return <Badge variant="destructive">Unhealthy</Badge>
      case "warning":
        return <Badge variant="secondary">Warning</Badge>
      case "checking":
        return <Badge variant="outline">Checking...</Badge>
    }
  }

  const getSystemIcon = (systemName: string) => {
    const system = systemChecks.find((s) => s.name === systemName)
    if (!system) return Server

    const Icon = system.icon
    return <Icon className="h-5 w-5" />
  }

  const healthyCount = systems.filter((s) => s.status === "healthy").length
  const unhealthyCount = systems.filter((s) => s.status === "unhealthy").length
  const warningCount = systems.filter((s) => s.status === "warning").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔍 System Status Monitor</h1>
          <p className="text-muted-foreground">Real-time health monitoring for Burnt Beats</p>
        </div>
        <Button onClick={checkAllSystems} disabled={isChecking}>
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </>
          )}
        </Button>
      </div>

      {/* Overall Health Status */}
      <Alert variant={overallHealth === "healthy" ? "default" : "destructive"}>
        {overallHealth === "healthy" ? (
          <CheckCircle className="h-4 w-4" />
        ) : overallHealth === "warning" ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        <AlertDescription>
          <strong>
            {overallHealth === "healthy"
              ? "✅ All Systems Operational"
              : overallHealth === "warning"
                ? "⚠️ Some Systems Have Warnings"
                : "❌ Critical Systems Down"}
          </strong>
          <br />
          {overallHealth === "healthy"
            ? "All critical systems are running normally."
            : overallHealth === "warning"
              ? "Non-critical systems have issues but core functionality is available."
              : "Critical system failures detected. Immediate attention required."}
        </AlertDescription>
      </Alert>

      {/* Summary Stats */}
      {systems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
              <p className="text-xs text-muted-foreground">Healthy Systems</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{unhealthyCount}</div>
              <p className="text-xs text-muted-foreground">Unhealthy Systems</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{systems.length}</div>
              <p className="text-xs text-muted-foreground">Total Systems</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {systems.map((system, index) => (
          <Card
            key={index}
            className={`${
              system.status === "unhealthy"
                ? "border-red-200"
                : system.status === "warning"
                  ? "border-yellow-200"
                  : system.status === "healthy"
                    ? "border-green-200"
                    : ""
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  {getSystemIcon(system.name)}
                  {system.name}
                </div>
                {getStatusBadge(system.status)}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                {getStatusIcon(system.status)}
                {system.message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {system.responseTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response Time:</span>
                    <span className="font-mono">{system.responseTime}</span>
                  </div>
                )}
                {system.lastChecked && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Checked:</span>
                    <span className="font-mono text-xs">{new Date(system.lastChecked).toLocaleTimeString()}</span>
                  </div>
                )}
                {system.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-muted-foreground">View Details</summary>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                      {JSON.stringify(system.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {systems.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Checking system status...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
