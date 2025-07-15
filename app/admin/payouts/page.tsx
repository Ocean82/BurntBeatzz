import PayoutManagement from "@/components/payout-management"
import ContestVerificationSystem from "@/components/contest-verification-system"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPayoutsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
            Contest Administration
          </h1>
          <p className="text-gray-400 mt-2">Manage contest verification, prize distribution, and payouts</p>
        </div>

        <Tabs defaultValue="verification" className="space-y-6">
          <TabsList className="bg-black/60 border border-green-500/30">
            <TabsTrigger
              value="verification"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300"
            >
              Verification System
            </TabsTrigger>
            <TabsTrigger
              value="payouts"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300"
            >
              Payout Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verification">
            <ContestVerificationSystem />
          </TabsContent>

          <TabsContent value="payouts">
            <PayoutManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
