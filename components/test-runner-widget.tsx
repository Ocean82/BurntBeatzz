"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, Play, Zap } from "lucide-react"
import { toast } from "sonner"

interface QuickTest {
  name: string
  endpoint: string
  method: "GET" | "POST"
  body?: any
  expectedStatus: number
}

interface TestResult {
  name: string
  status: "pending" | "running" | "success" | "error"
  responseTime: number
  statusCode: number
  message: string
}

export function TestRunnerWidget() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const quickTests: QuickTest[] = [
    {
      name: "GitHub Token",
      endpoint: "/api/github/validate-token",
      method: "GET",
      expectedStatus: 200,
    },
    {
      name: "Repository Access",
      endpoint: "/api/github/ldrolez-sync?repository=ldrolez/free-midi-chords",
      method: "GET",
      expectedStatus: 200,
    },
    {
      name: "MIDI Download",
      endpoint: "/api/github/midi-files",
      method: "POST",
      body: {
        downloadUrl: "https://raw.githubusercontent.com/ldrolez/free-midi-chords/main/chords/C_Major_Chord.mid",
        fileName: "test.mid",
        testMode: true,
      },
      expectedStatus: 200,
    },
  ]

  const runQuickTests = async () => {
    setIsRunning(true)
    const results: TestResult[] = quickTests.map((test) => ({
      name: test.name,
      status: "pending",
      responseTime: 0,
      statusCode: 0,
      message: "Waiting to run...",
    }))
    setTests(results)

    for (let i = 0; i < quickTests.length; i++) {
      const test = quickTests[i]

      // Update status to running
      setTests((prev) =>
        prev.map((result, index) => (index === i ? { ...result, status: "running", message: "Running..." } : result)),
      )

      const startTime = Date.now()

      try {
        const response = await fetch(test.endpoint, {
          method: test.method,
          headers: test.body ? { "Content-Type": "application/json" } : {},
          body: test.body ? JSON.stringify(test.body) : undefined,
        })

        const responseTime = Date.now() - startTime
        const isSuccess = response.status === test.expectedStatus

        setTests((prev) =>
          prev.map((result, index) =>
            index === i
              ? {
                  ...result,
                  status: isSuccess ? "success" : "error",
                  responseTime,
                  statusCode: response.status,
                  message: isSuccess
                    ? `Success (${responseTime}ms)`
                    : `Expected ${test.expectedStatus}, got ${response.status}`,
                }
              : result,
          ),
        )
      } catch (error) {
        const responseTime = Date.now() - startTime

        setTests((prev) =>
          prev.map((result, index) =>
            index === i
              ? {
                  ...result,
                  status: "error",
                  responseTime,
                  statusCode: 0,
                  message: error instanceof Error ? error.message : "Network error",
                }
              : result,
          ),
        )
      }

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setIsRunning(false)

    const successCount = tests.filter((t) => t.status === "success").length
    if (successCount === quickTests.length) {
      toast.success("All quick tests passed!")
    } else {
      toast.error(`${quickTests.length - successCount} tests failed`)
    }
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <div className="h-4 w-4 rounded-full bg-gray-300" />
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const successCount = tests.filter((t) => t.status === "success").length
  const errorCount = tests.filter((t) => t.status === "error").length
  const avgResponseTime = tests.length > 0 ? tests.reduce((sum, test) => sum + test.responseTime, 0) / tests.length : 0

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick API Tests
          </div>
          <Button onClick={runQuickTests} disabled={isRunning} size="sm">
            {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Run Tests
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tests.length > 0 && (
          <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{successCount}</div>
              <div className="text-xs text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{errorCount}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{avgResponseTime.toFixed(0)}ms</div>
              <div className="text-xs text-muted-foreground">Avg Time</div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {tests.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <div className="font-medium text-sm">{test.name}</div>
                  <div className="text-xs text-muted-foreground">{test.message}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {test.statusCode > 0 && (
                  <Badge variant={test.statusCode === 200 ? "default" : "destructive"} className="text-xs">
                    {test.statusCode}
                  </Badge>
                )}
                {test.responseTime > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {test.responseTime}ms
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {tests.length === 0 && (
          <Alert>
            <Play className="h-4 w-4" />
            <AlertDescription>
              Click "Run Tests" to quickly validate API endpoints and download functionality.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
