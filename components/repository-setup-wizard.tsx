"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitBranch, Globe, Terminal, CheckCircle, AlertTriangle, Loader2, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface RepositorySetupWizardProps {
  repositoryUrl: string
  onRepositoryReady: () => void
}

export function RepositorySetupWizard({ repositoryUrl, onRepositoryReady }: RepositorySetupWizardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<"check" | "clone" | "init" | "ready">("check")

  const extractRepoInfo = (url: string) => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (match) {
      const [, owner, repo] = match
      return {
        owner,
        repo: repo.replace(/\.git$/, ""),
        fullName: `${owner}/${repo.replace(/\.git$/, "")}`,
      }
    }
    return null
  }

  const repoInfo = extractRepoInfo(repositoryUrl)

  const cloneRepository = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/git/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: repositoryUrl,
          directory: ".",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Repository cloned successfully")
        setCurrentStep("ready")
        onRepositoryReady()
      } else {
        toast.error(`Failed to clone: ${data.error}`)
      }
    } catch (error) {
      toast.error("Failed to clone repository")
    } finally {
      setIsLoading(false)
    }
  }

  const initializeLocalRepo = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/git/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remoteUrl: repositoryUrl,
          branch: "main",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Local repository initialized")
        setCurrentStep("ready")
        onRepositoryReady()
      } else {
        toast.error(`Failed to initialize: ${data.error}`)
      }
    } catch (error) {
      toast.error("Failed to initialize repository")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Repository Setup Wizard
        </CardTitle>
        <CardDescription>Set up your repository for Git operations</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={currentStep} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="check">Check</TabsTrigger>
            <TabsTrigger value="clone">Clone</TabsTrigger>
            <TabsTrigger value="init">Initialize</TabsTrigger>
            <TabsTrigger value="ready">Ready</TabsTrigger>
          </TabsList>

          <TabsContent value="check" className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Repository Not Accessible</strong>
                <br />
                The repository {repositoryUrl} is not currently accessible. This could be because:
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>The repository was recently made public and needs time to propagate</li>
                  <li>There's a typo in the repository name</li>
                  <li>The repository doesn't exist yet</li>
                  <li>Network connectivity issues</li>
                </ul>
              </AlertDescription>
            </Alert>

            {repoInfo && (
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Repository Information</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>Owner:</strong> {repoInfo.owner}
                    </div>
                    <div>
                      <strong>Repository:</strong> {repoInfo.repo}
                    </div>
                    <div>
                      <strong>Full Name:</strong> {repoInfo.fullName}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(repositoryUrl.replace(/\.git$/, ""), "_blank")}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open on GitHub
                  </Button>
                  <Button onClick={() => setCurrentStep("clone")} className="flex-1">
                    Continue Setup
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="clone" className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Option 1: Clone Existing Repository</h4>
              <p className="text-sm text-muted-foreground">
                If the repository exists and is accessible, clone it to your local environment.
              </p>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <code className="text-sm">git clone {repositoryUrl}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`git clone ${repositoryUrl}`)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={cloneRepository} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cloning Repository...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Clone Repository
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button variant="link" onClick={() => setCurrentStep("init")}>
                  Or initialize a new local repository →
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="init" className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Option 2: Initialize Local Repository</h4>
              <p className="text-sm text-muted-foreground">
                Create a new local Git repository and connect it to the remote repository.
              </p>

              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="space-y-1 text-sm font-mono">
                    <div>git init</div>
                    <div>git remote add origin {repositoryUrl}</div>
                    <div>git branch -M main</div>
                  </div>
                </div>
              </div>

              <Button onClick={initializeLocalRepo} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initializing Repository...
                  </>
                ) : (
                  <>
                    <Terminal className="h-4 w-4 mr-2" />
                    Initialize Local Repository
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="ready" className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Repository Ready!</strong>
                <br />
                Your repository is now set up and ready for Git operations. You can now stage, commit, and push changes.
              </AlertDescription>
            </Alert>

            <Button onClick={onRepositoryReady} className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Continue to Git Operations
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
