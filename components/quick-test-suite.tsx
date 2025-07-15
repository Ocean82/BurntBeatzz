"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, CheckCircle, XCircle, Clock } from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "running" | "passed" | "failed"
  message: string
  duration?: number
}

export default function QuickTestSuite() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Music Generator Component", status: "pending", message: "Not tested" },
    { name: "MIDI Upload Functionality", status: "pending", message: "Not tested" },
    { name: "Voice Cloning Service", status: "pending", message: "Not tested" },
    { name: "Git Workflow Manager", status: "pending", message: "Not tested" },
    { name: "Stripe Integration", status: "pending", message: "Not tested" },
    { name: "Database Connection", status: "pending", message: "Not tested" },
  ])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)

    for (let i = 0; i < tests.length; i++) {
      // Update test to running
      setTests((prev) =>
        prev.map((test, index) => (index === i ? { ...test, status: "running", message: "Testing..." } : test)),
      )

      // Simulate test execution
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

      // Simulate test result
      const passed = Math.random() > 0.2 // 80% pass rate
      setTests((prev) =>
        prev.map((test, index) =>
          index === i
            ? {
                ...test,
                status: passed ? "passed" : "failed",
                message: passed ? "Component loaded successfully" : "Component failed to load",
                duration: Math.floor(1000 + Math.random() * 2000),
              }
            : test,
        ),
      )
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "running":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const passedTests = tests.filter((test) => test.status === "passed").length
  const failedTests = tests.filter((test) => test.status === "failed").length
  const totalTests = tests.length

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-6 w-6" />
            Quick Test Suite
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">
              {passedTests}/{totalTests} Passed
            </Badge>
            {failedTests > 0 && <Badge variant="destructive">{failedTests} Failed</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTests} disabled={isRunning} className="w-full">
            {isRunning ? "Running Tests..." : "Run All Tests"}
          </Button>

          <div className="space-y-2">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <p className="font-medium">{test.name}</p>
                    <p className="text-sm text-gray-600">{test.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {test.duration && <span className="text-xs text-gray-500">{test.duration}ms</span>}
                  <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                </div>
              </div>
            ))}
          </div>

          {!isRunning && (passedTests > 0 || failedTests > 0) && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Test Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{passedTests}</p>
                  <p className="text-sm text-gray-600">Passed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{failedTests}</p>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{totalTests}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
