import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const { test } = await request.json()

    const results: Record<string, any> = {}

    switch (test) {
      case "Upload Directory":
        results.uploadDir = await testDirectory("uploads")
        break
      case "Temp Directory":
        results.tempDir = await testDirectory("temp")
        break
      case "Storage Permissions":
        results.storagePerms = await testStoragePermissions()
        break
      case "Disk Space":
        results.diskSpace = await testDiskSpace()
        break
      default:
        // Test all if no specific test requested
        results.uploadDir = await testDirectory("uploads")
        results.tempDir = await testDirectory("temp")
        results.storagePerms = await testStoragePermissions()
        results.diskSpace = await testDiskSpace()
    }

    const allPassed = Object.values(results).every((result: any) => result.success)

    return NextResponse.json({
      success: allPassed,
      message: allPassed ? "All filesystem tests passed" : "Some filesystem tests failed",
      data: results,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Filesystem test failed",
        message: "Failed to test filesystem",
      },
      { status: 500 },
    )
  }
}

async function testDirectory(dirName: string) {
  try {
    const dirPath = path.join(process.cwd(), dirName)

    // Create directory if it doesn't exist
    await fs.mkdir(dirPath, { recursive: true })

    // Test write permissions
    const testFile = path.join(dirPath, `test-${Date.now()}.txt`)
    await fs.writeFile(testFile, "test content")

    // Test read permissions
    const content = await fs.readFile(testFile, "utf-8")

    // Clean up
    await fs.unlink(testFile)

    return {
      success: true,
      path: dirPath,
      writable: true,
      readable: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Directory test failed",
    }
  }
}

async function testStoragePermissions() {
  try {
    const testDirs = ["uploads", "temp", "public", "storage"]
    const results: Record<string, any> = {}

    for (const dir of testDirs) {
      results[dir] = await testDirectory(dir)
    }

    const allWritable = Object.values(results).every((result: any) => result.success)

    return {
      success: allWritable,
      directories: results,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Storage permissions test failed",
    }
  }
}

async function testDiskSpace() {
  try {
    const stats = await fs.stat(process.cwd())

    // This is a simplified disk space check
    // In production, you'd want to use a more robust method
    return {
      success: true,
      available: "Unknown", // Would need platform-specific implementation
      used: "Unknown",
      total: "Unknown",
      note: "Disk space monitoring requires platform-specific implementation",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Disk space test failed",
    }
  }
}
