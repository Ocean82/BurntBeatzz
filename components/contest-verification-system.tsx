"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Music,
  Zap,
  Clock,
  Eye,
  Ban,
  Award,
  Fingerprint,
  Database,
  Cpu,
} from "lucide-react"

interface VerificationCheck {
  id: string
  name: string
  description: string
  status: "pending" | "passed" | "failed" | "warning"
  details?: string
  icon: React.ReactNode
}

interface SongVerification {
  songId: string
  title: string
  artist: string
  submittedAt: string
  overallStatus: "verifying" | "verified" | "rejected" | "flagged"
  checks: VerificationCheck[]
  score: number
}

export default function ContestVerificationSystem() {
  const [verifications, setVerifications] = useState<SongVerification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading verification data
    setTimeout(() => {
      setVerifications([
        {
          songId: "song_123",
          title: "Neon Dreams",
          artist: "BeatMaker23",
          submittedAt: "2024-01-15T10:30:00Z",
          overallStatus: "verified",
          score: 95,
          checks: [
            {
              id: "platform_gen",
              name: "Platform Generation",
              description: "Verify song was generated using Burnt Beats AI",
              status: "passed",
              details: "Generated on 2024-01-15 using Suno AI v3.5",
              icon: <Cpu className="w-4 h-4" />,
            },
            {
              id: "audio_fingerprint",
              name: "Audio Fingerprint",
              description: "Check for embedded AI generation watermark",
              status: "passed",
              details: "Valid watermark detected at 440Hz, 880Hz, 1320Hz",
              icon: <Fingerprint className="w-4 h-4" />,
            },
            {
              id: "metadata_check",
              name: "Generation Metadata",
              description: "Verify generation logs and timestamps",
              status: "passed",
              details: "All required metadata present and valid",
              icon: <Database className="w-4 h-4" />,
            },
            {
              id: "contest_period",
              name: "Contest Period",
              description: "Confirm generation within contest timeframe",
              status: "passed",
              details: "Generated 5 days after contest start",
              icon: <Clock className="w-4 h-4" />,
            },
            {
              id: "duplicate_check",
              name: "Duplicate Detection",
              description: "Scan for similar or duplicate submissions",
              status: "passed",
              details: "No duplicates found (98.2% unique)",
              icon: <Eye className="w-4 h-4" />,
            },
          ],
        },
        {
          songId: "song_456",
          title: "Bass Drop Madness",
          artist: "FireProducer",
          submittedAt: "2024-01-14T15:45:00Z",
          overallStatus: "flagged",
          score: 72,
          checks: [
            {
              id: "platform_gen",
              name: "Platform Generation",
              description: "Verify song was generated using Burnt Beats AI",
              status: "passed",
              details: "Generated on 2024-01-14 using ElevenLabs + Suno",
              icon: <Cpu className="w-4 h-4" />,
            },
            {
              id: "audio_fingerprint",
              name: "Audio Fingerprint",
              description: "Check for embedded AI generation watermark",
              status: "warning",
              details: "Watermark partially detected - may have been edited",
              icon: <Fingerprint className="w-4 h-4" />,
            },
            {
              id: "metadata_check",
              name: "Generation Metadata",
              description: "Verify generation logs and timestamps",
              status: "passed",
              details: "Metadata valid but shows post-processing",
              icon: <Database className="w-4 h-4" />,
            },
            {
              id: "contest_period",
              name: "Contest Period",
              description: "Confirm generation within contest timeframe",
              status: "passed",
              details: "Generated 6 days after contest start",
              icon: <Clock className="w-4 h-4" />,
            },
            {
              id: "duplicate_check",
              name: "Duplicate Detection",
              description: "Scan for similar or duplicate submissions",
              status: "warning",
              details: "85% similarity to existing track - needs review",
              icon: <Eye className="w-4 h-4" />,
            },
          ],
        },
        {
          songId: "song_789",
          title: "Uploaded Track",
          artist: "ExternalUser",
          submittedAt: "2024-01-13T09:20:00Z",
          overallStatus: "rejected",
          score: 15,
          checks: [
            {
              id: "platform_gen",
              name: "Platform Generation",
              description: "Verify song was generated using Burnt Beats AI",
              status: "failed",
              details: "No generation record found in database",
              icon: <Cpu className="w-4 h-4" />,
            },
            {
              id: "audio_fingerprint",
              name: "Audio Fingerprint",
              description: "Check for embedded AI generation watermark",
              status: "failed",
              details: "No AI watermark detected - likely external file",
              icon: <Fingerprint className="w-4 h-4" />,
            },
            {
              id: "metadata_check",
              name: "Generation Metadata",
              description: "Verify generation logs and timestamps",
              status: "failed",
              details: "Missing required generation metadata",
              icon: <Database className="w-4 h-4" />,
            },
            {
              id: "contest_period",
              name: "Contest Period",
              description: "Confirm generation within contest timeframe",
              status: "failed",
              details: "No generation timestamp available",
              icon: <Clock className="w-4 h-4" />,
            },
            {
              id: "duplicate_check",
              name: "Duplicate Detection",
              description: "Scan for similar or duplicate submissions",
              status: "passed",
              details: "Unique content (but not platform-generated)",
              icon: <Eye className="w-4 h-4" />,
            },
          ],
        },
      ])
      setIsLoading(false)
    }, 2000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "text-green-300 border-green-500/30 bg-green-500/10"
      case "flagged":
        return "text-yellow-300 border-yellow-500/30 bg-yellow-500/10"
      case "rejected":
        return "text-red-300 border-red-500/30 bg-red-500/10"
      case "verifying":
        return "text-blue-300 border-blue-500/30 bg-blue-500/10"
      default:
        return "text-gray-300 border-gray-500/30 bg-gray-500/10"
    }
  }

  const getCheckStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      default:
        return <Clock className="w-4 h-4 text-blue-400" />
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-black/80 border border-blue-500/30">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-blue-300">Running verification checks...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Verification Overview */}
      <Card className="bg-black/80 border border-purple-500/30 shadow-xl shadow-purple-500/10">
        <CardHeader>
          <CardTitle className="text-purple-300 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Contest Verification System
          </CardTitle>
          <p className="text-purple-400/80">
            Ensuring fair competition by verifying all songs were generated on the Burnt Beats platform
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="text-2xl font-bold text-green-300">
                {verifications.filter((v) => v.overallStatus === "verified").length}
              </div>
              <div className="text-green-400/80 text-sm">Verified</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="text-2xl font-bold text-yellow-300">
                {verifications.filter((v) => v.overallStatus === "flagged").length}
              </div>
              <div className="text-yellow-400/80 text-sm">Flagged</div>
            </div>
            <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="text-2xl font-bold text-red-300">
                {verifications.filter((v) => v.overallStatus === "rejected").length}
              </div>
              <div className="text-red-400/80 text-sm">Rejected</div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-300">
                {verifications.filter((v) => v.overallStatus === "verifying").length}
              </div>
              <div className="text-blue-400/80 text-sm">Processing</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Details */}
      <div className="space-y-4">
        {verifications.map((verification) => (
          <Card key={verification.songId} className={`border ${getStatusColor(verification.overallStatus)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-green-400" />
                  <div>
                    <h3 className="font-semibold text-green-300">{verification.title}</h3>
                    <p className="text-green-400/80 text-sm">by {verification.artist}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(verification.overallStatus)}>
                    {verification.overallStatus.toUpperCase()}
                  </Badge>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-300">{verification.score}%</div>
                    <div className="text-green-400/80 text-xs">Verification Score</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Verification Checks */}
              <div className="space-y-3">
                {verification.checks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-start gap-3 p-3 bg-black/40 rounded-lg border border-green-500/20"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="p-1 bg-green-500/20 rounded">{check.icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-green-300">{check.name}</h4>
                          {getCheckStatusIcon(check.status)}
                        </div>
                        <p className="text-green-400/80 text-sm">{check.description}</p>
                        {check.details && <p className="text-green-400/60 text-xs mt-1">{check.details}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-green-500/20">
                <div className="text-green-400/80 text-sm">
                  Submitted: {new Date(verification.submittedAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  {verification.overallStatus === "flagged" && (
                    <>
                      <Button size="sm" variant="outline" className="text-green-300 border-green-500/30 bg-transparent">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-300 border-red-500/30 bg-transparent">
                        <Ban className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                  {verification.overallStatus === "verified" && (
                    <Button size="sm" variant="outline" className="text-green-300 border-green-500/30 bg-transparent">
                      <Award className="w-4 h-4 mr-2" />
                      Contest Eligible
                    </Button>
                  )}
                  {verification.overallStatus === "rejected" && (
                    <Button size="sm" variant="outline" className="text-red-300 border-red-500/30 bg-transparent">
                      <XCircle className="w-4 h-4 mr-2" />
                      Disqualified
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Verification Rules */}
      <Card className="bg-black/80 border border-green-500/30">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Contest Verification Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-500/30 bg-blue-500/10 mb-4">
            <Zap className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              <strong>Platform-Only Policy:</strong> Only songs generated using Burnt Beats AI tools are eligible for
              contests. This ensures fair competition and showcases our platform's capabilities.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-green-300 font-semibold mb-3">✅ Required for Verification</h4>
              <ul className="space-y-2 text-green-400/80 text-sm">
                <li>• Generated using Burnt Beats AI (Suno, ElevenLabs, etc.)</li>
                <li>• Created within current contest period</li>
                <li>• Contains embedded AI generation watermark</li>
                <li>• Has complete generation metadata</li>
                <li>• Passes duplicate detection scan</li>
                <li>• Meets quality threshold (60%+ score)</li>
              </ul>
            </div>
            <div>
              <h4 className="text-red-300 font-semibold mb-3">❌ Automatic Disqualification</h4>
              <ul className="space-y-2 text-red-400/80 text-sm">
                <li>• Uploaded external audio files</li>
                <li>• Generated before contest start date</li>
                <li>• Missing AI generation fingerprint</li>
                <li>• Duplicate or heavily similar content</li>
                <li>• Tampered generation metadata</li>
                <li>• Violates community guidelines</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
