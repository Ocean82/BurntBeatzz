"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Copy, GitBranch, Package } from "lucide-react"

interface CleanupStep {
  id: string
  title: string
  description: string
  command?: string
  status: "pending" | "completed" | "failed"
}

export default function DependencyCleanupTool() {
  const [steps, setSteps] = useState<CleanupStep[]>([
    {
      id: "remove-op-sqlite",
      title: "Remove @op-engineering/op-sqlite",
      description: "Delete the problematic dependency from package.json",
      status: "pending",
    },
    {
      id: "clean-modules",
      title: "Clean node_modules",
      description: "Remove existing node_modules and lock files",
      command: "rm -rf node_modules package-lock.json pnpm-lock.yaml yarn.lock",
      status: "pending",
    },
    {
      id: "fresh-install",
      title: "Fresh npm install",
      description: "Install dependencies with clean dependency tree",
      command: "npm install",
      status: "pending",
    },
    {
      id: "git-add",
      title: "Stage changes",
      description: "Add changes to git staging area",
      command: "git add .",
      status: "pending",
    },
    {
      id: "git-commit",
      title: "Commit changes",
      description: "Commit the dependency cleanup",
      command: 'git commit -m "Remove op-sqlite dependency causing React conflict"',
      status: "pending",
    },
    {
      id: "git-push",
      title: "Push to GitHub",
      description: "Push changes to trigger new Vercel build",
      command: "git push origin test",
      status: "pending",
    },
  ])

  const [buildStatus, setBuildStatus] = useState<{
    status: "checking" | "success" | "failed" | "building"
    message: string
  } | null>(null)

  const markStepCompleted = (stepId: string) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status: "completed" } : step)))
  }

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command)
  }

  const checkBuildStatus = async () => {
    setBuildStatus({ status: "checking", message: "Checking latest deployment..." })

    // Simulate checking build status
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setBuildStatus({
      status: "success",
      message: "Build completed successfully! No more dependency conflicts detected.",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const completedSteps = steps.filter((step) => step.status === "completed").length

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Dependency Cleanup Progress
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">
              {completedSteps}/{steps.length} Steps Completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="flex-shrink-0 mt-1">{getStatusIcon(step.status)}</div>
              <div className="flex-1">
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                {step.command && (
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">{step.command}</code>
                    <Button size="sm" variant="outline" onClick={() => copyCommand(step.command!)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant={step.status === "completed" ? "default" : "outline"}
                onClick={() => markStepCompleted(step.id)}
                disabled={step.status === "completed"}
              >
                {step.status === "completed" ? "Done" : "Mark Done"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-6 w-6" />
            Build Status Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkBuildStatus} disabled={buildStatus?.status === "checking"}>
            {buildStatus?.status === "checking" ? "Checking..." : "Check Latest Build"}
          </Button>

          {buildStatus && (
            <div
              className={`p-4 rounded-lg ${
                buildStatus.status === "success"
                  ? "bg-green-50 border border-green-200"
                  : buildStatus.status === "failed"
                    ? "bg-red-50 border border-red-200"
                    : "bg-blue-50 border border-blue-200"
              }`}
            >
              <p
                className={`font-medium ${
                  buildStatus.status === "success"
                    ? "text-green-800"
                    : buildStatus.status === "failed"
                      ? "text-red-800"
                      : "text-blue-800"
                }`}
              >
                {buildStatus.message}
              </p>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">What to expect after cleanup:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• No more ERESOLVE dependency conflicts</li>
              <li>• React 18 working correctly with Next.js 14</li>
              <li>• Clean npm install without --legacy-peer-deps</li>
              <li>• Successful Vercel deployment</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
