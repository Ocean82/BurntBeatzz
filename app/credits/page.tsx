import CreditBalanceWidget from "@/components/credit-balance-widget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coins, Download, Trophy, Gift, Music, Headphones } from "lucide-react"

export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Your Credits
          </h1>
          <p className="text-gray-400 text-lg">
            Earn credits through contests and activities. Use them to download your AI-generated songs!
          </p>
        </div>

        {/* Credit Balance Widget */}
        <CreditBalanceWidget />

        {/* How Credits Work */}
        <Card className="bg-black/80 border border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-300 flex items-center gap-2">
              <Coins className="w-5 h-5" />
              How Credits Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4" />🆓 All Features Are FREE
                </h3>
                <ul className="space-y-2 text-blue-400/80 text-sm">
                  <li>• Generate unlimited AI songs</li>
                  <li>• Use all voice cloning features</li>
                  <li>• Access all genres and styles</li>
                  <li>• Listen to watermarked demos</li>
                  <li>• Participate in contests</li>
                  <li>• Share and discover music</li>
                </ul>
              </div>
              <div>
                <h3 className="text-green-300 font-semibold mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4" />💰 Pay Only for Downloads
                </h3>
                <ul className="space-y-2 text-green-400/80 text-sm">
                  <li>• 🧪 Bonus Track: 99 credits ($0.99)</li>
                  <li>• 🔉 Base Song: 199 credits ($1.99)</li>
                  <li>• 🎧 Premium Song: 499 credits ($4.99)</li>
                  <li>• 💽 Ultra Song: 899 credits ($8.99)</li>
                  <li>• 🪪 Full License: +1000 credits (+$10.00)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earning Credits */}
        <Card className="bg-black/80 border border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-purple-300 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Ways to Earn Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-yellow-300 font-semibold mb-3">🏆 Contest Prizes</h4>
                <ul className="space-y-2 text-yellow-400/80 text-sm">
                  <li>• 1st Place: 500 credits ($5.00)</li>
                  <li>• 2nd Place: 300 credits ($3.00)</li>
                  <li>• 3rd Place: 200 credits ($2.00)</li>
                  <li>• Top 10: 50-100 credits</li>
                  <li>• Participation: 25 credits</li>
                </ul>
              </div>
              <div>
                <h4 className="text-green-300 font-semibold mb-3">⚡ Daily Activities</h4>
                <ul className="space-y-2 text-green-400/80 text-sm">
                  <li>• Daily login: 5 credits</li>
                  <li>• Vote on songs: 2 credits each</li>
                  <li>• Share creations: 10 credits</li>
                  <li>• Complete profile: 25 credits</li>
                  <li>• First generation: 50 credits</li>
                </ul>
              </div>
              <div>
                <h4 className="text-blue-300 font-semibold mb-3">👥 Social Rewards</h4>
                <ul className="space-y-2 text-blue-400/80 text-sm">
                  <li>• Refer friends: 100 credits each</li>
                  <li>• Friend signs up: 50 credits bonus</li>
                  <li>• Community engagement: varies</li>
                  <li>• Special events: bonus credits</li>
                  <li>• Achievement unlocks: varies</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download Options */}
        <Card className="bg-black/80 border border-orange-500/30">
          <CardHeader>
            <CardTitle className="text-orange-300 flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              Download Tiers (What Your Credits Buy)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border border-gray-500/30 rounded-lg bg-gray-500/5">
                <div className="text-2xl mb-2">🧪</div>
                <h3 className="text-gray-300 font-semibold">Bonus Track</h3>
                <p className="text-gray-400 text-sm mb-2">Demo with watermark</p>
                <Badge className="bg-gray-500/20 text-gray-300">99 credits</Badge>
                <p className="text-xs text-gray-500 mt-2">Perfect for previewing</p>
              </div>
              <div className="p-4 border border-blue-500/30 rounded-lg bg-blue-500/5">
                <div className="text-2xl mb-2">🔉</div>
                <h3 className="text-blue-300 font-semibold">Base Song</h3>
                <p className="text-blue-400 text-sm mb-2">Standard MP3 quality</p>
                <Badge className="bg-blue-500/20 text-blue-300">199 credits</Badge>
                <p className="text-xs text-blue-500 mt-2">Files under 9MB</p>
              </div>
              <div className="p-4 border border-purple-500/30 rounded-lg bg-purple-500/5">
                <div className="text-2xl mb-2">🎧</div>
                <h3 className="text-purple-300 font-semibold">Premium Song</h3>
                <p className="text-purple-400 text-sm mb-2">High quality WAV/FLAC</p>
                <Badge className="bg-purple-500/20 text-purple-300">499 credits</Badge>
                <p className="text-xs text-purple-500 mt-2">9MB - 20MB files</p>
              </div>
              <div className="p-4 border border-orange-500/30 rounded-lg bg-orange-500/5">
                <div className="text-2xl mb-2">💽</div>
                <h3 className="text-orange-300 font-semibold">Ultra Song</h3>
                <p className="text-orange-400 text-sm mb-2">Uncompressed + stems</p>
                <Badge className="bg-orange-500/20 text-orange-300">899 credits</Badge>
                <p className="text-xs text-orange-500 mt-2">Files over 20MB</p>
              </div>
            </div>

            <div className="mt-6 p-4 border border-yellow-500/30 rounded-lg bg-yellow-500/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xl">🪪</div>
                <h3 className="text-yellow-300 font-semibold">Full Commercial License</h3>
                <Badge className="bg-yellow-500/20 text-yellow-300">+1000 credits</Badge>
              </div>
              <p className="text-yellow-400/80 text-sm">
                Complete ownership rights - use, modify, distribute, and monetize anywhere. No royalties ever!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Business Model Notice */}
        <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30">
          <CardContent className="p-6 text-center">
            <Gift className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="text-green-300 font-semibold text-lg mb-2">No Subscriptions. No Limits.</h3>
            <p className="text-green-400/80 mb-4">
              Create unlimited AI music for free. Listen to watermarked demos. Only pay when you want to download your
              songs.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
              <span>✅ Free AI Generation</span>
              <span>✅ Free Voice Cloning</span>
              <span>✅ Free Demos</span>
              <span>✅ Pay-per-Download</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
