import { GitHubRepositoryManager } from "@/components/github-repository-manager"

export default function GitHubManagerPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">GitHub Repository Manager</h1>
          <p className="text-muted-foreground">
            Manage your GitHub repositories, push and pull files, and work with MIDI collections
          </p>
        </div>
        <GitHubRepositoryManager />
      </div>
    </div>
  )
}
