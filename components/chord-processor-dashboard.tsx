"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Upload,
  Music,
  Download,
  Play,
  Pause,
  Settings,
  FileMusic,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  RefreshCw,
} from "lucide-react"
import { useChordProcessor } from "@/hooks/use-chord-processor"
import { toast } from "sonner"

interface ChordSet {
  name: string
  chords: string[]
  category: string
  key: string
  mode: string
  complexity: number
}

export function ChordProcessorDashboard() {
  const {
    isProcessing,
    isGenerating,
    processedData,
    generatedMidi,
    error,
    progress,
    processZipFile,
    generateMidi,
    processSets,
    checkSystemStatus,
    runSystemTest,
    reset,
  } = useChordProcessor()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [selectedChords, setSelectedChords] = useState<string[]>([])
  const [midiOptions, setMidiOptions] = useState({
    tempo: 120,
    velocity: 80,
    duration: 1.0,
    octave: 4,
    voicing: "close",
    rhythm: "quarter",
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    loadSystemStatus()
  }, [])

  const loadSystemStatus = async () => {
    try {
      const status = await checkSystemStatus()
      setSystemStatus(status)
    } catch (error) {
      console.error("Failed to load system status:", error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === "application/zip" || file.name.endsWith(".zip")) {
        setSelectedFile(file)
        reset()
      } else {
        toast.error("Please select a ZIP file")
      }
    }
  }

  const handleProcessFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first")
      return
    }

    try {
      await processZipFile(selectedFile)
    } catch (error) {
      console.error("Processing failed:", error)
    }
  }

  const handleGenerateMidi = async () => {
    if (selectedChords.length === 0) {
      toast.error("Please select some chords first")
      return
    }

    try {
      await generateMidi(selectedChords, midiOptions)
    } catch (error) {
      console.error("MIDI generation failed:", error)
    }
  }

  const handleDownloadMidi = () => {
    if (!generatedMidi) {
      toast.error("No MIDI data to download")
      return
    }

    try {
      const binaryString = atob(generatedMidi)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const blob = new Blob([bytes], { type: "audio/midi" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `chords_${Date.now()}.mid`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("MIDI file downloaded")
    } catch (error) {
      toast.error("Failed to download MIDI file")
    }
  }

  const handlePlayMidi = async () => {
    if (!generatedMidi) {
      toast.error("No MIDI data to play")
      return
    }

    try {
      if (isPlaying && currentAudio) {
        currentAudio.pause()
        setIsPlaying(false)
        setCurrentAudio(null)
        return
      }

      // Convert MIDI to audio for playback (simplified)
      // In a real implementation, you'd use a MIDI player library
      const audio = new Audio()
      audio.src = `data:audio/midi;base64,${generatedMidi}`

      audio.onended = () => {
        setIsPlaying(false)
        setCurrentAudio(null)
      }

      audio.onerror = () => {
        toast.error("Failed to play MIDI file")
        setIsPlaying(false)
        setCurrentAudio(null)
      }

      await audio.play()
      setIsPlaying(true)
      setCurrentAudio(audio)
    } catch (error) {
      toast.error("Failed to play MIDI file")
      setIsPlaying(false)
    }
  }

  const toggleChordSelection = (chord: string) => {
    setSelectedChords((prev) => (prev.includes(chord) ? prev.filter((c) => c !== chord) : [...prev, chord]))
  }

  const getSystemStatusIcon = (status: any) => {
    if (!status) return <Loader2 className="h-4 w-4 animate-spin" />

    const isReady =
      status.pythonAvailable && status.dependenciesInstalled && status.scriptsExist && status.directoriesWritable

    return isReady ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getSystemStatusBadge = (status: any) => {
    if (!status) return <Badge variant="secondary">Loading...</Badge>

    const isReady =
      status.pythonAvailable && status.dependenciesInstalled && status.scriptsExist && status.directoriesWritable

    return <Badge variant={isReady ? "default" : "destructive"}>{isReady ? "Ready" : "Error"}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chord Processor Dashboard</h1>
          <p className="text-muted-foreground">Process chord sets and generate MIDI files</p>
        </div>
        <div className="flex items-center gap-2">
          {getSystemStatusIcon(systemStatus)}
          {getSystemStatusBadge(systemStatus)}
        </div>
      </div>

      {/* System Status Alert */}
      {systemStatus && systemStatus.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>System Issues Detected:</strong>
            <ul className="mt-2 list-disc list-inside">
              {systemStatus.errors.map((error: string, index: number) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          <TabsTrigger value="generate">Generate MIDI</TabsTrigger>
          <TabsTrigger value="library">Chord Library</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Upload & Process Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Upload
              </CardTitle>
              <CardDescription>Upload a ZIP file containing chord data for processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select ZIP File</Label>
                <Input id="file-upload" type="file" accept=".zip" onChange={handleFileSelect} disabled={isProcessing} />
              </div>

              {selectedFile && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button onClick={handleProcessFile} disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Process File
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing chord data...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {processedData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Processing Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{processedData.totalChords}</div>
                        <div className="text-sm text-muted-foreground">Total Chords</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{processedData.chordSets.length}</div>
                        <div className="text-sm text-muted-foreground">Chord Sets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Object.keys(processedData.categories).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Categories</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{processedData.processingTime}ms</div>
                        <div className="text-sm text-muted-foreground">Process Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate MIDI Tab */}
        <TabsContent value="generate" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chord Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Chord Selection
                </CardTitle>
                <CardDescription>Select chords to generate MIDI</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {processedData?.chordSets.map((set: ChordSet, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{set.name}</h4>
                          <Badge variant="secondary">{set.category}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {set.chords.map((chord: string, chordIndex: number) => (
                            <Button
                              key={chordIndex}
                              variant={selectedChords.includes(chord) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleChordSelection(chord)}
                            >
                              {chord}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {!processedData && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileMusic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No chord data available</p>
                        <p className="text-sm">Process a file first to see chords</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {selectedChords.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Selected Chords ({selectedChords.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedChords.map((chord, index) => (
                        <Badge key={index} variant="default">
                          {chord}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* MIDI Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  MIDI Options
                </CardTitle>
                <CardDescription>Configure MIDI generation settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tempo: {midiOptions.tempo} BPM</Label>
                  <Slider
                    value={[midiOptions.tempo]}
                    onValueChange={([value]) => setMidiOptions((prev) => ({ ...prev, tempo: value }))}
                    min={60}
                    max={200}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Velocity: {midiOptions.velocity}</Label>
                  <Slider
                    value={[midiOptions.velocity]}
                    onValueChange={([value]) => setMidiOptions((prev) => ({ ...prev, velocity: value }))}
                    min={1}
                    max={127}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Duration: {midiOptions.duration}s</Label>
                  <Slider
                    value={[midiOptions.duration]}
                    onValueChange={([value]) => setMidiOptions((prev) => ({ ...prev, duration: value }))}
                    min={0.25}
                    max={4.0}
                    step={0.25}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Octave</Label>
                  <Select
                    value={midiOptions.octave.toString()}
                    onValueChange={(value) => setMidiOptions((prev) => ({ ...prev, octave: Number.parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Voicing</Label>
                  <Select
                    value={midiOptions.voicing}
                    onValueChange={(value) => setMidiOptions((prev) => ({ ...prev, voicing: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="close">Close</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="drop2">Drop 2</SelectItem>
                      <SelectItem value="drop3">Drop 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rhythm</Label>
                  <Select
                    value={midiOptions.rhythm}
                    onValueChange={(value) => setMidiOptions((prev) => ({ ...prev, rhythm: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whole">Whole Notes</SelectItem>
                      <SelectItem value="half">Half Notes</SelectItem>
                      <SelectItem value="quarter">Quarter Notes</SelectItem>
                      <SelectItem value="eighth">Eighth Notes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleGenerateMidi}
                    disabled={isGenerating || selectedChords.length === 0}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Music className="h-4 w-4 mr-2" />
                        Generate MIDI
                      </>
                    )}
                  </Button>
                </div>

                {generatedMidi && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={handlePlayMidi} className="flex-1 bg-transparent">
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Play
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleDownloadMidi} className="flex-1 bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Chord Library Tab */}
        <TabsContent value="library" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileMusic className="h-5 w-5" />
                Chord Library
              </CardTitle>
              <CardDescription>Browse and manage your processed chord sets</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {processedData?.chordSets.map((set: ChordSet, index: number) => (
                  <Card key={index} className="mb-4">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{set.name}</h3>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{set.category}</Badge>
                          <Badge variant="outline">
                            {set.key} {set.mode}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {set.chords.map((chord: string, chordIndex: number) => (
                          <Badge key={chordIndex} variant="outline">
                            {chord}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Complexity: {set.complexity}/10</span>
                        <span>{set.chords.length} chords</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {!processedData && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileMusic className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No chord sets available</h3>
                    <p className="text-sm">Process a chord file to populate your library</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>Configure chord processor system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Python Environment</h4>
                    <p className="text-sm text-muted-foreground">Python installation and dependencies</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {systemStatus?.pythonAvailable ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={systemStatus?.pythonAvailable ? "default" : "destructive"}>
                      {systemStatus?.pythonAvailable ? "Available" : "Missing"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Dependencies</h4>
                    <p className="text-sm text-muted-foreground">Required Python packages</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {systemStatus?.dependenciesInstalled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={systemStatus?.dependenciesInstalled ? "default" : "destructive"}>
                      {systemStatus?.dependenciesInstalled ? "Installed" : "Missing"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Processing Scripts</h4>
                    <p className="text-sm text-muted-foreground">Backend processing scripts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {systemStatus?.scriptsExist ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={systemStatus?.scriptsExist ? "default" : "destructive"}>
                      {systemStatus?.scriptsExist ? "Available" : "Missing"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">File Permissions</h4>
                    <p className="text-sm text-muted-foreground">Directory write permissions</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {systemStatus?.directoriesWritable ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={systemStatus?.directoriesWritable ? "default" : "destructive"}>
                      {systemStatus?.directoriesWritable ? "Writable" : "Error"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={loadSystemStatus} className="flex-1 bg-transparent">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
                <Button variant="outline" onClick={runSystemTest} className="flex-1 bg-transparent">
                  <Zap className="h-4 w-4 mr-2" />
                  Run Tests
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
