"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, AlertTriangle, CheckCircle } from "lucide-react"

export default function DependencyEmergencyFix() {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const cleanPackageJson = `{
  "name": "burnt-beats-music-generator",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@ai-sdk/openai": "^0.0.66",
    "@google-cloud/storage": "^7.7.0",
    "@neondatabase/serverless": "^0.9.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@stripe/react-stripe-js": "^2.4.0",
    "@stripe/stripe-js": "^2.4.0",
    "@tanstack/react-query": "^5.17.0",
    "ai": "^3.4.32",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "drizzle-orm": "^0.29.3",
    "drizzle-zod": "^0.5.1",
    "express-rate-limit": "^7.1.5",
    "lucide-react": "^0.263.1",
    "next": "14.0.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "stripe": "^14.10.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "uuid": "^9.0.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/uuid": "^9.0.7",
    "autoprefixer": "^10.0.1",
    "drizzle-kit": "^0.20.7",
    "eslint": "^8",
    "eslint-config-next": "14.0.4",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}`

  const npmrcContent = `legacy-peer-deps=false
strict-peer-deps=false
audit=false
fund=false`

  const emergencySteps = [
    {
      title: "1. Replace package.json completely",
      description: "Copy the clean package.json below and replace your entire file",
      action: "copy-package-json",
    },
    {
      title: "2. Create .npmrc file",
      description: "Create a .npmrc file in your project root with the content below",
      action: "copy-npmrc",
    },
    {
      title: "3. Delete all lock files",
      description: "Remove all cached dependency files",
      command: "rm -rf node_modules package-lock.json pnpm-lock.yaml yarn.lock",
    },
    {
      title: "4. Fresh install",
      description: "Install dependencies with clean slate",
      command: "npm install",
    },
    {
      title: "5. Commit and push",
      description: "Push the cleaned dependencies",
      command: 'git add . && git commit -m "Emergency fix: remove all React conflicts" && git push origin test',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Alert className="border-red-500 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-red-800">
          <strong>EMERGENCY FIX NEEDED:</strong> @op-engineering/op-sqlite is still in your package.json causing React
          version conflicts. Follow these steps immediately.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {emergencySteps.map((step, index) => (
          <Card key={index} className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="text-lg">{step.title}</CardTitle>
              <p className="text-gray-600">{step.description}</p>
            </CardHeader>
            <CardContent>
              {step.action === "copy-package-json" && (
                <div className="space-y-2">
                  <div className="bg-gray-900 p-4 rounded-lg overflow-auto max-h-96">
                    <pre className="text-green-400 text-sm">{cleanPackageJson}</pre>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(cleanPackageJson, "package.json")}
                    className="w-full"
                    variant="outline"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedText === "package.json" ? "Copied!" : "Copy Clean package.json"}
                  </Button>
                </div>
              )}

              {step.action === "copy-npmrc" && (
                <div className="space-y-2">
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <pre className="text-green-400 text-sm">{npmrcContent}</pre>
                  </div>
                  <Button onClick={() => copyToClipboard(npmrcContent, ".npmrc")} className="w-full" variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedText === ".npmrc" ? "Copied!" : "Copy .npmrc Content"}
                  </Button>
                </div>
              )}

              {step.command && (
                <div className="space-y-2">
                  <div className="bg-gray-900 p-3 rounded-lg">
                    <code className="text-green-400">{step.command}</code>
                  </div>
                  <Button onClick={() => copyToClipboard(step.command, `command-${index}`)} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedText === `command-${index}` ? "Copied!" : "Copy Command"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert className="border-green-500 bg-green-50">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="text-green-800">
          <strong>After completing all steps:</strong> Your build should succeed without any React version conflicts.
          The clean package.json removes ALL problematic dependencies including @op-engineering/op-sqlite, react-native,
          and bun-types.
        </AlertDescription>
      </Alert>
    </div>
  )
}
