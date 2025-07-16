import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

interface ProjectFile {
  path: string
  content: string
  type: "file" | "directory"
  size: number
  modified: boolean
  status: "added" | "modified" | "deleted" | "unchanged"
}

export async function GET() {
  try {
    const projectRoot = process.cwd()
    const files: ProjectFile[] = []

    // Define important project directories to scan
    const dirsToScan = ["components", "app", "lib", "hooks", "api", "types", "utils", "styles", "public"]

    // Define files to exclude
    const excludePatterns = [
      /node_modules/,
      /\.next/,
      /\.git/,
      /\.env/,
      /\.DS_Store/,
      /\.log$/,
      /\.lock$/,
      /dist/,
      /build/,
    ]

    const scanDirectory = (dirPath: string, relativePath = "") => {
      try {
        const items = fs.readdirSync(dirPath)

        for (const item of items) {
          const fullPath = path.join(dirPath, item)
          const relativeItemPath = path.join(relativePath, item).replace(/\\/g, "/")

          // Skip excluded patterns
          if (excludePatterns.some((pattern) => pattern.test(relativeItemPath))) {
            continue
          }

          const stats = fs.statSync(fullPath)

          if (stats.isDirectory()) {
            files.push({
              path: relativeItemPath,
              content: "",
              type: "directory",
              size: 0,
              modified: false,
              status: "unchanged",
            })

            // Recursively scan subdirectories (with depth limit)
            if (relativePath.split("/").length < 3) {
              scanDirectory(fullPath, relativeItemPath)
            }
          } else if (stats.isFile()) {
            // Only include certain file types
            const ext = path.extname(item).toLowerCase()
            const includeExtensions = [
              ".ts",
              ".tsx",
              ".js",
              ".jsx",
              ".json",
              ".md",
              ".txt",
              ".css",
              ".scss",
              ".yaml",
              ".yml",
              ".sql",
              ".py",
              ".sh",
              ".dockerfile",
              ".env.example",
            ]

            if (includeExtensions.includes(ext) || item === "package.json" || item === "README.md") {
              try {
                const content = fs.readFileSync(fullPath, "utf-8")

                files.push({
                  path: relativeItemPath,
                  content: content.length > 10000 ? content.substring(0, 10000) + "..." : content,
                  type: "file",
                  size: stats.size,
                  modified: false, // In a real implementation, this would check git status
                  status: "unchanged", // In a real implementation, this would check git status
                })
              } catch (readError) {
                console.error(`Error reading file ${fullPath}:`, readError)
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error)
      }
    }

    // Scan each important directory
    for (const dir of dirsToScan) {
      const dirPath = path.join(projectRoot, dir)
      if (fs.existsSync(dirPath)) {
        scanDirectory(dirPath, dir)
      }
    }

    // Add important root files
    const rootFiles = ["package.json", "README.md", "next.config.js", "tailwind.config.ts", "tsconfig.json"]
    for (const file of rootFiles) {
      const filePath = path.join(projectRoot, file)
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath)
          const content = fs.readFileSync(filePath, "utf-8")

          files.push({
            path: file,
            content: content.length > 5000 ? content.substring(0, 5000) + "..." : content,
            type: "file",
            size: stats.size,
            modified: false,
            status: "unchanged",
          })
        } catch (error) {
          console.error(`Error reading root file ${file}:`, error)
        }
      }
    }

    // Sort files by path
    files.sort((a, b) => a.path.localeCompare(b.path))

    return NextResponse.json({
      success: true,
      files,
      totalFiles: files.filter((f) => f.type === "file").length,
      totalDirectories: files.filter((f) => f.type === "directory").length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
    })
  } catch (error) {
    console.error("Error scanning project files:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to scan project files",
      },
      { status: 500 },
    )
  }
}
