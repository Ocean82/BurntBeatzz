import { GitWorkflowManager } from "@/components/git-workflow-manager"

export default function GitWorkflowPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <GitWorkflowManager />
    </div>
  )
}

export const metadata = {
  title: "Git Workflow Manager | Burnt Beats",
  description: "Manage Git operations, staging, committing, and merging",
}
