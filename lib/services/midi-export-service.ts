import JSZip from "jszip"
import { saveAs } from "file-saver"

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

interface ExportResult {
  success: boolean
  filename: string
  size: number
  fileCount: number
  format: string
  downloadUrl?: string
  error?: string
  exportId: string
  timestamp: string
}

interface ExportHistory {
  id: string
  timestamp: string
  options: ExportOptions
  result: ExportResult
  status: "pending" | "completed" | "failed"
}

export class MidiExportService {
  private exportHistory: Map<string, ExportHistory> = new Map()

  async exportMidiFiles(files: MidiFile[], options: ExportOptions): Promise<ExportResult> {
    const exportId = this.generateExportId()
    const timestamp = new Date().toISOString()

    try {
      console.log(`🔄 Starting export ${exportId} with format: ${options.format}`)

      // Filter files based on options
      const filteredFiles = this.filterFiles(files, options)

      if (filteredFiles.length === 0) {
        throw new Error("No files match the export criteria")
      }

      let result: ExportResult

      switch (options.format) {
        case "json":
          result = await this.exportAsJson(filteredFiles, options, exportId, timestamp)
          break
        case "csv":
          result = await this.exportAsCsv(filteredFiles, options, exportId, timestamp)
          break
        case "xml":
          result = await this.exportAsXml(filteredFiles, options, exportId, timestamp)
          break
        case "zip":
          result = await this.exportAsZip(filteredFiles, options, exportId, timestamp)
          break
        case "individual":
          result = await this.exportIndividualFiles(filteredFiles, options, exportId, timestamp)
          break
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }

      // Store export history
      this.exportHistory.set(exportId, {
        id: exportId,
        timestamp,
        options,
        result,
        status: "completed",
      })

      console.log(`✅ Export ${exportId} completed successfully`)
      return result
    } catch (error) {
      const errorResult: ExportResult = {
        success: false,
        filename: "",
        size: 0,
        fileCount: 0,
        format: options.format,
        error: error instanceof Error ? error.message : "Unknown error",
        exportId,
        timestamp,
      }

      this.exportHistory.set(exportId, {
        id: exportId,
        timestamp,
        options,
        result: errorResult,
        status: "failed",
      })

      console.error(`❌ Export ${exportId} failed:`, error)
      return errorResult
    }
  }

  private filterFiles(files: MidiFile[], options: ExportOptions): MidiFile[] {
    return files.filter((file) => {
      // Filter by repository
      if (options.filterByRepository && file.repository !== options.filterByRepository) {
        return false
      }

      // Filter by file type
      if (options.filterByFileType) {
        const extension = file.name.toLowerCase().split(".").pop()
        if (extension !== options.filterByFileType.toLowerCase()) {
          return false
        }
      }

      return true
    })
  }

  private async exportAsJson(
    files: MidiFile[],
    options: ExportOptions,
    exportId: string,
    timestamp: string,
  ): Promise<ExportResult> {
    const exportData = {
      metadata: {
        exportId,
        timestamp,
        totalFiles: files.length,
        exportOptions: options,
        generatedBy: "Burnt Beats MIDI Export Service",
        version: "1.0.0",
      },
      repositories: this.groupFilesByRepository(files),
      files: files.map((file) => this.formatFileForExport(file, options)),
      statistics: this.generateStatistics(files),
    }

    const jsonContent = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json" })
    const filename = `midi-export-${exportId}.json`

    saveAs(blob, filename)

    return {
      success: true,
      filename,
      size: blob.size,
      fileCount: files.length,
      format: "json",
      exportId,
      timestamp,
    }
  }

