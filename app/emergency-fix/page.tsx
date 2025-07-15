import DependencyEmergencyFix from "@/components/dependency-emergency-fix"

export default function EmergencyFixPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-600 mb-2">🚨 Emergency Dependency Fix</h1>
          <p className="text-gray-600">Immediate fix for React version conflicts</p>
        </div>
        <DependencyEmergencyFix />
      </div>
    </div>
  )
}
