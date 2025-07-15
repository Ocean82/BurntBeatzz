"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { EnhancedMusicGenerator } from "@/components/enhanced-music-generator"
import { VoiceCloningAdvanced } from "@/components/voice-cloning-advanced"
import { MusicDiscovery } from "@/components/music-discovery"
import { SongEditor } from "@/components/song-editor"
import { ContestBoosts } from "@/components/contest-boosts"
import { UserPlanDisplay } from "@/components/user-plan-display"
import { StorageManager } from "@/components/storage-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export type MenuItemType =
  | "song-generator"
  | "voice-cloning"
  | "music-discovery"
  | "song-library"
  | "contest-boosts"
  | "user-plan"
  | "storage-manager"
  | "song-editor"

interface UseMainContentReturn {
  currentContent: React.ReactNode
  setActiveMenuItem: (item: MenuItemType) => void
  activeMenuItem: MenuItemType
}

export function useMainContent(): UseMainContentReturn {
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItemType>("song-generator")

  const getCurrentContent = useCallback((): React.ReactNode => {
    switch (activeMenuItem) {
      case "song-generator":
        return <EnhancedMusicGenerator />

      case "voice-cloning":
        return <VoiceCloningAdvanced />

      case "music-discovery":
        return <MusicDiscovery />

      case "song-library":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Song Library</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Your personal collection of generated songs and compositions.
              </p>
              <Button variant="outline">Browse Songs</Button>
            </CardContent>
          </Card>
        )

      case "contest-boosts":
        return <ContestBoosts />

      case "user-plan":
        return <UserPlanDisplay />

      case "storage-manager":
        return <StorageManager />

      case "song-editor":
        return <SongEditor />

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Unknown Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The requested content could not be found. Please select a valid menu item.
              </p>
              <Button onClick={() => setActiveMenuItem("song-generator")} className="mt-4">
                Return to Song Generator
              </Button>
            </CardContent>
          </Card>
        )
    }
  }, [activeMenuItem])

  return {
    currentContent: getCurrentContent(),
    setActiveMenuItem,
    activeMenuItem,
  }
}
