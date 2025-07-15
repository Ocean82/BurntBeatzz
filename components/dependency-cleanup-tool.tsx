"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Copy, AlertTriangle } from "lucide-react"

export default function DependencyCleanupTool() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  const steps = [
    {
      id: 1,
      title: "Remove @op-engineering/op-sqlite",
      description: "Delete this line from package.json dependencies",
      command: `"@op-engineering/op-sqlite": "latest"`,
      action: "Delete this entire line from your package.json",
    },
    {
      id: 2,
      title: "Delete lock files",
      description: "Remove all lock files and node_modules",
      command: "rm -rf node_modules package-lock.json pnpm-lock.yaml yarn.lock",
      action: "Run this command in your project directory",
    },
    {
      id: 3,
      title: "Fresh install",
      description: "Install dependencies with clean tree",
      command: "npm install",
      action: "Run npm install to get clean dependencies",
    },
    {
      id: 4,
      title: "Commit changes",
      description: "Commit the cleaned package.json",
      command: 'git add . && git commit -m "Remove op-sqlite dependency" && git push origin test',
      action: "Commit and push the changes",
    },
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCommand(text)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  const toggleStep = (stepId: number) => {
    setCompletedSteps((prev) => (prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6 border-red-500/20 bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Dependency Conflict Detected
            </CardTitle>
            <CardDescription className="text-red-300">
              @op-engineering/op-sqlite is causing React version conflicts. Follow these steps to fix it.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {steps.map((step) => (
            <Card key={step.id} className="border-gray-700 bg-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStep(step.id)}
                      className={`p-1 ${
                        completedSteps.includes(step.id)
                          ? "text-green-400 hover:text-green-300"
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      {completedSteps.includes(step.id) ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </Button>
                    <span className="text-white">
                      Step {step.id}: {step.title}
                    </span>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-300 ml-8">{step.description}</CardDescription>
              </CardHeader>
              <CardContent className="ml-8">
                <div className="bg-gray-900 p-3 rounded-lg mb-3">
                  <code className="text-green-400 text-sm">{step.command}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(step.command)}
                    className="ml-2 p-1 text-gray-400 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {copiedCommand === step.command && <span className="text-green-400 text-xs ml-2">Copied!</span>}
                </div>
                <p className="text-gray-400 text-sm">{step.action}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-green-500/20 bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-green-300">
                Progress: {completedSteps.length}/{steps.length} steps completed
              </span>
            </div>
            {completedSteps.length === steps.length && (
              <p className="text-green-400 mt-2 font-semibold">🎉 All steps completed! Your build should now work.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
