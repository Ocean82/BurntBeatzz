"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function DeploymentTroubleshooter() {
  const [isChecking, setIsChecking] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runDiagnostics = async () => {
    setIsChecking(true)

    // Simulate checking for common deployment issues
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setResults({
      packageJson: {
        status: "error",
        message: "bun-types found in devDependencies causing React version conflict",
      },
      lockFile: {
        status: "warning",
        message: "package-lock.json may contain stale bun-types reference",
      },
      dependencies: {
        status: "success",
        message: "Core dependencies are compatible",
      },
      solution: {
        steps: [
          "Remove bun-types from package.json devDependencies",
          "Delete package-lock.json file",
          "Commit and push changes",
          "Redeploy on Vercel",
        ],
      },
    })

    setIsChecking(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deployment Troubleshooter</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runDiagnostics} disabled={isChecking} className="mb-4">
            {isChecking ? "Running Diagnostics..." : "Run Deployment Diagnostics"}
          </Button>

          {results && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <Alert>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(results.packageJson.status)}
                    <span className="font-medium">Package.json Check</span>
                  </div>
                  <AlertDescription className="mt-2">{results.packageJson.message}</AlertDescription>
                </Alert>

                <Alert>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(results.lockFile.status)}
                    <span className="font-medium">Lock File Check</span>
                  </div>
                  <AlertDescription className="mt-2">{results.lockFile.message}</AlertDescription>
                </Alert>

                <Alert>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(results.dependencies.status)}
                    <span className="font-medium">Dependencies Check</span>
                  </div>
                  <AlertDescription className="mt-2">{results.dependencies.message}</AlertDescription>
                </Alert>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Solution Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2">
                    {results.solution.steps.map((step: string, index: number) => (
                      <li key={index} className="text-sm">
                        {step}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Manual Commands</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <pre className="text-sm">
                      {`# Remove problematic dependencies
rm -rf node_modules package-lock.json

# Clean npm cache
npm cache clean --force

# Reinstall with clean slate
npm install

# Commit and push
git add .
git commit -m "Fix dependency conflicts"
git push origin test`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
