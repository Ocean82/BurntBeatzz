"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Smartphone, Download, X, Wifi, WifiOff } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function MobileAppInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
  }

  if (isInstalled) {
    return (
      <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/30">
        <CardContent className="p-4 text-center">
          <Smartphone className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-green-300 font-medium">🔥 Burnt Beats App Installed!</p>
          <p className="text-green-400/60 text-sm">Enjoy the full mobile experience</p>
        </CardContent>
      </Card>
    )
  }

  if (!showInstallPrompt) return null

  return (
    <Card className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-500/30 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-orange-300 flex items-center gap-2 text-lg">
            <Smartphone className="w-5 h-5" />
            Install Burnt Beats App
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={dismissInstallPrompt} className="text-gray-400">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Get the full Burnt Beats experience with our mobile app! Create, edit, and collaborate on music anywhere.
          </p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <Download className="w-4 h-4" />
              <span>Offline editing</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <Smartphone className="w-4 h-4" />
              <span>Mobile optimized</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <Wifi className="w-4 h-4" />
              <span>Sync across devices</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <WifiOff className="w-4 h-4" />
              <span>Works offline</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
            <Button
              variant="outline"
              onClick={dismissInstallPrompt}
              className="border-gray-500 text-gray-300 bg-transparent"
            >
              Maybe Later
            </Button>
          </div>

          {!isOnline && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
              <WifiOff className="w-4 h-4" />
              <span>You're offline. The app will sync when you reconnect.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
