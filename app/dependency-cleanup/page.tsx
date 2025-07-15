import DependencyCleanupTool from "@/components/dependency-cleanup-tool"

export default function DependencyCleanupPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Dependency Cleanup Tool</h1>
        <DependencyCleanupTool />
      </div>
    </div>
  )
}
