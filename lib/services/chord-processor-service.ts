import { spawn } from "child_process"
import { promises as fs } from "fs"
import path from "path"

interface ChordProcessorConfig {
  pythonPath: string
  scriptsPath: string
  outputPath: string
  tempPath: string
}

interface ProcessingResult {
  success: boolean
  chordSets: any[]
  totalChords: number
  categories: Record<string, number>
  processingTime: number
  errors?: string[]
}

export class ChordProcessorService {
  private config: ChordProcessorConfig

  constructor() {
    this.config = {
      pythonPath: process.env.PYTHON_PATH || "python3",
      scriptsPath: path.join(process.cwd(), "backend"),
      outputPath: path.join(process.cwd(), "public", "processed"),
      tempPath: path.join(process.cwd(), "temp"),
    }
  }

  async checkSystemStatus(): Promise<{
    pythonAvailable: boolean
    dependenciesInstalled: boolean
    scriptsExist: boolean
    directoriesWritable: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    let pythonAvailable = false
    let dependenciesInstalled = false
    let scriptsExist = false
    let directoriesWritable = false

    try {
      // Check Python availability
      await this.runPythonCommand(["-c", "import sys; print(sys.version)"])
      pythonAvailable = true
    } catch (error) {
      errors.push("Python not available or not in PATH")
    }

    try {
      // Check required dependencies
      const requiredPackages = ["mido", "numpy", "music21", "pretty_midi"]
      for (const pkg of requiredPackages) {
        await this.runPythonCommand(["-c", `import ${pkg}`])
      }
      dependenciesInstalled = true
    } catch (error) {
      errors.push("Required Python packages not installed")
    }

    try {
      // Check if scripts exist
      const requiredScripts = ["chord_processor.py", "chord_sets_processor.py"]
      for (const script of requiredScripts) {
        await fs.access(path.join(this.config.scriptsPath, script))
      }
      scriptsExist = true
    } catch (error) {
      errors.push("Required Python scripts not found")
    }

    try {
      // Check directory permissions
      await fs.mkdir(this.config.outputPath, { recursive: true })
      await fs.mkdir(this.config.tempPath, { recursive: true })

      // Test write permissions
      const testFile = path.join(this.config.tempPath, "test.txt")
      await fs.writeFile(testFile, "test")
      await fs.unlink(testFile)

      directoriesWritable = true
    } catch (error) {
      errors.push("Cannot write to required directories")
    }

    return {
      pythonAvailable,
      dependenciesInstalled,
      scriptsExist,
      directoriesWritable,
      errors,
    }
  }

  async processZipFile(zipBuffer: Buffer, filename: string): Promise<ProcessingResult> {
    const startTime = Date.now()

    try {
      // Save ZIP file to temp directory
      const tempZipPath = path.join(this.config.tempPath, filename)
      await fs.writeFile(tempZipPath, zipBuffer)

      // Run Python chord processor
      const result = await this.runPythonCommand([
        path.join(this.config.scriptsPath, "chord_processor.py"),
        "--input",
        tempZipPath,
        "--output",
        this.config.outputPath,
        "--format",
        "json",
      ])

      // Parse the result
      const output = JSON.parse(result)

      // Clean up temp file
      await fs.unlink(tempZipPath)

      return {
        success: true,
        chordSets: output.chordSets || [],
        totalChords: output.totalChords || 0,
        categories: output.categories || {},
        processingTime: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        chordSets: [],
        totalChords: 0,
        categories: {},
        processingTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      }
    }
  }

  async generateMidiFromChords(chords: any[], options: any): Promise<string> {
    try {
      const inputData = {
        chords,
        options,
      }

      const inputFile = path.join(this.config.tempPath, `chords_${Date.now()}.json`)
      const outputFile = path.join(this.config.tempPath, `output_${Date.now()}.mid`)

      // Write input data
      await fs.writeFile(inputFile, JSON.stringify(inputData))

      // Run MIDI generation script
      await this.runPythonCommand([
        path.join(this.config.scriptsPath, "chord_sets_processor.py"),
        "--input",
        inputFile,
        "--output",
        outputFile,
        "--mode",
        "generate",
      ])

      // Read generated MIDI file
      const midiBuffer = await fs.readFile(outputFile)
      const base64Data = midiBuffer.toString("base64")

      // Clean up temp files
      await fs.unlink(inputFile)
      await fs.unlink(outputFile)

      return base64Data
    } catch (error) {
      throw new Error(`MIDI generation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async runSystemTest(): Promise<{
    success: boolean
    testResults: Record<string, boolean>
    errors: string[]
  }> {
    const testResults: Record<string, boolean> = {}
    const errors: string[] = []

    try {
      // Test 1: Python execution
      await this.runPythonCommand(["-c", "print('Python test successful')"])
      testResults.pythonExecution = true
    } catch (error) {
      testResults.pythonExecution = false
      errors.push("Python execution test failed")
    }

    try {
      // Test 2: Package imports
      await this.runPythonCommand(["-c", "import mido, numpy, music21; print('Imports successful')"])
      testResults.packageImports = true
    } catch (error) {
      testResults.packageImports = false
      errors.push("Package import test failed")
    }

    try {
      // Test 3: File operations
      const testFile = path.join(this.config.tempPath, "system_test.txt")
      await fs.writeFile(testFile, "test data")
      await fs.readFile(testFile)
      await fs.unlink(testFile)
      testResults.fileOperations = true
    } catch (error) {
      testResults.fileOperations = false
      errors.push("File operations test failed")
    }

    try {
      // Test 4: Script execution
      await this.runPythonCommand([path.join(this.config.scriptsPath, "chord_processor.py"), "--test"])
      testResults.scriptExecution = true
    } catch (error) {
      testResults.scriptExecution = false
      errors.push("Script execution test failed")
    }

    const success = Object.values(testResults).every((result) => result === true)

    return {
      success,
      testResults,
      errors,
    }
  }

  private async runPythonCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.config.pythonPath, args)
      let stdout = ""
      let stderr = ""

      process.stdout.on("data", (data) => {
        stdout += data.toString()
      })

      process.stderr.on("data", (data) => {
        stderr += data.toString()
      })

      process.on("close", (code) => {
        if (code === 0) {
          resolve(stdout.trim())
        } else {
          reject(new Error(`Python process exited with code ${code}: ${stderr}`))
        }
      })

      process.on("error", (error) => {
        reject(error)
      })
    })
  }
}

export const chordProcessorService = new ChordProcessorService()
