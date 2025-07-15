import GitStatusChecker from "@/components/git-status-checker"

export default function GitStatusPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Git Status Check</h1>
          <p className="text-gray-600">Check if your changes were pushed and if the build succeeded</p>
        </div>
        <GitStatusChecker />
      </div>
    </div>
  )
}
