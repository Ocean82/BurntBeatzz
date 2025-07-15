"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Copy } from "lucide-react"

export default function DependencyCleanupTool() {
  const [step, setStep] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)

  const problematicPackages = ["@op-engineering/op-sqlite", "react-native", "bun-types"]

  const cleanupSteps = [
    {
      title: "Delete Lock Files and Node Modules",
      description: "Remove all cached dependency information",
      commands: ["rm -rf node_modules", "rm package-lock.json", "rm pnpm-lock.yaml", "rm yarn.lock"],
    },
    {
      title: "Replace package.json",
      description: "Use the clean package.json provided above",
      commands: [
        "# Copy the clean package.json from the CodeProject above",
        "# Make sure it contains NO @op-engineering/op-sqlite",
        "# Make sure it contains NO react-native",
        "# Make sure it contains NO bun-types",
      ],
    },
    {
      title: "Create Clean .npmrc",
      description: "Configure npm for clean dependency resolution",
      commands: [
        'echo "strict-peer-deps=false" > .npmrc',
        'echo "legacy-peer-deps=false" >> .npmrc',
        'echo "audit=false" >> .npmrc',
        'echo "fund=false" >> .npmrc',
      ],
    },
    {
      title: "Fresh Install",
      description: "Install dependencies with clean slate",
      commands: ["npm install"],
    },
    {
      title: "Commit and Push",
      description: "Save the clean configuration",
      commands: [
        "git add .",
        'git commit -m "Clean dependencies - remove react-native conflicts"',
        "git push origin test",
      ],
    },
  ]

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Dependency Conflict Detected
          </CardTitle>
          <CardDescription>Your package.json still contains packages that conflict with React 18</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Problematic packages found:</strong>
              <ul className="list-disc list-inside mt-2">
                {problematicPackages.map((pkg) => (
                  <li key={pkg} className="text-red-600 font-mono">
                    {pkg}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Step-by-Step Cleanup Process</h2>

        {cleanupSteps.map((stepData, index) => (
          <Card key={index} className={`${step >= index ? "border-green-500" : "border-gray-200"}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {step > index ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs">
                    {index + 1}
                  </div>
                )}
                Step {index + 1}: {stepData.title}
              </CardTitle>
              <CardDescription>{stepData.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stepData.commands.map((command, cmdIndex) => (
                  <div key={cmdIndex} className="flex items-center gap-2 p-2 bg-gray-100 rounded font-mono text-sm">
                    <code className="flex-1">{command}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(command, `${index}-${cmdIndex}`)}
                    >
                      {copied === `${index}-${cmdIndex}` ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              {step === index && (
                <Button className="mt-4" onClick={() => setStep(step + 1)}>
                  Mark Step {index + 1} Complete
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {step >= cleanupSteps.length && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Cleanup Complete!</strong> Your dependencies should now install without conflicts. Run{" "}
            <code>npm install</code> to verify, then push to trigger a new Vercel build.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Verification Commands</CardTitle>
          <CardDescription>Run these to verify the cleanup worked</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              "npm list @op-engineering/op-sqlite",
              "npm list react-native",
              "npm list bun-types",
              "npm install --dry-run",
            ].map((cmd, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-100 rounded font-mono text-sm">
                <code className="flex-1">{cmd}</code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(cmd, `verify-${index}`)}>
                  {copied === `verify-${index}` ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
