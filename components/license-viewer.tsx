"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, FileText, Shield, Award } from "lucide-react"
import { LicenseGenerator, type LicenseData } from "@/lib/services/license-generator"
import { useToast } from "@/hooks/use-toast"

interface LicenseViewerProps {
  songTitle: string
  userName: string
  userEmail: string
  fileSize: string
  songDuration: string
  genre: string
  format: string
  onPurchase: () => void
  isPurchased?: boolean
}

export default function LicenseViewer({
  songTitle,
  userName,
  userEmail,
  fileSize,
  songDuration,
  genre,
  format,
  onPurchase,
  isPurchased = false,
}: LicenseViewerProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const licenseData: LicenseData = {
    songTitle,
    userName,
    userEmail,
    fileSize,
    purchaseDate: new Date(),
    licenseId: LicenseGenerator.generateLicenseId(),
    songDuration,
    genre,
    format,
  }

  const handleDownloadLicense = async () => {
    setIsGenerating(true)
    try {
      const licenseHtml = LicenseGenerator.generateLicenseDocument(licenseData)
      const blob = new Blob([licenseHtml], { type: "text/html" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `Burnt-Beats-License-${songTitle.replace(/[^a-zA-Z0-9]/g, "-")}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "License Downloaded!",
        description: "Your commercial license has been saved to your device",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrintLicense = () => {
    const licenseHtml = LicenseGenerator.generateLicenseDocument(licenseData)
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(licenseHtml)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  return (
    <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 shadow-xl shadow-yellow-500/10">
      <CardHeader>
        <CardTitle className="text-yellow-300 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Commercial License
          <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
            $10.00
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-yellow-400" />
            <h4 className="font-semibold text-yellow-300">100% Commercial Rights</h4>
          </div>
          <ul className="text-sm text-yellow-100/80 space-y-1">
            <li>✓ Complete ownership with zero ongoing obligations</li>
            <li>✓ Sell on Spotify, Apple Music, YouTube, and all platforms</li>
            <li>✓ Use in commercials, films, and advertisements</li>
            <li>✓ No attribution required to Burnt Beats</li>
            <li>✓ Exclusive rights - track won't be sold to others</li>
            <li>✓ Lifetime license with no expiration</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="text-yellow-300 border-yellow-500/30 bg-black/40 hover:bg-yellow-500/10"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview License
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-black/95 border-yellow-500/30">
              <DialogHeader>
                <DialogTitle className="text-yellow-300">License Preview</DialogTitle>
              </DialogHeader>
              <div
                className="bg-white text-black p-6 rounded-lg"
                dangerouslySetInnerHTML={{
                  __html: LicenseGenerator.generateLicenseDocument(licenseData)
                    .replace(/<html>.*?<body[^>]*>/s, "")
                    .replace(/<\/body>.*?<\/html>/s, ""),
                }}
              />
            </DialogContent>
          </Dialog>

          {isPurchased ? (
            <Button
              onClick={handleDownloadLicense}
              disabled={isGenerating}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download License
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onPurchase}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
            >
              <FileText className="w-4 h-4 mr-2" />
              Purchase License
            </Button>
          )}
        </div>

        {isPurchased && (
          <div className="pt-4 border-t border-yellow-500/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-400/60">License ID:</span>
              <span className="text-yellow-300 font-mono">{licenseData.licenseId}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-yellow-400/60">Verification Hash:</span>
              <span className="text-yellow-300 font-mono text-xs">
                {LicenseGenerator.calculateLicenseHash(licenseData)}
              </span>
            </div>
            <Button
              onClick={handlePrintLicense}
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-yellow-300 hover:text-yellow-100"
            >
              <FileText className="w-4 h-4 mr-2" />
              Print License Certificate
            </Button>
          </div>
        )}

        <div className="text-xs text-yellow-400/60 text-center">
          This license provides complete legal protection for commercial use
        </div>
      </CardContent>
    </Card>
  )
}
