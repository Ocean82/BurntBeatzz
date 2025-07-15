import DependencyCleanupTool from "@/components/dependency-cleanup-tool"

export default function DependencyCleanupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dependency Cleanup</h1>
          <p className="text-gray-600">Track your progress removing problematic dependencies</p>
        </div>
        <DependencyCleanupTool />
      </div>
    </div>
  )
}
