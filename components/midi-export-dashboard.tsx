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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Download,
  FileText,
  Archive,
  Database,
  Code,
  File,
  History,
  Trash2,
  Eye,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings,
  Loader2,
  FileDown,
  Package,
} from "lucide-react"
import { toast } from "sonner"
import { useMidiExport } from "@/hooks/use-midi-export"
import { multiRepoSyncService } from "@/lib/services/multi-repo-sync-service"

interface MidiFile {
  name: string
  path: string
  repository: string
  content: string
  size: number
  downloadUrl: string
  sha: string
  lastModified: string
}

interface ExportOptions {
  format: "json" | "csv" | "xml" | "zip" | "individual"
  includeContent: boolean
  includeMetadata: boolean
  filterByRepository?: string
  filterByFileType?: string
  customFields?: string[]
  compression?: boolean
}

export function MidiExportDashboard() {
  const {
    loading,
    exporting,
    exportHistory,
    exportProgress,
    exportFiles,
    loadExportHistory,
    generateReport,
    getExportDetails,
    clearExportHistory,
    downloadExportAsBlob,
    formatFileSize,
    getExportStats,
  } = useMidiExport()

  const [midiFiles, setMidiFiles] = useState<MidiFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("export")
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Export options state
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "json",
    includeContent: true,
    includeMetadata: true,
    compression: true,
    customFields: [],
  })

  // Filter state
  const [filters, setFilters] = useState({
    repository: "all",
    fileType: "all",
    search: "",
  })

  useEffect(() => {
    loadMidiFiles()
    loadExportHistory()
  }, [loadExportHistory])

  const loadMidiFiles = async () => {
    try {
      const files = multiRepoSyncService.getMidiFiles()
      setMidiFiles(files)
    } catch (error) {
      console.error("Error loading MIDI files:", error)
      toast.error("Failed to load MIDI files")
    }
  }

  const filteredFiles = midiFiles.filter((file) => {
    // Repository filter
    if (filters.repository !== "all" && file.repository !== filters.repository) {
      return false
    }

    // File type filter
    if (filters.fileType !== "all") {
      const extension = file.name.toLowerCase().split(".").pop()
      if (extension !== filters.fileType) {
        return false
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        file.name.toLowerCase().includes(searchLower) ||
        file.path.toLowerCase().includes(searchLower) ||
        file.repository.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const handleExport = async () => {
    const filesToExport =
      selectedFiles.size > 0 ? filteredFiles.filter((file) => selectedFiles.has(file.sha)) : filteredFiles

    if (filesToExport.length === 0) {
      toast.error("No files selected for export")
      return
    }

    const options: ExportOptions = {
      ...exportOptions,
      filterByRepository: filters.repository !== "all" ? filters.repository : undefined,
      filterByFileType: filters.fileType !== "all" ? filters.fileType : undefined,
    }

    await exportFiles(filesToExport, options, Array.from(selectedFiles))
  }

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(filteredFiles.map((file) => file.sha)))
    }
  }

  const handleFileSelect = (sha: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(sha)) {
      newSelected.delete(sha)
    } else {
      newSelected.add(sha)
    }
    setSelectedFiles(newSelected)
  }

  const handleGenerateReport = async () => {
    const repository = filters.repository !== "all" ? filters.repository : undefined
    const report = await generateReport(repository)

    if (report) {
      downloadExportAsBlob(report, `midi-report-${Date.now()}.md`, "text/markdown")
    }
  }

  const getRepositories = () => {
    const repos = new Set(midiFiles.map((file) => file.repository))
    return Array.from(repos).sort()
  }

  const getFileTypes = () => {
    const types = new Set(midiFiles.map((file) => file.name.toLowerCase().split(".").pop() || "unknown"))
    return Array.from(types).sort()
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "json":
        return <Code className="h-4 w-4" />
      case "csv":
        return <FileText className="h-4 w-4" />
      case "xml":
        return <Database className="h-4 w-4" />
      case "zip":
        return <Archive className="h-4 w-4" />
      case "individual":
        return <File className="h-4 w-4" />
      default:
        return <FileDown className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const stats = getExportStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MIDI Export Dashboard</h1>
          <p className="text-muted-foreground">Export synced MIDI files and metadata in various formats</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadMidiFiles} disabled={loading}>
            <Package className="h-4 w-4 mr-2" />
            Refresh Files
          </Button>
          <Button variant="outline" onClick={handleGenerateReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Export Progress */}
      {exporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Exporting files...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{midiFiles.length}</div>
            <p className="text-xs text-muted-foreground">Total Files</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredFiles.length}</div>
            <p className="text-xs text-muted-foreground">Filtered Files</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{selectedFiles.size}</div>
            <p className="text-xs text-muted-foreground">Selected Files</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalExports}</div>
            <p className="text-xs text-muted-foreground">Total Exports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSizeExported)}</div>
            <p className="text-xs text-muted-foreground">Total Exported</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="export">Export Files</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File Selection */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>File Selection</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleSelectAll}>
                        {selectedFiles.size === filteredFiles.length ? "Deselect All" : "Select All"}
                      </Button>
                      <Badge variant="secondary">
                        {selectedFiles.size} / {filteredFiles.length} selected
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label>Repository</Label>
                      <Select
                        value={filters.repository}
                        onValueChange={(value) => setFilters({ ...filters, repository: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Repositories</SelectItem>
                          {getRepositories().map((repo) => (
                            <SelectItem key={repo} value={repo}>
                              {repo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>File Type</Label>
                      <Select
                        value={filters.fileType}
                        onValueChange={(value) => setFilters({ ...filters, fileType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {getFileTypes().map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Search</Label>
                      <Input
                        placeholder="Search files..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* File List */}
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {filteredFiles.map((file) => (
                        <div
                          key={file.sha}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedFiles.has(file.sha) ? "bg-primary/10 border-primary" : "hover:bg-muted"
                          }`}
                          onClick={() => handleFileSelect(file.sha)}
                        >
                          <Checkbox checked={selectedFiles.has(file.sha)} onChange={() => handleFileSelect(file.sha)} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{file.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {file.repository} • {file.path}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Export Options */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Export Options</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Format Selection */}
                  <div className="space-y-2">
                    <Label>Export Format</Label>
                    <Select
                      value={exportOptions.format}
                      onValueChange={(value: any) => setExportOptions({ ...exportOptions, format: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            JSON
                          </div>
                        </SelectItem>
                        <SelectItem value="csv">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            CSV
                          </div>
                        </SelectItem>
                        <SelectItem value="xml">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            XML
                          </div>
                        </SelectItem>
                        <SelectItem value="zip">
                          <div className="flex items-center gap-2">
                            <Archive className="h-4 w-4" />
                            ZIP Archive
                          </div>
                        </SelectItem>
                        <SelectItem value="individual">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4" />
                            Individual Files
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Basic Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeContent">Include File Content</Label>
                      <Switch
                        id="includeContent"
                        checked={exportOptions.includeContent}
                        onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeContent: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeMetadata">Include Metadata</Label>
                      <Switch
                        id="includeMetadata"
                        checked={exportOptions.includeMetadata}
                        onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeMetadata: checked })}
                      />
                    </div>
                    {exportOptions.format === "zip" && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="compression">Enable Compression</Label>
                        <Switch
                          id="compression"
                          checked={exportOptions.compression}
                          onCheckedChange={(checked) => setExportOptions({ ...exportOptions, compression: checked })}
                        />
                      </div>
                    )}
                  </div>

                  {/* Advanced Options */}
                  {showAdvanced && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <Label>Custom Fields</Label>
                        <div className="space-y-2">
                          {[
                            "fileExtension",
                            "repositoryOwner",
                            "repositoryName",
                            "directoryPath",
                            "sizeKB",
                            "sizeMB",
                          ].map((field) => (
                            <div key={field} className="flex items-center space-x-2">
                              <Checkbox
                                id={field}
                                checked={exportOptions.customFields?.includes(field)}
                                onCheckedChange={(checked) => {
                                  const fields = exportOptions.customFields || []
                                  if (checked) {
                                    setExportOptions({ ...exportOptions, customFields: [...fields, field] })
                                  } else {
                                    setExportOptions({
                                      ...exportOptions,
                                      customFields: fields.filter((f) => f !== field),
                                    })
                                  }
                                }}
                              />
                              <Label htmlFor={field} className="text-sm">
                                {field}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Export Button */}
                  <Button
                    onClick={handleExport}
                    disabled={exporting || (selectedFiles.size === 0 && filteredFiles.length === 0)}
                    className="w-full"
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Export{" "}
                    {selectedFiles.size > 0 ? `${selectedFiles.size} Selected` : `${filteredFiles.length} Filtered`}{" "}
                    Files
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Export History
                </span>
                <Button variant="outline" onClick={clearExportHistory}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {exportHistory.map((export_) => (
                    <Card key={export_.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(export_.status)}
                              {getFormatIcon(export_.result.format)}
                              <span className="font-medium">{export_.result.filename}</span>
                              <Badge
                                variant={
                                  export_.status === "completed"
                                    ? "default"
                                    : export_.status === "failed"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {export_.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {export_.result.fileCount} files • {formatFileSize(export_.result.size)} •{" "}
                              {new Date(export_.timestamp).toLocaleString()}
                            </div>
                            {export_.result.error && (
                              <Alert>
                                <AlertDescription className="text-sm">{export_.result.error}</AlertDescription>
                              </Alert>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => getExportDetails(export_.id)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(export_.id)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Export Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{stats.successfulExports}</div>
                    <p className="text-xs text-muted-foreground">Successful Exports</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.failedExports}</div>
                    <p className="text-xs text-muted-foreground">Failed Exports</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.totalFilesExported}</div>
                    <p className="text-xs text-muted-foreground">Files Exported</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.mostUsedFormat.toUpperCase()}</div>
                    <p className="text-xs text-muted-foreground">Most Used Format</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {exportHistory.slice(0, 10).map((export_) => (
                      <div key={export_.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(export_.status)}
                          <span className="text-sm">{export_.result.format.toUpperCase()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(export_.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Export Format</Label>
                <Select
                  value={exportOptions.format}
                  onValueChange={(value: any) => setExportOptions({ ...exportOptions, format: value })}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="zip">ZIP Archive</SelectItem>
                    <SelectItem value="individual">Individual Files</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Include Content by Default</Label>
                  <Switch
                    checked={exportOptions.includeContent}
                    onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeContent: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Include Metadata by Default</Label>
                  <Switch
                    checked={exportOptions.includeMetadata}
                    onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeMetadata: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable Compression by Default</Label>
                  <Switch
                    checked={exportOptions.compression}
                    onCheckedChange={(checked) => setExportOptions({ ...exportOptions, compression: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
