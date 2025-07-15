"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Square, Download, Trash2, Settings, Music, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ProcessingJob {
  id: string
  fileName: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  error?: string
  outputUrl?: string
  startTime?: number
  endTime?: number
}

interface BatchSettings {
  voiceModel: string
  tempo: number
  key: string
  quality: "draft" | "standard" | "high"
  outputFormat: "wav" | "mp3"
}

interface RvcBatchProcessorProps {
  files: File[]
  onRemoveFile: (index: number) => void
  onClearAll: () => void
}

export function RvcBatchProcessor({ files, onRemoveFile, onClearAll }: RvcBatchProcessorProps) {
  const [jobs, setJobs] = useState<ProcessingJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentJobIndex, setCurrentJobIndex] = useState(-1)
  const [settings, setSettings] = useState<BatchSettings>({
    voiceModel: "default",
    tempo: 120,
    key: "C",
    quality: "standard",
    outputFormat: "wav",
  })

  // Available voice models (these would come from your RVC service)
  const voiceModels = [
    { id: "default", name: "Default Voice" },
    { id: "female-pop", name: "Female Pop Singer" },
    { id: "male-rock", name: "Male Rock Singer" },
    { id: "jazz-vocalist", name: "Jazz Vocalist" },
    { id: "classical", name: "Classical Singer" },
  ]

  const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

  // Initialize jobs when files change
  useEffect(() => {
    const newJobs = files.map((file, index) => ({
      id: `job-${Date.now()}-${index}`,
      fileName: file.name,
      status: "pending" as const,
      progress: 0,
    }))
    setJobs(newJobs)
  }, [files])

  const processFile = useCallback(
    async (file: File, jobId: string): Promise<string> => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("voiceModel", settings.voiceModel)
      formData.append("tempo", settings.tempo.toString())
      formData.append("key", settings.key)
      formData.append("quality", settings.quality)
      formData.append("outputFormat", settings.outputFormat)

      const response = await fetch("/api/midi/convert-rvc", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Processing failed")
      }

      const result = await response.json()
      return result.outputUrl
    },
    [settings],
  )

  const updateJobStatus = useCallback((jobId: string, updates: Partial<ProcessingJob>) => {
    setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, ...updates } : job)))
  }, [])

  const startBatchProcessing = useCallback(async () => {
    if (files.length === 0) {
      toast.error("No files to process")
      return
    }

    setIsProcessing(true)
    setCurrentJobIndex(0)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const job = jobs[i]

      if (!job) continue

      setCurrentJobIndex(i)
      updateJobStatus(job.id, {
        status: "processing",
        progress: 0,
        startTime: Date.now(),
      })

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          updateJobStatus(job.id, {
            progress: Math.min(95, (Date.now() - (job.startTime || Date.now())) / 100),
          })
        }, 500)

        const outputUrl = await processFile(file, job.id)

        clearInterval(progressInterval)

        updateJobStatus(job.id, {
          status: "completed",
          progress: 100,
          outputUrl,
          endTime: Date.now(),
        })

        toast.success(`Completed processing ${file.name}`)

        // Small delay between files to prevent server overload
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        updateJobStatus(job.id, {
          status: "failed",
          progress: 0,
          error: error instanceof Error ? error.message : "Unknown error",
          endTime: Date.now(),
        })

        toast.error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    setIsProcessing(false)
    setCurrentJobIndex(-1)
    toast.success("Batch processing completed!")
  }, [files, jobs, processFile, updateJobStatus])

  const stopProcessing = useCallback(() => {
    setIsProcessing(false)
    setCurrentJobIndex(-1)

    // Update any processing jobs to failed
    setJobs((prev) =>
      prev.map((job) => (job.status === "processing" ? { ...job, status: "failed", error: "Cancelled by user" } : job)),
    )

    toast.info("Batch processing stopped")
  }, [])

  const downloadFile = useCallback(
    async (job: ProcessingJob) => {
      if (!job.outputUrl) return

      try {
        const response = await fetch(job.outputUrl)
        const blob = await response.blob()

        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `processed_${job.fileName.replace(/\.[^/.]+$/, "")}.${settings.outputFormat}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success(`Downloaded ${job.fileName}`)
      } catch (error) {
        toast.error("Failed to download file")
      }
    },
    [settings.outputFormat],
  )

  const downloadAllCompleted = useCallback(async () => {
    const completedJobs = jobs.filter((job) => job.status === "completed" && job.outputUrl)

    if (completedJobs.length === 0) {
      toast.error("No completed files to download")
      return
    }

    for (const job of completedJobs) {
      await downloadFile(job)
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }, [jobs, downloadFile])

  const getStatusIcon = (status: ProcessingJob["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-gray-500" />
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: ProcessingJob["status"]) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "processing":
        return "default"
      case "completed":
        return "default"
      case "failed":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const formatDuration = (startTime?: number, endTime?: number) => {
    if (!startTime) return ""
    const duration = (endTime || Date.now()) - startTime
    return `${(duration / 1000).toFixed(1)}s`
  }

  const completedCount = jobs.filter((job) => job.status === "completed").length
  const failedCount = jobs.filter((job) => job.status === "failed").length
  const overallProgress = jobs.length > 0 ? ((completedCount + failedCount) / jobs.length) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Batch Processing Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Voice Model</Label>
              <Select
                value={settings.voiceModel}
                onValueChange={(value) => setSettings((prev) => ({ ...prev, voiceModel: value }))}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voiceModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tempo (BPM)</Label>
              <Input
                type="number"
                min="60"
                max="200"
                value={settings.tempo}
                onChange={(e) => setSettings((prev) => ({ ...prev, tempo: Number.parseInt(e.target.value) || 120 }))}
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label>Key</Label>
              <Select
                value={settings.key}
                onValueChange={(value) => setSettings((prev) => ({ ...prev, key: value }))}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {keys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quality</Label>
              <Select
                value={settings.quality}
                onValueChange={(value: "draft" | "standard" | "high") =>
                  setSettings((prev) => ({ ...prev, quality: value }))
                }
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (Fast)</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Batch Processing Queue ({jobs.length} files)
            </div>
            <div className="flex items-center gap-2">
              {jobs.length > 0 && (
                <Button variant="outline" size="sm" onClick={onClearAll} disabled={isProcessing}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
              {completedCount > 0 && (
                <Button variant="outline" size="sm" onClick={downloadAllCompleted}>
                  <Download className="h-4 w-4 mr-2" />
                  Download All ({completedCount})
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Progress */}
          {jobs.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>
                  {completedCount}/{jobs.length} completed
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{completedCount} completed</span>
                <span>{failedCount} failed</span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button onClick={startBatchProcessing} disabled={isProcessing || jobs.length === 0} className="flex-1">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Batch Processing
                </>
              )}
            </Button>

            {isProcessing && (
              <Button variant="destructive" onClick={stopProcessing}>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
          </div>

          {/* Job List */}
          {jobs.length > 0 && (
            <>
              <Separator />
              <ScrollArea className="h-64 w-full">
                <div className="space-y-2">
                  {jobs.map((job, index) => (
                    <div
                      key={job.id}
                      className={`p-3 border rounded-lg ${currentJobIndex === index ? "border-blue-500 bg-blue-50" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <div className="font-medium text-sm">{job.fileName}</div>
                            <div className="text-xs text-muted-foreground">
                              <Badge variant={getStatusColor(job.status)} className="mr-2">
                                {job.status}
                              </Badge>
                              {formatDuration(job.startTime, job.endTime)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {job.status === "processing" && (
                            <div className="text-xs text-muted-foreground">{Math.round(job.progress)}%</div>
                          )}

                          {job.status === "completed" && job.outputUrl && (
                            <Button size="sm" variant="outline" onClick={() => downloadFile(job)}>
                              <Download className="h-3 w-3" />
                            </Button>
                          )}

                          {job.status === "pending" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemoveFile(index)}
                              disabled={isProcessing}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {job.status === "processing" && <Progress value={job.progress} className="h-1 mt-2" />}

                      {job.error && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertDescription className="text-xs">{job.error}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {jobs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No MIDI files loaded for processing</p>
              <p className="text-sm">Upload files or load from GitHub to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
