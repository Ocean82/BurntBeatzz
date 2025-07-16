import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  try {
    const buildChecks = {
      packageJson: await checkPackageJson(),
      nextConfig: await checkNextConfig(),
      tsConfig: await checkTsConfig(),
      buildOutput: await checkBuildOutput(),
      dependencies: await checkDependencies(),
    }

    const allPassed = Object.values(buildChecks).every((check) => check.success)

    return NextResponse.json({
      success: allPassed,
      message: allPassed ? "All build checks passed" : "Some build checks failed",
      data: buildChecks,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Build check failed",
        message: "Failed to check build configuration",
      },
      { status: 500 },
    )
  }
}

async function checkPackageJson() {
  try {
    const packagePath = path.join(process.cwd(), "package.json")
    const packageContent = await fs.readFile(packagePath, "utf-8")
    const packageJson = JSON.parse(packageContent)

    const requiredScripts = ["dev", "build", "start"]
    const missingScripts = requiredScripts.filter((script) => !packageJson.scripts?.[script])

    return {
      success: missingScripts.length === 0,
      name: packageJson.name,
      version: packageJson.version,
      scripts: packageJson.scripts,
      missingScripts,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Package.json check failed",
    }
  }
}

async function checkNextConfig() {
  try {
    const configPath = path.join(process.cwd(), "next.config.mjs")
    const configExists = await fs
      .access(configPath)
      .then(() => true)
      .catch(() => false)

    return {
      success: configExists,
      exists: configExists,
      path: configPath,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Next.js config check failed",
    }
  }
}

async function checkTsConfig() {
  try {
    const tsConfigPath = path.join(process.cwd(), "tsconfig.json")
    const tsConfigContent = await fs.readFile(tsConfigPath, "utf-8")
    const tsConfig = JSON.parse(tsConfigContent)

    return {
      success: true,
      compilerOptions: tsConfig.compilerOptions,
      include: tsConfig.include,
      exclude: tsConfig.exclude,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "TypeScript config check failed",
    }
  }
}

async function checkBuildOutput() {
  try {
    const buildPath = path.join(process.cwd(), ".next")
    const buildExists = await fs
      .access(buildPath)
      .then(() => true)
      .catch(() => false)

    if (buildExists) {
      const buildInfo = await fs
        .readFile(path.join(buildPath, "build-manifest.json"), "utf-8")
        .then(() => true)
        .catch(() => false)

      return {
        success: true,
        buildExists,
        buildInfo,
        path: buildPath,
      }
    }

    return {
      success: true, // Not having a build output is OK for development
      buildExists: false,
      note: "No build output found - run 'npm run build' to create production build",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Build output check failed",
    }
  }
}

async function checkDependencies() {
  try {
    const packagePath = path.join(process.cwd(), "package.json")
    const packageContent = await fs.readFile(packagePath, "utf-8")
    const packageJson = JSON.parse(packageContent)

    const criticalDeps = ["next", "react", "react-dom", "@neondatabase/serverless", "@google-cloud/storage", "stripe"]

    const missingDeps = criticalDeps.filter(
      (dep) => !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep],
    )

    return {
      success: missingDeps.length === 0,
      totalDependencies: Object.keys(packageJson.dependencies || {}).length,
      totalDevDependencies: Object.keys(packageJson.devDependencies || {}).length,
      criticalDeps,
      missingDeps,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Dependencies check failed",
    }
  }
}
