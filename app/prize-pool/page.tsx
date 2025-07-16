import DynamicPrizePool from "@/components/dynamic-prize-pool"

export default function PrizePoolPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 p-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-4">
            🏆 DYNAMIC PRIZE POOL 🏆
          </h1>
          <p className="text-green-300/80 text-xl">
            Watch the prize pool grow in real-time as creators enter and the community contributes!
          </p>
        </div>

        <DynamicPrizePool />
      </div>
    </div>
  )
}
