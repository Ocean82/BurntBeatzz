import { GitHubQuickActions } from "@/components/github-quick-actions"

export default function QuickSyncPage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Quick GitHub Sync</h1>
          <p className="text-muted-foreground">Fast and simple GitHub operations</p>
        </div>

        <GitHubQuickActions />
      </div>
    </div>
  )
}