  private async exportAsCsv(
    files: MidiFile[],
    options: ExportOptions,
    exportId: string,
    timestamp: string,
  ): Promise<ExportResult> {
    const headers = [
      "Name",
      "Path",
      "Repository",
      "Size (bytes)",
      "Last Modified",
      "SHA",
      "Download URL",
      ...(options.customFields || []),
    ]

    const rows = files.map((file) => [
      file.name,
      file.path,
      file.repository,
      file.size.toString(),
      file.lastModified,
      file.sha,
      file.downloadUrl,
      ...(options.customFields?.map((field) => this.getCustomFieldValue(file, field)) || []),
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const filename = `midi-export-${exportId}.csv`

    saveAs(blob, filename)

    return {
      success: true,
      filename,
      size: blob.size,
      fileCount: files.length,
      format: "csv",
      exportId,
      timestamp,
    }
  }

  private async exportAsXml(
    files: MidiFile[],
    options: ExportOptions,
    exportId: string,
    timestamp: string,
  ): Promise<ExportResult> {
    const xmlContent = this.generateXmlContent(files, options, exportId, timestamp)
    const blob = new Blob([xmlContent], { type: "application/xml" })
    const filename = `midi-export-${exportId}.xml`

    saveAs(blob, filename)

    return {
      success: true,
      filename,
      size: blob.size,
      fileCount: files.length,
      format: "xml",
      exportId,
      timestamp,
    }
  }

  private async exportAsZip(
    files: MidiFile[],
    options: ExportOptions,
    exportId: string,
    timestamp: string,
  ): Promise<ExportResult> {
    const zip = new JSZip()

    // Add metadata file
    if (options.includeMetadata) {
      const metadata = {
        exportId,
        timestamp,
        totalFiles: files.length,
        exportOptions: options,
        statistics: this.generateStatistics(files),
      }
      zip.file("metadata.json", JSON.stringify(metadata, null, 2))
    }

    // Group files by repository
    const filesByRepo = this.groupFilesByRepository(files)

    for (const [repository, repoFiles] of Object.entries(filesByRepo)) {
      const repoFolder = zip.folder(repository.replace("/", "_"))

      for (const file of repoFiles) {
        if (options.includeContent && file.content) {
          // Add file content
          repoFolder?.file(file.name, file.content)
        }

        // Add file metadata
        const fileMetadata = this.formatFileForExport(file, options)
        repoFolder?.file(`${file.name}.metadata.json`, JSON.stringify(fileMetadata, null, 2))
      }
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: options.compression ? "DEFLATE" : "STORE",
      compressionOptions: {
        level: 6,
      },
    })

    const filename = `midi-export-${exportId}.zip`
    saveAs(zipBlob, filename)

    return {
      success: true,
      filename,
      size: zipBlob.size,
      fileCount: files.length,
      format: "zip",
      exportId,
      timestamp,
    }
  }

  private async exportIndividualFiles(
    files: MidiFile[],
    options: ExportOptions,
    exportId: string,
    timestamp: string,
  ): Promise<ExportResult> {
    let totalSize = 0

    for (const file of files) {
      if (file.content) {
        const blob = new Blob([file.content], { type: "application/octet-stream" })
        saveAs(blob, file.name)
        totalSize += blob.size
      }
    }

    return {
      success: true,
      filename: `${files.length} individual files`,
      size: totalSize,
      fileCount: files.length,
      format: "individual",
      exportId,
      timestamp,
    }
  }

  private formatFileForExport(file: MidiFile, options: ExportOptions): any {
    const formatted: any = {
      name: file.name,
      path: file.path,
      repository: file.repository,
      size: file.size,
      lastModified: file.lastModified,
      sha: file.sha,
      downloadUrl: file.downloadUrl,
    }

    if (options.includeContent && file.content) {
      formatted.content = file.content
    }

    if (options.customFields) {
      for (const field of options.customFields) {
        formatted[field] = this.getCustomFieldValue(file, field)
      }
    }

    return formatted
  }

  private getCustomFieldValue(file: MidiFile, field: string): string {
    switch (field) {
      case "fileExtension":
        return file.name.split(".").pop() || ""
      case "repositoryOwner":
        return file.repository.split("/")[0] || ""
      case "repositoryName":
        return file.repository.split("/")[1] || ""
      case "directoryPath":
        return file.path.split("/").slice(0, -1).join("/") || ""
      case "sizeKB":
        return (file.size / 1024).toFixed(2)
      case "sizeMB":
        return (file.size / (1024 * 1024)).toFixed(2)
      default:
        return ""
    }
  }

  private groupFilesByRepository(files: MidiFile[]): Record<string, MidiFile[]> {
    return files.reduce(
      (groups, file) => {
        if (!groups[file.repository]) {
          groups[file.repository] = []
        }
        groups[file.repository].push(file)
        return groups
      },
      {} as Record<string, MidiFile[]>,
    )
  }

  private generateStatistics(files: MidiFile[]) {
    const repositories = new Set(files.map((f) => f.repository))
    const extensions = new Map<string, number>()
    let totalSize = 0

    files.forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "unknown"
      extensions.set(ext, (extensions.get(ext) || 0) + 1)
      totalSize += file.size
    })

