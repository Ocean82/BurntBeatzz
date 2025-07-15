"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Github, Upload, Settings } from "lucide-react"
import { MidiFileUploader } from "@/components/midi-file-uploader"
import { GitHubMidiLoader } from "@/components/github-midi-loader"
import { RvcBatchProcessor } from "@/components/rvc-batch-processor"

export default function MidiProcessorPage() {
  const [loadedFiles, setLoadedFiles] = useState<File[]>([])

  const handleFilesLoaded = (files: File[]) => {
    setLoadedFiles((prev) => {
      // Avoid duplicates based on file name and size
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`))
      const newFiles = files.filter((f) => !existing.has(`${f.name}-${f.size}`))
      return [...prev, ...newFiles]
    })
  }

  const removeFile = (index: number) => {
    setLoadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearAllFiles = () => {
    setLoadedFiles([])
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">MIDI to RVC Processor</h1>
        <p className="text-muted-foreground">
          Upload MIDI files or load from GitHub repositories, then process them through RVC voice conversion
        </p>
      </div>

      {/* File Summary */}
      {loadedFiles.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Loaded Files ({loadedFiles.length})
              </div>
              <Badge variant="secondary">{loadedFiles.length} files ready for processing</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{loadedFiles.length}</div>
                <div className="text-sm text-muted-foreground">Total Files</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {(loadedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)}MB
                </div>
                <div className="text-sm text-muted-foreground">Total Size</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {new Set(loadedFiles.map((f) => f.name.split(".").pop()?.toLowerCase())).size}
                </div>
                <div className="text-sm text-muted-foreground">File Types</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="github" className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub Loader
          </TabsTrigger>
          <TabsTrigger value="process" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Batch Process
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            File Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <MidiFileUploader onFilesLoaded={handleFilesLoaded} />
        </TabsContent>

        <TabsContent value="github">
          <GitHubMidiLoader onFilesLoaded={handleFilesLoaded} />
        </TabsContent>

        <TabsContent value="process">
          <RvcBatchProcessor files={loadedFiles} onRemoveFile={removeFile} onClearAll={clearAllFiles} />
        </TabsContent>

        <TabsContent value="library">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                File Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadedFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No files loaded yet</p>
                  <p className="text-sm">Upload files or load from GitHub to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {loadedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Music className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB • Last modified:{" "}
                            {new Date(file.lastModified).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">MIDI</Badge>
                        <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700 p-1">
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
