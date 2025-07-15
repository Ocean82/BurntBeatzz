import QuickTestSuite from "@/components/quick-test-suite"

export default function QuickTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quick Test Suite</h1>
          <p className="text-gray-600">Test all major components after deployment</p>
        </div>
        <QuickTestSuite />
      </div>
    </div>
  )
}
