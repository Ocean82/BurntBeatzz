import { spawn } from "child_process"
import path from "path"
import fs from "fs/promises"

export interface RVCConversionOptions {
  inputAudioPath: string
  outputAudioPath: string
  modelPath: string
  pitchShift?: number
  indexRate?: number
  filterRadius?: number
  rmsThreshold?: number
  protectVoiceless?: number
  method?: "harvest" | "pm" | "crepe" | "rmvpe"
}

export interface MidiToRVCOptions {
  midiPath: string
  rvcModelPath: string
  outputPath: string
  soundfont?: string
  tempo?: number
  pitchShift?: number
  lyrics?: string
  scaleSamplePath?: string
}

export class RVCIntegrationService {
  private static instance: RVCIntegrationService
  private rvcPath: string
  private isInitialized = false

  private constructor() {
    this.rvcPath = path.join(process.cwd(), "Retrieval-based-Voice-Conversion-WebUI")
  }

  static getInstance(): RVCIntegrationService {
    if (!RVCIntegrationService.instance) {
      RVCIntegrationService.instance = new RVCIntegrationService()
    }
    return RVCIntegrationService.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Check if RVC directory exists
      const rvcExists = await fs
        .access(this.rvcPath)
        .then(() => true)
        .catch(() => false)

      if (!rvcExists) {
        console.warn("⚠️ RVC not found. Please ensure Retrieval-based-Voice-Conversion-WebUI is installed.")
        console.warn("📁 Expected path:", this.rvcPath)
        return
      }

      // Check for required models
      const requiredPaths = [
        "assets/hubert/hubert_base.pt",
        "assets/rmvpe/rmvpe.pt",
        "assets/pretrained_v2/D40k.pth",
        "assets/pretrained_v2/G40k.pth",
      ]

      for (const requiredPath of requiredPaths) {
        const fullPath = path.join(this.rvcPath, requiredPath)
        const exists = await fs
          .access(fullPath)
          .then(() => true)
          .catch(() => false)

        if (!exists) {
          console.warn(`⚠️ Required RVC model not found: ${requiredPath}`)
        } else {
          console.log(`✅ Found RVC model: ${requiredPath}`)
        }
      }

      this.isInitialized = true
      console.log("🎤 RVC Integration Service initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize RVC Integration Service:", error)
      throw error
    }
  }

  async convertVoice(options: RVCConversionOptions): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const {
      inputAudioPath,
      outputAudioPath,
      modelPath,
      pitchShift = 0,
      indexRate = 0.75,
      filterRadius = 3,
      rmsThreshold = 0.25,
      protectVoiceless = 0.33,
      method = "rmvpe",
    } = options

    console.log("🎤 Starting RVC voice conversion...")
    console.log("📁 Input:", inputAudioPath)
    console.log("📤 Output:", outputAudioPath)
    console.log("🎭 Model:", modelPath)

    return new Promise((resolve, reject) => {
      const inferScript = path.join(this.rvcPath, "infer", "modules", "vc", "modules.py")

      // Check if we have the CLI tool
      const cliScript = path.join(this.rvcPath, "tools", "infer_cli.py")
      const scriptToUse = fs
        .access(cliScript)
        .then(() => cliScript)
        .catch(() => inferScript)

      scriptToUse
        .then((script) => {
          const args = [
            script,
            "--input_path",
            inputAudioPath,
            "--output_path",
            outputAudioPath,
            "--model_path",
            modelPath,
            "--transpose",
            pitchShift.toString(),
            "--index_rate",
            indexRate.toString(),
            "--filter_radius",
            filterRadius.toString(),
            "--rms_mix_rate",
            rmsThreshold.toString(),
            "--protect",
            protectVoiceless.toString(),
            "--method",
            method,
          ]

          console.log("🐍 Python command:", "python3", args.join(" "))

          const pythonProcess = spawn("python3", args, {
            cwd: this.rvcPath,
            env: {
              ...process.env,
              PYTHONPATH: this.rvcPath,
            },
          })

          let stdout = ""
          let stderr = ""

          pythonProcess.stdout.on("data", (data) => {
            const output = data.toString()
            stdout += output
            console.log("🎤 RVC:", output.trim())
          })

          pythonProcess.stderr.on("data", (data) => {
            const error = data.toString()
            stderr += error
            console.error("🎤 RVC Error:", error.trim())
          })

          pythonProcess.on("close", (code) => {
            if (code === 0) {
              console.log("✅ RVC voice conversion completed")
              resolve(outputAudioPath)
            } else {
              console.error("❌ RVC conversion failed with code:", code)
              reject(new Error(`RVC conversion failed: ${stderr || "Unknown error"}`))
            }
          })

          pythonProcess.on("error", (error) => {
            console.error("❌ Failed to start RVC process:", error)
            reject(new Error(`Failed to start RVC process: ${error.message}`))
          })
        })
        .catch(reject)
    })
  }

  async convertMidiToRVC(options: MidiToRVCOptions): Promise<string> {
    const {
      midiPath,
      rvcModelPath,
      outputPath,
      soundfont = "default",
      tempo = 1.0,
      pitchShift = 0,
      lyrics,
      scaleSamplePath,
    } = options

    try {
      console.log("🎵 Starting MIDI to RVC pipeline...")

      // Step 1: Convert MIDI to audio using FluidSynth
      const tempAudioPath = path.join(path.dirname(outputPath), `temp_${Date.now()}.wav`)
      console.log("🎼 Converting MIDI to audio...")
      await this.convertMidiToAudio(midiPath, tempAudioPath, soundfont, tempo)

      // Step 2: If scale sample provided, blend it with the audio
      let processedAudioPath = tempAudioPath
      if (scaleSamplePath) {
        console.log("🎼 Blending with scale sample...")
        processedAudioPath = await this.blendWithScaleSample(tempAudioPath, scaleSamplePath)
      }

      // Step 3: If lyrics provided, create vocal track
      let vocalAudioPath = processedAudioPath
      if (lyrics) {
        console.log("🎤 Creating vocal track from lyrics...")
        vocalAudioPath = await this.createVocalTrack(midiPath, lyrics, processedAudioPath)
      }

      // Step 4: Apply RVC conversion
      console.log("🎤 Applying RVC voice conversion...")
      const finalOutputPath = await this.convertVoice({
        inputAudioPath: vocalAudioPath,
        outputAudioPath: outputPath,
        modelPath: rvcModelPath,
        pitchShift,
      })

      // Cleanup temp files
      try {
        await fs.unlink(tempAudioPath)
        if (processedAudioPath !== tempAudioPath) {
          await fs.unlink(processedAudioPath)
        }
        if (vocalAudioPath !== processedAudioPath && vocalAudioPath !== tempAudioPath) {
          await fs.unlink(vocalAudioPath)
        }
      } catch (cleanupError) {
        console.warn("⚠️ Failed to cleanup temp files:", cleanupError)
      }

      console.log("✅ MIDI to RVC conversion completed successfully")
      return finalOutputPath
    } catch (error) {
      console.error("❌ MIDI to RVC conversion failed:", error)
      throw error
    }
  }

  private async convertMidiToAudio(
    midiPath: string,
    outputPath: string,
    soundfont: string,
    tempo: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const soundfontPath = this.getSoundfontPath(soundfont)

      const args = [
        "-ni", // No interactive mode
        "-g",
        "0.8", // Gain
        "-T",
        tempo.toString(), // Tempo multiplier
        "-F",
        outputPath, // Output file
        soundfontPath, // Soundfont
        midiPath, // MIDI file
      ]

      console.log("🎛️ FluidSynth command:", "fluidsynth", args.join(" "))

      const fluidsynth = spawn("fluidsynth", args)

      let stderr = ""

      fluidsynth.stderr.on("data", (data) => {
        stderr += data.toString()
      })

      fluidsynth.on("close", (code) => {
        if (code === 0) {
          console.log("✅ FluidSynth conversion completed")
          resolve()
        } else {
          console.error("❌ FluidSynth failed:", stderr)
          reject(new Error(`FluidSynth failed: ${stderr}`))
        }
      })

      fluidsynth.on("error", (error) => {
        reject(new Error(`Failed to start FluidSynth: ${error.message}`))
      })
    })
  }

  private async blendWithScaleSample(audioPath: string, scaleSamplePath: string): Promise<string> {
    const outputPath = audioPath.replace(".wav", "_blended.wav")

    return new Promise((resolve, reject) => {
      // Use FFmpeg to blend the audio with the scale sample
      const args = [
        "-i",
        audioPath,
        "-i",
        scaleSamplePath,
        "-filter_complex",
        "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2",
        "-c:a",
        "pcm_s16le",
        outputPath,
      ]

      console.log("🎵 FFmpeg blend command:", "ffmpeg", args.join(" "))

      const ffmpeg = spawn("ffmpeg", args)

      let stderr = ""

      ffmpeg.stderr.on("data", (data) => {
        stderr += data.toString()
      })

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          console.log("✅ Audio blending completed")
          resolve(outputPath)
        } else {
          console.error("❌ FFmpeg blending failed:", stderr)
          reject(new Error(`Audio blending failed: ${stderr}`))
        }
      })

      ffmpeg.on("error", (error) => {
        reject(new Error(`Failed to start FFmpeg: ${error.message}`))
      })
    })
  }

  private async createVocalTrack(midiPath: string, lyrics: string, instrumentalPath: string): Promise<string> {
    // This is a simplified implementation
    // In a real scenario, you'd want to:
    // 1. Extract vocal melody from MIDI
    // 2. Generate speech/singing from lyrics using TTS
    // 3. Align with the melody timing

    const vocalPath = instrumentalPath.replace(".wav", "_vocal.wav")

    // For now, we'll use the instrumental as base for RVC conversion
    // The RVC model will transform it into singing based on the lyrics
    await fs.copyFile(instrumentalPath, vocalPath)

    // TODO: Implement proper vocal track generation
    // This could involve:
    // - Using a TTS system to generate speech from lyrics
    // - Extracting melody from MIDI and applying it to the speech
    // - Using a singing synthesis system

    console.log("🎤 Vocal track created (using instrumental as base)")
    return vocalPath
  }

  private getSoundfontPath(soundfont: string): string {
    const soundfontsDir = path.join(process.cwd(), "soundfonts")

    const soundfontMap: Record<string, string> = {
      default: "FluidR3_GM.sf2",
      orchestral: "Orchestral_Strings.sf2",
      rock: "Rock_Kit.sf2",
      electronic: "Electronic_Synths.sf2",
      piano: "Piano_Collection.sf2",
      strings: "String_Ensemble.sf2",
    }

    const soundfontFile = soundfontMap[soundfont] || soundfontMap.default
    return path.join(soundfontsDir, soundfontFile)
  }

  async getAvailableModels(): Promise<
    Array<{
      id: string
      name: string
      path: string
      size: number
      created: string
    }>
  > {
    try {
      const modelsDir = path.join(this.rvcPath, "logs")
      const modelFolders = await fs.readdir(modelsDir)

      const models = []

      for (const folder of modelFolders) {
        const modelPath = path.join(modelsDir, folder)
        const stats = await fs.stat(modelPath)

        if (stats.isDirectory()) {
          // Look for .pth files in the model directory
          const files = await fs.readdir(modelPath)
          const pthFiles = files.filter((f) => f.endsWith(".pth"))

          if (pthFiles.length > 0) {
            const modelFile = path.join(modelPath, pthFiles[0])
            const modelStats = await fs.stat(modelFile)

            models.push({
              id: folder,
              name: folder,
              path: modelFile,
              size: modelStats.size,
              created: modelStats.birthtime.toISOString(),
            })
          }
        }
      }

      return models
    } catch (error) {
      console.error("❌ Failed to get available models:", error)
      return []
    }
  }

  async trainModel(options: {
    modelName: string
    audioFiles: string[]
    epochs?: number
    batchSize?: number
  }): Promise<string> {
    const { modelName, audioFiles, epochs = 100, batchSize = 8 } = options

    console.log("🎓 Starting RVC model training...")
    console.log("📛 Model name:", modelName)
    console.log("📁 Audio files:", audioFiles.length)

    return new Promise((resolve, reject) => {
      const trainScript = path.join(this.rvcPath, "train.py")

      const args = [
        trainScript,
        "--model_name",
        modelName,
        "--epochs",
        epochs.toString(),
        "--batch_size",
        batchSize.toString(),
        "--audio_files",
        ...audioFiles,
      ]

      console.log("🐍 Training command:", "python3", args.join(" "))

      const pythonProcess = spawn("python3", args, {
        cwd: this.rvcPath,
        env: {
          ...process.env,
          PYTHONPATH: this.rvcPath,
        },
      })

      let stdout = ""
      let stderr = ""

      pythonProcess.stdout.on("data", (data) => {
        const output = data.toString()
        stdout += output
        console.log("🎓 Training:", output.trim())
      })

      pythonProcess.stderr.on("data", (data) => {
        const error = data.toString()
        stderr += error
        console.error("🎓 Training Error:", error.trim())
      })

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          console.log("✅ RVC model training completed")
          const modelPath = path.join(this.rvcPath, "logs", modelName)
          resolve(modelPath)
        } else {
          console.error("❌ RVC training failed with code:", code)
          reject(new Error(`RVC training failed: ${stderr || "Unknown error"}`))
        }
      })

      pythonProcess.on("error", (error) => {
        console.error("❌ Failed to start training process:", error)
        reject(new Error(`Failed to start training process: ${error.message}`))
      })
    })
  }
}

// Export singleton instance
export const rvcService = RVCIntegrationService.getInstance()
