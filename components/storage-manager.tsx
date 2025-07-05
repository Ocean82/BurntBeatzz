"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Cloud, HardDrive, Upload, Download, Trash2, Eye, Music, Mic, Database, Shield } from "lucide-react"
import { useCloudStorage } from "@/hooks/use-cloud-storage"

interface StorageManagerProps {
  userId: string
}

export default function StorageManager({ userId }: StorageManagerProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  const { userFiles, isLoadingFiles, refetchFiles, uploadProgress } = useCloudStorage({ userId })

  // Mock storage stats - replace with real data
  const storageStats = {
    used: 156.7, // MB
    total: 1000, // MB
    voiceSamples: 12,
    songs: 8,
    stems: 15,
  }

  const usagePercentage = (storageStats.used / storageStats.total) * 100

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "voice-sample":
        return <Mic className="w-4 h-4 text-blue-400" />
      case "generated-song":
        return <Music className="w-4 h-4 text-green-400" />
      case "song-stem":
        return <Database className="w-4 h-4 text-purple-400" />
      default:
        return <HardDrive className="w-4 h-4 text-gray-400" />
    }
  }

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) return `${(sizeInMB * 1024).toFixed(0)} KB`
    return `${sizeInMB.toFixed(1)} MB`
  }

  return (
    <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
      <CardHeader>
        <CardTitle className="text-green-300 flex items-center gap-2">
          <Cloud className="w-5 h-5" />
          Google Cloud Storage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-green-300 font-medium">Storage Usage</span>
            <span className="text-green-400/60 text-sm">
              {formatFileSize(storageStats.used)} / {formatFileSize(storageStats.total)}
            </span>
          </div>

          <Progress value={usagePercentage} className="h-2" />

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-black/40 p-3 rounded">
              <Mic className="w-5 h-5 mx-auto mb-1 text-blue-400" />
              <p className="text-xs text-blue-300">{storageStats.voiceSamples} Voices</p>
            </div>
            <div className="bg-black/40 p-3 rounded">
              <Music className="w-5 h-5 mx-auto mb-1 text-green-400" />
              <p className="text-xs text-green-300">{storageStats.songs} Songs</p>
            </div>
            <div className="bg-black/40 p-3 rounded">
              <Database className="w-5 h-5 mx-auto mb-1 text-purple-400" />
              <p className="text-xs text-purple-300">{storageStats.stems} Stems</p>
            </div>
          </div>
        </div>

        {/* File List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-green-300 font-medium">Your Files</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchFiles()}
              className="text-green-400 hover:text-green-300"
            >
              <Upload className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>

          {isLoadingFiles ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-black/40 h-12 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {userFiles?.files?.map((file: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-black/40 border border-green-500/20 rounded p-3"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-green-100 text-sm font-medium">{file.name}</p>
                      <p className="text-green-400/60 text-xs">
                        {file.type} • {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {file.isPublic ? (
                      <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                        <Shield className="w-3 h-3 mr-1" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400">
                        Private
                      </Badge>
                    )}

                    <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300">
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300">
                      <Download className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-green-400/60">
                  <Cloud className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No files uploaded yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-green-300 font-medium text-sm">Upload Progress</h4>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">{fileName}</span>
                  <span className="text-green-400">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1" />
              </div>
            ))}
          </div>
        )}

        {/* Cloud Features */}
        <div className="bg-gradient-to-r from-blue-900/20 to-green-900/20 border border-green-500/20 rounded-lg p-4">
          <h4 className="text-green-300 font-medium mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Google Cloud Features
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-green-400/80">
            <div>✅ Secure file storage</div>
            <div>✅ Global CDN delivery</div>
            <div>✅ Automatic backups</div>
            <div>✅ 99.9% uptime</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
