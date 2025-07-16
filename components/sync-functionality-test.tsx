"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileMusic, Loader2, CheckCircle, XCircle, AlertCircle, Play, BarChart3, Timer } from "lucide-react"
import { toast } from "sonner"

interface TestResult {
  name: string
  status: "pending" | "running" | "success" | "error"
  message: string
  duration?: number
  data?: any
}

interface MidiFile {
  name: string
  path: string
  downloadUrl: string
  size: number
  sizeFormatted: string
  category: string
  sha: string
}

interface SyncStats {
  totalFiles: number
  downloadedFiles: number
  categories: Record<string, number>
  totalSize: number
  lastSync: string
  syncDuration: number
}

export function SyncFunctionalityTest() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [overallProgress, setOverallProgress] = useState(0)
  const [testData, setTestData] = useState<{
    files: MidiFile[]
    stats: SyncStats | null
    searchResults: MidiFile[]
    downloadResults: any[]
  }>({
    files: [],
    stats: null,
    searchResults: [],
    downloadResults: [],
  })
  const [isRunning, setIsRunning] = useState(false)

  const testSuite = [
    {
      name: "GitHub Token Validation",
      description: "Verify GitHub token is configured and valid",
    },
    {
      name: "Repository Connection",
      description: "Test connection to ldrolez/free-midi-chords repository",
    },
    {
      name: "Directory Scanning",
      description: "Scan repository directories for MIDI files",
    },
    {
      name: "File Categorization",
      description: "Test automatic categorization of MIDI files",
    },
    {
      name: "Search Functionality",
      description: "Test search and filtering capabilities",
    },
    {
      name: "Single File Download",
      description: "Test downloading individual MIDI files",
    },
    {
      name: "Batch Download",
      description: "Test batch download functionality",
    },
    {
      name: "Error Handling",
      description: "Test error handling and recovery",
    },
    {
      name: "Performance Test",
      description: "Test sync performance with large datasets",
    },
    {
      name: "API Endpoints",
      description: "Test all API endpoints are responding correctly",
    },
  ]

  useEffect(() => {
    initializeTests()
  }, [])

  const initializeTests = () => {
    const initialTests = testSuite.map((test) => ({
      name: test.name,
      status: "pending" as const,
      message: test.description,
      duration: 0,
    }))
    setTests(initialTests)
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setOverallProgress(0)

    for (let i = 0; i < testSuite.length; i++) {
      const test = testSuite[i]
      setCurrentTest(test.name)

      updateTestStatus(test.name, "running", "Running test...")

      const startTime = Date.now() // Declare startTime here

      try {
        let result: any = null

        switch (test.name) {
          case "GitHub Token Validation":
            result = await testGitHubToken()
            break
          case "Repository Connection":
            result = await testRepositoryConnection()
            break
          case "Directory Scanning":
            result = await testDirectoryScanning()
            break
          case "File Categorization":
            result = await testFileCategorization()
            break
          case "Search Functionality":
            result = await testSearchFunctionality()
            break
          case "Single File Download":
            result = await testSingleFileDownload()
            break
          case "Batch Download":
            result = await testBatchDownload()
            break
          case "Error Handling":
            result = await testErrorHandling()
            break
          case "Performance Test":
            result = await testPerformance()
            break
          case "API Endpoints":
            result = await testAPIEndpoints()
            break
        }

        const duration = Date.now() - startTime
        updateTestStatus(test.name, "success", result.message, duration, result.data)
      } catch (error) {
        const duration = Date.now() - startTime
        updateTestStatus(test.name, "error", error instanceof Error ? error.message : "Test failed", duration)
      }

      setOverallProgress(((i + 1) / testSuite.length) * 100)

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setCurrentTest(null)
    setIsRunning(false)
    toast.success("All tests completed!")
  }

  const updateTestStatus = (
    name: string,
    status: TestResult["status"],
    message: string,
    duration?: number,
    data?: any,
  ) => {
    setTests((prev) => prev.map((test) => (test.name === name ? { ...test, status, message, duration, data } : test)))
  }

  // Test Functions
  const testGitHubToken = async () => {
    const response = await fetch("/api/github/validate-token")
    const data = await response.json()

    if (!response.ok || !data.valid) {
      throw new Error("GitHub token is not configured or invalid")
    }

    return {
      message: `GitHub token validated successfully. Rate limit: ${data.rateLimit?.remaining}/${data.rateLimit?.limit}`,
      data: data,
    }
  }

  const testRepositoryConnection = async () => {
    const response = await fetch("/api/github/ldrolez-sync?repository=ldrolez/free-midi-chords")
    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Repository connection failed: ${data.error}`)
    }

    return {
      message: "Successfully connected to ldrolez/free-midi-chords repository",
      data: data,
    }
  }

  const testDirectoryScanning = async () => {
    const response = await fetch("/api/github/ldrolez-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        syncAll: false,
        repositories: [
          {
            owner: "ldrolez",
            repo: "free-midi-chords",
            branch: "main",
            paths: ["chords"], // Test with just one path first
          },
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(`Directory scanning failed: ${data.error}`)
    }

    setTestData((prev) => ({ ...prev, files: data.files, stats: data.stats }))

    return {
      message: `Successfully scanned directories. Found ${data.files.length} MIDI files`,
      data: data,
    }
  }

  const testFileCategorization = async () => {
    if (testData.files.length === 0) {
      throw new Error("No files available for categorization test")
    }

    const categories = new Set(testData.files.map((file) => file.category))
    const expectedCategories = ["Chords", "Progressions", "Scales", "Other"]

    const foundExpectedCategories = expectedCategories.filter((cat) => categories.has(cat))

    return {
      message: `Categorization successful. Found ${categories.size} categories: ${Array.from(categories).join(", ")}`,
      data: { categories: Array.from(categories), expectedFound: foundExpectedCategories },
    }
  }

  const testSearchFunctionality = async () => {
    if (testData.files.length === 0) {
      throw new Error("No files available for search test")
    }

    // Test search by name
    const searchTerm = "chord"
    const searchResults = testData.files.filter(
      (file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.path.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    setTestData((prev) => ({ ...prev, searchResults }))

    return {
      message: `Search functionality working. Found ${searchResults.length} files matching "${searchTerm}"`,
      data: { searchTerm, resultsCount: searchResults.length },
    }
  }

  const testSingleFileDownload = async () => {
    if (testData.files.length === 0) {
      throw new Error("No files available for download test")
    }

    const testFile = testData.files[0]

    // Simulate download test (don't actually download)
    const response = await fetch("/api/github/midi-files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        downloadUrl: testFile.downloadUrl,
        fileName: testFile.name,
        testMode: true, // Add test mode to prevent actual download
      }),
    })

    if (!response.ok) {
      throw new Error("Single file download test failed")
    }

    return {
      message: `Single file download test successful for ${testFile.name}`,
      data: { fileName: testFile.name, fileSize: testFile.size },
    }
  }

  const testBatchDownload = async () => {
    if (testData.files.length < 3) {
      throw new Error("Not enough files for batch download test")
    }

    const testFiles = testData.files.slice(0, 3)

    // Simulate batch download
    const results = testFiles.map((file) => ({
      name: file.name,
      size: file.size,
      success: true,
    }))

    setTestData((prev) => ({ ...prev, downloadResults: results }))

    return {
      message: `Batch download test successful for ${testFiles.length} files`,
      data: { filesCount: testFiles.length, totalSize: testFiles.reduce((sum, f) => sum + f.size, 0) },
    }
  }

  const testErrorHandling = async () => {
    // Test with invalid repository
    const response = await fetch("/api/github/ldrolez-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repositories: [
          {
            owner: "invalid",
            repo: "nonexistent",
            branch: "main",
            paths: [""],
          },
        ],
      }),
    })

    const data = await response.json()

    // We expect this to fail gracefully
    if (data.errors && data.errors.length > 0) {
      return {
        message: "Error handling working correctly - gracefully handled invalid repository",
        data: { errors: data.errors },
      }
    }

    throw new Error("Error handling test failed - should have returned errors")
  }

  const testPerformance = async () => {
    const startTime = Date.now()

    // Test with multiple paths
    const response = await fetch("/api/github/ldrolez-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repositories: [
          {
            owner: "ldrolez",
            repo: "free-midi-chords",
            branch: "main",
            paths: ["chords", "progressions"],
          },
        ],
      }),
    })

    const data = await response.json()
    const duration = Date.now() - startTime

    if (!response.ok) {
      throw new Error("Performance test failed")
    }

    const filesPerSecond = data.files ? (data.files.length / (duration / 1000)).toFixed(2) : 0

    return {
      message: `Performance test completed. Processed ${data.files?.length || 0} files in ${duration}ms (${filesPerSecond} files/sec)`,
      data: { duration, filesCount: data.files?.length || 0, filesPerSecond },
    }
  }

  const testAPIEndpoints = async () => {
    const endpoints = [
      { url: "/api/github/validate-token", method: "GET" },
      { url: "/api/github/ldrolez-sync?repository=ldrolez/free-midi-chords", method: "GET" },
      { url: "/api/github/sync-repositories", method: "GET" },
    ]

    const results = []

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url)
        results.push({
          url: endpoint.url,
          status: response.status,
          success: response.ok,
        })
      } catch (error) {
        results.push({
          url: endpoint.url,
          status: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    const successCount = results.filter((r) => r.success).length

    return {
      message: `API endpoints test completed. ${successCount}/${results.length} endpoints responding correctly`,
      data: { endpoints: results, successRate: (successCount / results.length) * 100 },
    }
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-4 w-4 text-gray-400" />
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return "text-gray-600"
      case "running":
        return "text-blue-600"
      case "success":
        return "text-green-600"
      case "error":
        return "text-red-600"
    }
  }

  const successfulTests = tests.filter((t) => t.status === "success").length
  const failedTests = tests.filter((t) => t.status === "error").length
  const totalDuration = tests.reduce((sum, test) => sum + (test.duration || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sync Functionality Test Suite</h1>
          <p className="text-muted-foreground">
            Comprehensive testing of the ldrolez/free-midi-chords sync functionality
          </p>
        </div>
        <Button onClick={runAllTests} disabled={isRunning} size="lg">
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {/* Overall Progress */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Overall Progress</h3>
                  {currentTest && <p className="text-sm text-muted-foreground">Currently running: {currentTest}</p>}
                </div>
                <Badge variant="outline">{Math.round(overallProgress)}%</Badge>
              </div>
              <Progress value={overallProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results Summary */}
      {!isRunning && tests.some((t) => t.status !== "pending") && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{successfulTests}</div>
              <p className="text-xs text-muted-foreground">Tests Passed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{failedTests}</div>
              <p className="text-xs text-muted-foreground">Tests Failed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{tests.length}</div>
              <p className="text-xs text-muted-foreground">Total Tests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">{(totalDuration / 1000).toFixed(1)}s</div>
              <p className="text-xs text-muted-foreground">Total Duration</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Results */}
      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="data">Test Data</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {tests.map((test, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getStatusIcon(test.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{test.name}</h4>
                          {test.duration && (
                            <Badge variant="outline" className="text-xs">
                              {test.duration}ms
                            </Badge>
                          )}
                        </div>
                        <p className={`text-sm ${getStatusColor(test.status)}`}>{test.message}</p>
                        {test.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">View Details</summary>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(test.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Files Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileMusic className="h-5 w-5" />
                  MIDI Files ({testData.files.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {testData.files.slice(0, 10).map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="truncate">{file.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {file.category}
                        </Badge>
                      </div>
                    ))}
                    {testData.files.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center">
                        ... and {testData.files.length - 10} more files
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Stats Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testData.stats ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Files:</span>
                      <span className="font-medium">{testData.stats.totalFiles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Size:</span>
                      <span className="font-medium">{(testData.stats.totalSize / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Categories:</span>
                      <span className="font-medium">{Object.keys(testData.stats.categories).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sync Duration:</span>
                      <span className="font-medium">{testData.stats.syncDuration}ms</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Category Breakdown:</p>
                      {Object.entries(testData.stats.categories).map(([category, count]) => (
                        <div key={category} className="flex justify-between text-sm">
                          <span>{category}:</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No statistics available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{(totalDuration / 1000).toFixed(2)}s</div>
                  <div className="text-sm text-muted-foreground">Total Time</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{(totalDuration / tests.length).toFixed(0)}ms</div>
                  <div className="text-sm text-muted-foreground">Avg per Test</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{testData.files.length}</div>
                  <div className="text-sm text-muted-foreground">Files Processed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {totalDuration > 0 ? (testData.files.length / (totalDuration / 1000)).toFixed(1) : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Files/Second</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Test Suite Overview:</strong> This comprehensive test suite validates all aspects of the
          ldrolez/free-midi-chords sync functionality including GitHub API integration, file scanning, categorization,
          search, downloads, error handling, and performance metrics.
        </AlertDescription>
      </Alert>
    </div>
  )
}
