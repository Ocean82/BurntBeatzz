"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Download,
  Database,
  Eye,
  History,
  Loader2,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Files,
  HardDrive,
  Clock,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import { useMidiExport } from "@/hooks/use-midi-export"

const AVAILABLE_REPOSITORIES = [
  "ldrolez/free-midi-chords",
  "beiciliang/midi-dataset",
  "music21/music21",
  "craffel/pretty-midi",
  "vishnubob/python-midi",
  "mido/mido",
]

const FILE_TYPES = [".mid", ".midi", ".json", ".xml", ".txt"]

export default function ExportDashboard() {
  const {
    exporting,
    exportHistory,
    preview,
    loading,
    generatePreview,
    exportMidi,
    downloadExport,
    validateOptions,
    clearHistory,
    stats,
    hasHistory,
  } = useMidiExport()

  const [activeTab, setActiveTab] = useState("export")
  const [exportFormat, setExportFormat] = useState<"json" | "csv" | "xml" | "zip" | "individual">("zip")
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>(["ldrolez/free-midi-chords"])
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([".mid", ".midi"])
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [customFilter, setCustomFilter] = useState("")
  const [maxFiles, setMaxFiles] = useState<number>(1000)
  const [sortBy, setSortBy] = useState<"name" | "size" | "date" | "repository">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const exportOptions = {
    format: exportFormat,
    repositories: selectedRepositories,
    fileTypes: selectedFileTypes,
    includeMetadata,
    customFilter: customFilter || undefined,
    maxFiles,
    sortBy,
    sortOrder,
  }

  const handlePreview = async () => {
    const errors = validateOptions(exportOptions)
    if (errors.length > 0) {
      toast.error(errors[0])
      return
    }

    await generatePreview(exportOptions)
  }

  const handleExport = async () => {
    const errors = validateOptions(exportOptions)
    if (errors.length > 0) {
      toast.error(errors[0])
      return
    }

    await exportMidi(exportOptions)
  }

  const toggleRepository = (repo: string) => {
    setSelectedRepositories((prev) => (prev.includes(repo) ? prev.filter((r) => r !== repo) : [...prev, repo]))
  }

  const toggleFileType = (type: string) => {
    setSelectedFileTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MIDI Export Dashboard</h1>
          <p className="text-muted-foreground">Export and manage your MIDI collection</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Database className="h-3 w-3 mr-1" />
            {AVAILABLE_REPOSITORIES.length} Repositories
          </Badge>
          <Badge variant="secondary">{stats.totalExports} Exports</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON Archive</SelectItem>
                      <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                      <SelectItem value="xml">XML Document</SelectItem>
                      <SelectItem value="zip">ZIP Archive</SelectItem>
                      <SelectItem value="individual">Individual Files</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Repositories</Label>
                  <div className="space-y-2">
                    {AVAILABLE_REPOSITORIES.map((repo) => (
                      <div key={repo} className="flex items-center space-x-2">
                        <Checkbox
                          id={repo}
                          checked={selectedRepositories.includes(repo)}
                          onCheckedChange={() => toggleRepository(repo)}
                        />
                        <Label htmlFor={repo} className="text-sm">
                          {repo}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>File Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {FILE_TYPES.map((type) => (
                      <Button
                        key={type}
                        variant={selectedFileTypes.includes(type) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleFileType(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxFiles">Max Files</Label>
                    <Input
                      id="maxFiles"
                      type="number"
                      value={maxFiles}
                      onChange={(e) => setMaxFiles(Number.parseInt(e.target.value) || 1000)}
                      min={1}
                      max={50000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="size">Size</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="repository">Repository</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customFilter">Custom Filter (optional)</Label>
                  <Input
                    id="customFilter"
                    value={customFilter}
                    onChange={(e) => setCustomFilter(e.target.value)}
                    placeholder="e.g., chord, progression, major"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMetadata"
                    checked={includeMetadata}
                    onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                  />
                  <Label htmlFor="includeMetadata">Include metadata</Label>
                </div>
              </CardContent>
            </Card>

            {/* Export Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Export Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handlePreview} disabled={loading} className="w-full bg-transparent" variant="outline">
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                  Generate Preview
                </Button>

                <Button onClick={handleExport} disabled={exporting || !preview} className="w-full">
                  {exporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Start Export
                </Button>

                {preview && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Ready to export {preview.totalFiles.toLocaleString()} files ({formatBytes(preview.totalSize)})
                      <br />
                      Estimated time: {formatDuration(preview.estimatedTime)}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Selected: {selectedRepositories.length} repositories</div>
                  <div>• File types: {selectedFileTypes.join(", ")}</div>
                  <div>• Format: {exportFormat.toUpperCase()}</div>
                  <div>• Max files: {maxFiles.toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          {preview ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Files className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold">{preview.totalFiles.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Files</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold">{formatBytes(preview.totalSize)}</div>
                      <div className="text-sm text-muted-foreground">Total Size</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <div>
                      <div className="text-2xl font-bold">{formatDuration(preview.estimatedTime)}</div>
                      <div className="text-sm text-muted-foreground">Est. Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="text-2xl font-bold">{Object.keys(preview.repositories).length}</div>
                      <div className="text-sm text-muted-foreground">Repositories</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-8">Generate a preview to see export details</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Export History
                </div>
                {hasHistory && (
                  <Button variant="outline" size="sm" onClick={clearHistory}>
                    Clear History
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {exportHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No exports yet</div>
                  ) : (
                    exportHistory.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <div className="font-medium">{result.options.format.toUpperCase()} Export</div>
                            <div className="text-sm text-muted-foreground">
                              {result.stats.filesProcessed.toLocaleString()} files •{" "}
                              {formatBytes(result.stats.totalSize)} • {new Date(result.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.success && result.downloadUrl && (
                            <Button variant="outline" size="sm" onClick={() => downloadExport(result)}>
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalExports}</div>
                    <div className="text-sm text-muted-foreground">Total Exports</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Files className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalFilesProcessed.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Files Processed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{formatBytes(stats.totalSizeProcessed)}</div>
                    <div className="text-sm text-muted-foreground">Data Processed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
