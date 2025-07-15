import ContestAnalytics from "@/components/contest-analytics"

export default function ContestAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 p-8">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent mb-2">
            📊 CONTEST ANALYTICS DASHBOARD 📊
          </h1>
          <p className="text-green-300/80">Real-time insights into contest performance and engagement</p>
        </div>
        <ContestAnalytics />
      </div>
    </div>
  )
}
