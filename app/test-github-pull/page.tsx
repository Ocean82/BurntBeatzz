import { GitHubMelodyTester } from "@/components/github-melody-tester"

export default function TestGitHubPullPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Test GitHub Melody Pull</h1>
          <p className="text-muted-foreground">
            Test if the GitHub integration successfully pulls melody files from repositories
          </p>
        </div>

        <GitHubMelodyTester />
      </div>
    </div>
  )
}