    return {
      totalFiles: files.length,
      totalRepositories: repositories.size,
      totalSize,
      averageFileSize: Math.round(totalSize / files.length),
      fileTypes: Object.fromEntries(extensions),
      repositories: Array.from(repositories),
    }
  }

  private generateXmlContent(files: MidiFile[], options: ExportOptions, exportId: string, timestamp: string): string {
    const statistics = this.generateStatistics(files)

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += "<midiExport>\n"
    xml += `  <metadata>\n`
    xml += `    <exportId>${exportId}</exportId>\n`
    xml += `    <timestamp>${timestamp}</timestamp>\n`
    xml += `    <totalFiles>${files.length}</totalFiles>\n`
    xml += `    <totalSize>${statistics.totalSize}</totalSize>\n`
    xml += `    <generatedBy>Burnt Beats MIDI Export Service</generatedBy>\n`
    xml += `  </metadata>\n`

    xml += `  <statistics>\n`
    xml += `    <totalRepositories>${statistics.totalRepositories}</totalRepositories>\n`
    xml += `    <averageFileSize>${statistics.averageFileSize}</averageFileSize>\n`
    xml += `    <fileTypes>\n`
    for (const [type, count] of Object.entries(statistics.fileTypes)) {
      xml += `      <type name="${type}" count="${count}"/>\n`
    }
    xml += `    </fileTypes>\n`
    xml += `  </statistics>\n`

    xml += `  <files>\n`
    files.forEach((file) => {
      xml += `    <file>\n`
      xml += `      <name><![CDATA[${file.name}]]></name>\n`
      xml += `      <path><![CDATA[${file.path}]]></path>\n`
      xml += `      <repository><![CDATA[${file.repository}]]></repository>\n`
      xml += `      <size>${file.size}</size>\n`
      xml += `      <lastModified>${file.lastModified}</lastModified>\n`
      xml += `      <sha>${file.sha}</sha>\n`
      xml += `      <downloadUrl><![CDATA[${file.downloadUrl}]]></downloadUrl>\n`
      if (options.includeContent && file.content) {
        xml += `      <content><![CDATA[${file.content}]]></content>\n`
      }
      xml += `    </file>\n`
    })
    xml += `  </files>\n`
    xml += "</midiExport>\n"

    return xml
  }

  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getExportHistory(): ExportHistory[] {
    return Array.from(this.exportHistory.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
  }

  getExportById(id: string): ExportHistory | undefined {
    return this.exportHistory.get(id)
  }

  clearExportHistory(): void {
    this.exportHistory.clear()
  }

  async generateExportReport(files: MidiFile[]): Promise<string> {
    const statistics = this.generateStatistics(files)
    const repositories = this.groupFilesByRepository(files)

    let report = "# MIDI Export Report\n\n"
    report += `**Generated:** ${new Date().toLocaleString()}\n\n`

    report += "## Summary\n\n"
    report += `- **Total Files:** ${statistics.totalFiles}\n`
    report += `- **Total Repositories:** ${statistics.totalRepositories}\n`
    report += `- **Total Size:** ${this.formatBytes(statistics.totalSize)}\n`
    report += `- **Average File Size:** ${this.formatBytes(statistics.averageFileSize)}\n\n`

    report += "## File Types\n\n"
    for (const [type, count] of Object.entries(statistics.fileTypes)) {
      report += `- **${type.toUpperCase()}:** ${count} files\n`
    }
    report += "\n"

    report += "## Repositories\n\n"
    for (const [repo, repoFiles] of Object.entries(repositories)) {
      const repoSize = repoFiles.reduce((sum, file) => sum + file.size, 0)
      report += `### ${repo}\n\n`
      report += `- **Files:** ${repoFiles.length}\n`
      report += `- **Size:** ${this.formatBytes(repoSize)}\n`
      report += `- **Paths:**\n`
      const uniquePaths = new Set(repoFiles.map((f) => f.path.split("/").slice(0, -1).join("/")))
      for (const path of uniquePaths) {
        if (path) report += `  - ${path}\n`
      }
      report += "\n"
    }

    return report
  }

  private formatBytes(bytes: number): string {
    const sizes = ["B", "KB", "MB", "GB"]
    if (bytes === 0) return "0 B"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }
}

export const midiExportService = new MidiExportService()
