"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Music, FileAudio, CheckCircle, AlertCircle, Trophy, Users, Clock, Flame } from "lucide-react"
import { useSongUpload } from "@/hooks/use-song-upload"

interface SongUploaderProps {
  onUploadComplete?: (songId: string) => void
  contestMode?: boolean
}

export default function SongUploader({ onUploadComplete, contestMode = false }: SongUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [songTitle, setSongTitle] = useState("")
  const [songDescription, setSongDescription] = useState("")
  const [genre, setGenre] = useState("")
  const [style, setStyle] = useState("")
  const [tags, setTags] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [enterContest, setEnterContest] = useState(contestMode)

  const { uploadSong, isUploading, uploadProgress, error } = useSongUpload()

  // Current prize pool data (this would come from your backend)
  const currentPrizePool = {
    total: 1247.5,
    contributors: 89,
    timeLeft: "12 days",
    entries: 156,
    topPrize: 750,
    secondPrize: 300,
    thirdPrize: 150,
    communityBonus: 47.5,
  }

  const genres = [
    "Electronic",
    "Hip Hop",
    "Pop",
    "Rock",
    "R&B",
    "Jazz",
    "Classical",
    "Country",
    "Reggae",
    "Metal",
    "Folk",
    "Blues",
    "Funk",
    "House",
    "Techno",
  ]

  const styles = [
    "Synthwave",
    "Trap",
    "Ambient",
    "Industrial",
    "Lo-Fi",
    "House",
    "Dubstep",
    "Drill",
    "Boom Bap",
    "Future Bass",
    "Deep House",
    "Minimal",
  ]

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("audio/")) {
        setSelectedFile(file)
      }
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !songTitle || !genre) return

    const uploadData = {
      file: selectedFile,
      title: songTitle,
      description: songDescription,
      genre,
      style,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      isPublic,
      enterContest,
    }

    try {
      const result = await uploadSong(uploadData)
      if (result.success && onUploadComplete) {
        onUploadComplete(result.songId)
      }
    } catch (err) {
      console.error("Upload failed:", err)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Prize Pool Banner */}
      {enterContest && (
        <Card className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/30 shadow-xl shadow-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-yellow-300">LIVE PRIZE POOL</h3>
                  <p className="text-yellow-400/80">Growing with every entry!</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-yellow-300">${currentPrizePool.total}</div>
                <div className="text-yellow-400/80 text-sm">Total Prize Pool</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-black/40 rounded-lg border border-yellow-500/20">
                <div className="text-xl font-bold text-green-300">${currentPrizePool.topPrize}</div>
                <div className="text-green-400/80 text-sm">🥇 1st Place</div>
              </div>
              <div className="text-center p-3 bg-black/40 rounded-lg border border-yellow-500/20">
                <div className="text-xl font-bold text-blue-300">${currentPrizePool.secondPrize}</div>
                <div className="text-blue-400/80 text-sm">🥈 2nd Place</div>
              </div>
              <div className="text-center p-3 bg-black/40 rounded-lg border border-yellow-500/20">
                <div className="text-xl font-bold text-purple-300">${currentPrizePool.thirdPrize}</div>
                <div className="text-purple-400/80 text-sm">🥉 3rd Place</div>
              </div>
              <div className="text-center p-3 bg-black/40 rounded-lg border border-yellow-500/20">
                <div className="text-xl font-bold text-orange-300">${currentPrizePool.communityBonus}</div>
                <div className="text-orange-400/80 text-sm">🎵 Community</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <Badge className="bg-green-500/20 text-green-300">
                  <Users className="w-3 h-3 mr-1" />
                  {currentPrizePool.contributors} Contributors
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300">
                  <Music className="w-3 h-3 mr-1" />
                  {currentPrizePool.entries} Entries
                </Badge>
                <Badge className="bg-red-500/20 text-red-300">
                  <Clock className="w-3 h-3 mr-1" />
                  {currentPrizePool.timeLeft} Left
                </Badge>
              </div>
              <div className="text-yellow-400/80">Prize pool grows by $5 per entry! 🚀</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Form */}
      <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {enterContest ? "🏆 Contest Entry Upload" : "Upload Your Track"}
          </CardTitle>
          {enterContest && (
            <p className="text-yellow-400/80">🔥 Enter the monthly contest and compete for the prize pool! 🔥</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive
                ? "border-green-400 bg-green-500/10"
                : selectedFile
                  ? "border-green-500 bg-green-500/5"
                  : "border-green-500/30 hover:border-green-400/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                <div>
                  <h3 className="text-green-300 font-semibold text-lg">{selectedFile.name}</h3>
                  <p className="text-green-400/80">{formatFileSize(selectedFile.size)} • Audio File</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedFile(null)}
                  className="text-green-300 border-green-500/30 hover:bg-green-500/10"
                >
                  Choose Different File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <FileAudio className="w-12 h-12 text-green-400/60" />
                </div>
                <div>
                  <h3 className="text-green-300 font-semibold">Drop your audio file here</h3>
                  <p className="text-green-400/80">or click to browse</p>
                  <p className="text-green-400/60 text-sm mt-2">Supports MP3, WAV, FLAC, M4A (Max 50MB)</p>
                </div>
                <input type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" id="file-upload" />
                <Button asChild className="bg-green-500/20 text-green-300 hover:bg-green-500/30">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </label>
                </Button>
              </div>
            )}
          </div>

          {/* Song Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-green-300 mb-2 block">
                  Song Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="Enter your song title..."
                  className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>

              <div>
                <Label className="text-green-300 mb-2 block">
                  Genre <span className="text-red-400">*</span>
                </Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100">
                    <SelectValue placeholder="Select genre..." />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-green-500/30">
                    {genres.map((g) => (
                      <SelectItem key={g} value={g} className="text-green-100 focus:bg-green-500/20">
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-green-300 mb-2 block">Style/Subgenre</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="bg-black/60 border-green-500/30 text-green-100">
                    <SelectValue placeholder="Select style..." />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-green-500/30">
                    {styles.map((s) => (
                      <SelectItem key={s} value={s} className="text-green-100 focus:bg-green-500/20">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-green-300 mb-2 block">Description</Label>
                <Textarea
                  value={songDescription}
                  onChange={(e) => setSongDescription(e.target.value)}
                  placeholder="Tell us about your track..."
                  className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20 min-h-[100px]"
                />
              </div>

              <div>
                <Label className="text-green-300 mb-2 block">Tags</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="trap, heavy, bass (comma separated)"
                  className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
                />
                <p className="text-green-400/60 text-xs mt-1">Add tags to help people discover your music</p>
              </div>
            </div>
          </div>

          {/* Contest Entry Toggle */}
          {!contestMode && (
            <Card className="bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <div>
                      <h4 className="text-yellow-300 font-semibold">Enter Monthly Contest</h4>
                      <p className="text-yellow-400/80 text-sm">Compete for ${currentPrizePool.total} prize pool!</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setEnterContest(!enterContest)}
                    className={`${
                      enterContest
                        ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
                        : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                    }`}
                  >
                    {enterContest ? "✓ Entered" : "Enter Contest"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-green-300">Uploading...</span>
                <span className="text-green-300">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2 bg-black/60" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !songTitle || !genre || isUploading}
            className="w-full h-12 bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading... {uploadProgress}%
              </>
            ) : enterContest ? (
              <>
                <Trophy className="w-5 h-5 mr-2" />🚀 UPLOAD & ENTER CONTEST! 🚀
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Upload Track
              </>
            )}
          </Button>

          {enterContest && (
            <div className="text-center p-4 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/20 rounded-lg">
              <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <p className="text-orange-300 font-medium">Contest Entry Benefits</p>
              <p className="text-orange-400/60 text-sm">
                🏆 Compete for prizes • 📈 Extra promotion • 🎵 Featured placement • 👥 Community voting
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
