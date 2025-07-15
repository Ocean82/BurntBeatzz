"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TestTube,
  Music,
  Headphones,
  Crown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  Calculator,
} from "lucide-react"
import { PricingServiceV2 } from "@/lib/services/pricing-service-v2"

interface BoundaryTest {
  name: string
  size: number
  expectedTier: string
  expectedPrice: number
  description: string
  isEdgeCase: boolean
}

export default function BoundaryPricingTest() {
  const [testResults, setTestResults] = useState<
    Array<BoundaryTest & { actualTier: string; actualPrice: number; passed: boolean }>
  >([])
  const [allTestsPassed, setAllTestsPassed] = useState<boolean | null>(null)

  const boundaryTests: BoundaryTest[] = [
    // Below 5MB boundary
    {
      name: "Just Under 5MB",
      size: 4.99,
      expectedTier: "Bonus Track",
      expectedPrice: 0.99,
      description: "Should be Bonus Track (≤5MB)",
      isEdgeCase: true,
    },
    // Exactly 5MB boundary
    {
      name: "Exactly 5MB",
      size: 5.0,
      expectedTier: "Bonus Track",
      expectedPrice: 0.99,
      description: "Should be Bonus Track (≤5MB)",
      isEdgeCase: true,
    },
    // Just over 5MB
    {
      name: "Just Over 5MB",
      size: 5.01,
      expectedTier: "Base Song",
      expectedPrice: 1.99,
      description: "Should be Base Song (<9MB)",
      isEdgeCase: true,
    },
    // Below 9MB boundary
    {
      name: "Just Under 9MB",
      size: 8.99,
      expectedTier: "Base Song",
      expectedPrice: 1.99,
      description: "Should be Base Song (<9MB)",
      isEdgeCase: true,
    },
    // Exactly 9MB boundary
    {
      name: "Exactly 9MB",
      size: 9.0,
      expectedTier: "Premium Song",
      expectedPrice: 4.99,
      description: "Should be Premium Song (9MB-20MB)",
      isEdgeCase: true,
    },
    // Just over 9MB
    {
      name: "Just Over 9MB",
      size: 9.01,
      expectedTier: "Premium Song",
      expectedPrice: 4.99,
      description: "Should be Premium Song (9MB-20MB)",
      isEdgeCase: true,
    },
    // Below 20MB boundary
    {
      name: "Just Under 20MB",
      size: 19.99,
      expectedTier: "Premium Song",
      expectedPrice: 4.99,
      description: "Should be Premium Song (9MB-20MB)",
      isEdgeCase: true,
    },
    // Exactly 20MB boundary
    {
      name: "Exactly 20MB",
      size: 20.0,
      expectedTier: "Premium Song",
      expectedPrice: 4.99,
      description: "Should be Premium Song (9MB-20MB)",
      isEdgeCase: true,
    },
    // Just over 20MB
    {
      name: "Just Over 20MB",
      size: 20.01,
      expectedTier: "Ultra Super Great Amazing Song",
      expectedPrice: 8.99,
      description: "Should be Ultra Super Great Amazing Song (>20MB)",
      isEdgeCase: true,
    },
    // Additional test cases
    {
      name: "Very Small File",
      size: 1.0,
      expectedTier: "Bonus Track",
      expectedPrice: 0.99,
      description: "Small file should be Bonus Track",
      isEdgeCase: false,
    },
    {
      name: "Medium File",
      size: 15.5,
      expectedTier: "Premium Song",
      expectedPrice: 4.99,
      description: "Medium file should be Premium Song",
      isEdgeCase: false,
    },
    {
      name: "Large File",
      size: 35.7,
      expectedTier: "Ultra Super Great Amazing Song",
      expectedPrice: 8.99,
      description: "Large file should be Ultra Super Great Amazing Song",
      isEdgeCase: false,
    },
  ]

  const runBoundaryTests = () => {
    const results = boundaryTests.map((test) => {
      const pricing = PricingServiceV2.calculateTotalPrice(test.size, false)
      const actualTier = pricing.tier.name
      const actualPrice = pricing.downloadPrice
      const passed = actualTier === test.expectedTier && actualPrice === test.expectedPrice

      return {
        ...test,
        actualTier,
        actualPrice,
        passed,
      }
    })

    setTestResults(results)
    setAllTestsPassed(results.every((result) => result.passed))
  }

  useEffect(() => {
    runBoundaryTests()
  }, [])

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case "Bonus Track":
        return <TestTube className="w-4 h-4" />
      case "Base Song":
        return <Music className="w-4 h-4" />
      case "Premium Song":
        return <Headphones className="w-4 h-4" />
      case "Ultra Super Great Amazing Song":
        return <Crown className="w-4 h-4" />
      default:
        return <Target className="w-4 h-4" />
    }
  }

  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case "Bonus Track":
        return "text-gray-400"
      case "Base Song":
        return "text-blue-400"
      case "Premium Song":
        return "text-purple-400"
      case "Ultra Super Great Amazing Song":
        return "text-orange-400"
      default:
        return "text-gray-400"
    }
  }

  const getTierEmoji = (tierName: string) => {
    switch (tierName) {
      case "Bonus Track":
        return "🧪"
      case "Base Song":
        return "🔉"
      case "Premium Song":
        return "🎧"
      case "Ultra Super Great Amazing Song":
        return "💽"
      default:
        return "❓"
    }
  }

  const edgeCaseResults = testResults.filter((result) => result.isEdgeCase)
  const regularResults = testResults.filter((result) => !result.isEdgeCase)
  const failedTests = testResults.filter((result) => !result.passed)

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-black/80 backdrop-blur-sm border border-red-500/30 shadow-xl shadow-red-500/10">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-red-300 flex items-center gap-3">
              <Target className="w-8 h-8" />
              Boundary Pricing Tests
              <Badge
                className={`${allTestsPassed === true ? "bg-green-500" : allTestsPassed === false ? "bg-red-500" : "bg-yellow-500"} text-white`}
              >
                {allTestsPassed === true ? "ALL PASSED" : allTestsPassed === false ? "TESTS FAILED" : "TESTING..."}
              </Badge>
            </CardTitle>
            <p className="text-red-400/60">
              Testing exact boundaries at 5.0MB, 9.0MB, and 20.0MB to ensure pricing logic is correct
            </p>
          </CardHeader>
        </Card>

        {/* Test Summary */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-300 mb-1">{testResults.filter((r) => r.passed).length}</div>
              <div className="text-sm text-green-400">Tests Passed</div>
            </CardContent>
          </Card>
          <Card className="bg-black/80 backdrop-blur-sm border border-red-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-300 mb-1">{failedTests.length}</div>
              <div className="text-sm text-red-400">Tests Failed</div>
            </CardContent>
          </Card>
          <Card className="bg-black/80 backdrop-blur-sm border border-blue-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-300 mb-1">{edgeCaseResults.length}</div>
              <div className="text-sm text-blue-400">Edge Cases</div>
            </CardContent>
          </Card>
          <Card className="bg-black/80 backdrop-blur-sm border border-purple-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-300 mb-1">{testResults.length}</div>
              <div className="text-sm text-purple-400">Total Tests</div>
            </CardContent>
          </Card>
        </div>

        {/* Failed Tests Alert */}
        {failedTests.length > 0 && (
          <Alert className="border-red-500/50 bg-red-900/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              <strong>{failedTests.length} test(s) failed!</strong> Check the results below for details.
            </AlertDescription>
          </Alert>
        )}

        {/* Edge Case Tests */}
        <Card className="bg-black/80 backdrop-blur-sm border border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Boundary Tests (5MB, 9MB, 20MB)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {edgeCaseResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    result.passed ? "border-green-500/30 bg-green-900/10" : "border-red-500/50 bg-red-900/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${result.passed ? "bg-green-500/20" : "bg-red-500/20"}`}>
                        {result.passed ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{result.name}</h3>
                        <p className="text-sm text-gray-400">{result.description}</p>
                      </div>
                    </div>
                    <Badge className={result.passed ? "bg-green-500" : "bg-red-500"}>
                      {result.passed ? "PASS" : "FAIL"}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="text-gray-300 font-medium">Input</div>
                      <div className="bg-black/40 p-2 rounded">
                        <div className="text-white font-mono">{result.size.toFixed(2)} MB</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-gray-300 font-medium">Expected</div>
                      <div className="bg-black/40 p-2 rounded">
                        <div className="flex items-center gap-2 text-blue-300">
                          {getTierIcon(result.expectedTier)}
                          <span>
                            {getTierEmoji(result.expectedTier)} {result.expectedTier}
                          </span>
                        </div>
                        <div className="text-blue-400 font-mono">${result.expectedPrice.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-gray-300 font-medium">Actual</div>
                      <div className="bg-black/40 p-2 rounded">
                        <div className={`flex items-center gap-2 ${result.passed ? "text-green-300" : "text-red-300"}`}>
                          {getTierIcon(result.actualTier)}
                          <span>
                            {getTierEmoji(result.actualTier)} {result.actualTier}
                          </span>
                        </div>
                        <div className={`font-mono ${result.passed ? "text-green-400" : "text-red-400"}`}>
                          ${result.actualPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!result.passed && (
                    <div className="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded">
                      <div className="text-red-300 text-sm font-medium">❌ Test Failed</div>
                      <div className="text-red-400/80 text-xs mt-1">
                        Expected {result.expectedTier} (${result.expectedPrice.toFixed(2)}) but got {result.actualTier}{" "}
                        (${result.actualPrice.toFixed(2)})
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regular Tests */}
        <Card className="bg-black/80 backdrop-blur-sm border border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-blue-300 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Additional Test Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    result.passed ? "border-green-500/30 bg-green-900/10" : "border-red-500/50 bg-red-900/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white text-sm">{result.name}</h4>
                    <Badge className={result.passed ? "bg-green-500" : "bg-red-500"} size="sm">
                      {result.passed ? "✓" : "✗"}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Size:</span>
                      <span className="text-white font-mono">{result.size} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tier:</span>
                      <span className={getTierColor(result.actualTier)}>
                        {getTierEmoji(result.actualTier)} {result.actualTier}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-green-400 font-mono">${result.actualPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Logic Reference */}
        <Card className="bg-black/80 backdrop-blur-sm border border-gray-500/30">
          <CardHeader>
            <CardTitle className="text-gray-300 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Expected Pricing Logic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black/40 border border-gray-500/20 rounded-lg p-4">
              <div className="space-y-3 text-sm">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-gray-300 font-medium">Boundary Rules:</h4>
                    <div className="space-y-1 text-gray-400">
                      <div>• Size ≤ 5.0MB → 🧪 Bonus Track ($0.99)</div>
                      <div>• 5.0MB &lt; Size &lt; 9.0MB → 🔉 Base Song ($1.99)</div>
                      <div>• 9.0MB ≤ Size ≤ 20.0MB → 🎧 Premium Song ($4.99)</div>
                      <div>• Size &gt; 20.0MB → 💽 Ultra Super Great Amazing Song ($8.99)</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-gray-300 font-medium">Critical Boundaries:</h4>
                    <div className="space-y-1 text-gray-400">
                      <div>• 5.0MB: Bonus Track → Base Song</div>
                      <div>• 9.0MB: Base Song → Premium Song</div>
                      <div>• 20.0MB: Premium Song → Ultra Song</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rerun Tests Button */}
        <div className="flex justify-center">
          <Button onClick={runBoundaryTests} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3">
            <Target className="w-4 h-4 mr-2" />
            Rerun Boundary Tests
          </Button>
        </div>
      </div>
    </div>
  )
}
