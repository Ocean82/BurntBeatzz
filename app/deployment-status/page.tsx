import DeploymentStatusChecker from "@/components/deployment-status-checker"

export default function DeploymentStatusPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Deployment Status</h1>
          <p className="text-gray-600">Check if your latest deployment is working correctly</p>
        </div>
        <DeploymentStatusChecker />
      </div>
    </div>
  )
}
