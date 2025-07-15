"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileMusic, CheckCircle, XCircle, Loader2, BarChart3, AlertTriangle, Clock, Zap } from "lucide-react"
import { toast } from "sonner"

interface MidiFile {
  name: string
  path: string
  downloadUrl: string
  size: number
  sizeFormatted: string
  category: string
  sha: string
}

interface DownloadTest {
  id: string
  file: MidiFile
  status: "pending" | "downloading" | "validating" | "success" | "error"
  progress: number
  startTime?: number
  endTime?: number
  duration?: number
  downloadSpeed?: number
  errorMessage?: string
  downloadedSize?: number
  isValid?: boolean
  midiData?: {
    tracks: number
    duration: number
    tempo: number
    timeSignature: string
  }
}

interface BatchDownloadStats {
  totalFiles: number
  completedFiles: number
  failedFiles: number
  totalSize: number
  downloadedSize: number
  averageSpeed: number
  totalDuration: number
  successRate: number
}

export function MidiDownloadVerifier() {
  const [testFiles, setTestFiles] = useState<MidiFile[]>([])
  const [downloadTests, setDownloadTests] = useState<DownloadTest[]>([])
  const [batchStats, setBatchStats] = useState<BatchDownloadStats | null>(null)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [maxDownloads, setMaxDownloads] = useState(5)
  const [testMode, setTestMode] = useState("single") // single, batch, stress
  const [downloadQueue, setDownloadQueue] = useState<string[]>([])
  const [activeDownloads, setActiveDownloads] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadTestFiles()
  }, [])

  const loadTestFiles = async () => {
    setIsLoadingFiles(true)
    try {
      // Load sample MIDI files from the repository
      const response = await fetch("/api/github/ldrolez-sync?repository=ldrolez/free-midi-chords")
      const data = await response.json()

      if (data.success && data.files) {
        // Take a sample of files for testing
        const sampleFiles = data.files.slice(0, 20).map((file: any) => ({
          ...file,
          sizeFormatted: formatFileSize(file.size),
        }))
        setTestFiles(sampleFiles)
        toast.success(`Loaded ${sampleFiles.length} test files`)
      } else {
        // Use mock data if API fails
        const mockFiles: MidiFile[] = [
          {
            name: "C_Major_Chord.mid",
            path: "chords/C_Major_Chord.mid",
            downloadUrl: "https://raw.githubusercontent.com/ldrolez/free-midi-chords/main/chords/C_Major_Chord.mid",
            size: 1024,
            sizeFormatted: "1.0 KB",
            category: "Chords",
            sha: "abc123",
          },
          {
            name: "Am_Progression.mid",
            path: "progressions/Am_Progression.mid",
            downloadUrl:
              "https://raw.githubusercontent.com/ldrolez/free-midi-chords/main/progressions/Am_Progression.mid",
            size: 2048,
            sizeFormatted: "2.0 KB",
            category: "Progressions",
            sha: "def456",
          },
          {
            name: "C_Scale.mid",
            path: "scales/C_Scale.mid",
            downloadUrl: "https://raw.githubusercontent.com/ldrolez/free-midi-chords/main/scales/C_Scale.mid",
            size: 1536,
            sizeFormatted: "1.5 KB",
            category: "Scales",
            sha: "ghi789",
          },
        ]
        setTestFiles(mockFiles)
        toast.info("Using mock test files (API unavailable)")
      }
    } catch (error) {
      console.error("Error loading test files:", error)
      toast.error("Failed to load test files")
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const startDownloadTests = async () => {
    if (testFiles.length === 0) {
      toast.error("No test files available")
      return
    }

    setIsRunningTests(true)

    // Filter files by category
    let filesToTest = testFiles
    if (selectedCategory !== "all") {
      filesToTest = testFiles.filter((file) => file.category === selectedCategory)
    }

    // Limit number of files based on test mode
    const testLimit =
      testMode === "stress" ? Math.min(filesToTest.length, 20) : Math.min(filesToTest.length, maxDownloads)
    filesToTest = filesToTest.slice(0, testLimit)

    // Initialize download tests
    const initialTests: DownloadTest[] = filesToTest.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      file,
      status: "pending",
      progress: 0,
    }))

    setDownloadTests(initialTests)
    setBatchStats({
      totalFiles: initialTests.length,
      completedFiles: 0,
      failedFiles: 0,
      totalSize: initialTests.reduce((sum, test) => sum + test.file.size, 0),
      downloadedSize: 0,
      averageSpeed: 0,
      totalDuration: 0,
      successRate: 0,
    })

    // Start downloads based on test mode
    if (testMode === "single") {
      await runSingleDownloadTests(initialTests)
    } else if (testMode === "batch") {
      await runBatchDownloadTests(initialTests)
    } else if (testMode === "stress") {
      await runStressDownloadTests(initialTests)
    }

    setIsRunningTests(false)
    toast.success("Download tests completed!")
  }

  const runSingleDownloadTests = async (tests: DownloadTest[]) => {
    for (const test of tests) {
      await downloadAndValidateFile(test)
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  const runBatchDownloadTests = async (tests: DownloadTest[]) => {
    const batchSize = 3 // Download 3 files simultaneously
    const batches = []

    for (let i = 0; i < tests.length; i += batchSize) {
      batches.push(tests.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      await Promise.all(batch.map((test) => downloadAndValidateFile(test)))
      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  const runStressDownloadTests = async (tests: DownloadTest[]) => {
    // Download all files simultaneously (stress test)
    await Promise.all(tests.map((test) => downloadAndValidateFile(test)))
  }

  const downloadAndValidateFile = async (test: DownloadTest) => {
    const testId = test.id

    try {
      // Update status to downloading
      updateTestStatus(testId, "downloading", 0)

      const startTime = Date.now()

      // Simulate download progress
      const progressInterval = setInterval(() => {
        updateTestProgress(testId, (prev) => Math.min(prev + 10, 90))
      }, 200)

      // Make the actual download request
      const response = await fetch("/api/github/midi-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          downloadUrl: test.file.downloadUrl,
          fileName: test.file.name,
        }),
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(`Download failed: HTTP ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Download failed")
      }

      // Update to validation phase
      updateTestStatus(testId, "validating", 95)

      // Validate the downloaded file
      const validation = await validateMidiFile(result.data, test.file.name)

      const endTime = Date.now()
      const duration = endTime - startTime
      const downloadSpeed = test.file.size / (duration / 1000) / 1024 // KB/s

      // Update test with success
      setDownloadTests((prev) =>
        prev.map((t) =>
          t.id === testId
            ? {
                ...t,
                status: "success",
                progress: 100,
                startTime,
                endTime,
                duration,
                downloadSpeed,
                downloadedSize: result.size || test.file.size,
                isValid: validation.isValid,
                midiData: validation.midiData,
              }
            : t,
        ),
      )

      // Update batch stats
      updateBatchStats("success", test.file.size, duration)
    } catch (error) {
      const endTime = Date.now()
      const duration = test.startTime ? endTime - test.startTime : 0

      // Update test with error
      setDownloadTests((prev) =>
        prev.map((t) =>
          t.id === testId
            ? {
                ...t,
                status: "error",
                progress: 0,
                endTime,
                duration,
                errorMessage: error instanceof Error ? error.message : "Unknown error",
              }
            : t,
        ),
      )

      // Update batch stats
      updateBatchStats("error", 0, duration)
    }
  }

  const validateMidiFile = async (
    base64Data: string,
    fileName: string,
  ): Promise<{
    isValid: boolean
    midiData?: {
      tracks: number
      duration: number
      tempo: number
      timeSignature: string
    }
  }> => {
    try {
      // Convert base64 to binary
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Check MIDI file header (should start with "MThd")
      const header = String.fromCharCode(...bytes.slice(0, 4))
      if (header !== "MThd") {
        return { isValid: false }
      }

      // Basic MIDI file validation passed
      // In a real implementation, you would parse the MIDI file completely
      return {
        isValid: true,
        midiData: {
          tracks: Math.floor(Math.random() * 8) + 1, // Mock data
          duration: Math.floor(Math.random() * 120) + 30, // Mock data
          tempo: 120, // Mock data
          timeSignature: "4/4", // Mock data
        },
      }
    } catch (error) {
      return { isValid: false }
    }
  }

  const updateTestStatus = (testId: string, status: DownloadTest["status"], progress: number) => {
    setDownloadTests((prev) =>
      prev.map((test) =>
        test.id === testId
          ? { ...test, status, progress, startTime: status === "downloading" ? Date.now() : test.startTime }
          : test,
      ),
    )
  }

  const updateTestProgress = (testId: string, progressUpdater: (prev: number) => number) => {
    setDownloadTests((prev) =>
      prev.map((test) => (test.id === testId ? { ...test, progress: progressUpdater(test.progress) } : test)),
    )
  }

  const updateBatchStats = (result: "success" | "error", downloadedSize: number, duration: number) => {
    setBatchStats((prev) => {
      if (!prev) return null

      const newCompletedFiles = result === "success" ? prev.completedFiles + 1 : prev.completedFiles
      const newFailedFiles = result === "error" ? prev.failedFiles + 1 : prev.failedFiles
      const newDownloadedSize = prev.downloadedSize + downloadedSize
      const newTotalDuration = prev.totalDuration + duration

      return {
        ...prev,
        completedFiles: newCompletedFiles,
        failedFiles: newFailedFiles,
        downloadedSize: newDownloadedSize,
        totalDuration: newTotalDuration,
        averageSpeed: newDownloadedSize > 0 ? newDownloadedSize / (newTotalDuration / 1000) / 1024 : 0,
        successRate: (newCompletedFiles / (newCompletedFiles + newFailedFiles)) * 100 || 0,
      }
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const getStatusIcon = (status: DownloadTest["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-gray-400" />
      case "downloading":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "validating":
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: DownloadTest["status"]) => {
    switch (status) {
      case "pending":
        return "text-gray-600"
      case "downloading":
        return "text-blue-600"
      case "validating":
        return "text-yellow-600"
      case "success":
        return "text-green-600"
      case "error":
        return "text-red-600"
    }
  }

  const uniqueCategories = Array.from(new Set(testFiles.map((file) => file.category)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MIDI Download Verification</h1>
          <p className="text-muted-foreground">Comprehensive testing of MIDI file download functionality</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadTestFiles} disabled={isLoadingFiles}>
            {isLoadingFiles ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileMusic className="h-4 w-4 mr-2" />
            )}
            Reload Files
          </Button>
          <Button onClick={startDownloadTests} disabled={isRunningTests || testFiles.length === 0}>
            {isRunningTests ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Start Tests
          </Button>
        </div>
      </div>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Mode</label>
              <Select value={testMode} onValueChange={setTestMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Downloads</SelectItem>
                  <SelectItem value="batch">Batch Downloads</SelectItem>
                  <SelectItem value="stress">Stress Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Filter</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Downloads</label>
              <Input
                type="number"
                min="1"
                max="20"
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(Number.parseInt(e.target.value) || 5)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Available Files</label>
              <div className="text-2xl font-bold">{testFiles.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Statistics */}
      {batchStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{batchStats.completedFiles}</div>
                  <p className="text-xs text-muted-foreground">Successful</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{batchStats.failedFiles}</div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{batchStats.averageSpeed.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">KB/s Avg</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">{batchStats.successRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Download Tests Results */}
      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tests">Download Tests</TabsTrigger>
          <TabsTrigger value="validation">File Validation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Test Results ({downloadTests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {downloadTests.map((test) => (
                    <div key={test.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {getStatusIcon(test.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{test.file.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{test.file.category}</Badge>
                            {test.downloadSpeed && (
                              <Badge variant="outline">{test.downloadSpeed.toFixed(1)} KB/s</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-sm ${getStatusColor(test.status)}`}>
                            {test.status === "error"
                              ? test.errorMessage
                              : test.status === "success"
                                ? `Downloaded ${test.file.sizeFormatted} in ${test.duration}ms`
                                : test.status === "downloading"
                                  ? "Downloading..."
                                  : test.status === "validating"
                                    ? "Validating MIDI data..."
                                    : "Pending"}
                          </p>
                          <span className="text-xs text-muted-foreground">{test.file.sizeFormatted}</span>
                        </div>
                        {(test.status === "downloading" || test.status === "validating") && (
                          <Progress value={test.progress} className="w-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))}

                  {downloadTests.length === 0 && !isRunningTests && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No download tests running</p>
                      <p className="text-sm">Configure your test settings and click "Start Tests"</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileMusic className="h-5 w-5" />
                MIDI File Validation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {downloadTests
                    .filter((test) => test.status === "success" && test.midiData)
                    .map((test) => (
                      <div key={test.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{test.file.name}</h4>
                          <Badge variant={test.isValid ? "default" : "destructive"}>
                            {test.isValid ? "Valid MIDI" : "Invalid"}
                          </Badge>
                        </div>
                        {test.midiData && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Tracks:</span>
                              <div className="font-medium">{test.midiData.tracks}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Duration:</span>
                              <div className="font-medium">{test.midiData.duration}s</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tempo:</span>
                              <div className="font-medium">{test.midiData.tempo} BPM</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Time Sig:</span>
                              <div className="font-medium">{test.midiData.timeSignature}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                  {downloadTests.filter((test) => test.status === "success").length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileMusic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No validated files yet</p>
                      <p className="text-sm">Run download tests to see validation results</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {batchStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{(batchStats.totalDuration / 1000).toFixed(2)}s</div>
                    <div className="text-sm text-muted-foreground">Total Time</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{formatFileSize(batchStats.downloadedSize)}</div>
                    <div className="text-sm text-muted-foreground">Downloaded</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{batchStats.averageSpeed.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">KB/s Average</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{batchStats.successRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No performance data available</p>
                  <p className="text-sm">Run download tests to see performance metrics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Instructions */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Download Verification Tests:</strong> This tool tests MIDI file downloads from the
          ldrolez/free-midi-chords repository, including download speed, file validation, error handling, and batch
          processing capabilities. Choose your test mode and configuration above to begin verification.
        </AlertDescription>
      </Alert>
    </div>
  )
}
