import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs/promises"
import { writeFile } from "fs/promises"

export async function GET(request: NextRequest) {
  try {
    // Get list of available RVC models
    const modelsDir = path.join(process.cwd(), "rvc_models")

    try {
      await fs.access(modelsDir)
    } catch {
      await fs.mkdir(modelsDir, { recursive: true })
    }

    const files = await fs.readdir(modelsDir)
    const models = files
      .filter((file) => file.endsWith(".pth"))
      .map((file) => ({
        id: file.replace(".pth", ""),
        name: file.replace(".pth", "").replace(/_/g, " "),
        path: path.join(modelsDir, file),
        size_mb: 0, // Would calculate actual size
        created: new Date().toISOString(),
      }))

    return NextResponse.json({ models })
  } catch (error) {
    console.error("Failed to get RVC models:", error)
    return NextResponse.json({ error: "Failed to get models" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const action = formData.get("action") as string

    if (action === "train") {
      return await trainRVCModel(formData)
    } else if (action === "upload_audio") {
      return await uploadTrainingAudio(formData)
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("RVC training error:", error)
    return NextResponse.json(
      { error: "Training failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

async function uploadTrainingAudio(formData: FormData) {
  const audioFiles = formData.getAll("audio_files") as File[]
  const modelName = formData.get("model_name") as string

  if (!audioFiles.length || !modelName) {
    return NextResponse.json({ error: "Missing audio files or model name" }, { status: 400 })
  }

  // Create directory for training data
  const trainingDir = path.join(process.cwd(), "rvc_training", modelName)
  await fs.mkdir(trainingDir, { recursive: true })

  const uploadedFiles = []

  for (let i = 0; i < audioFiles.length; i++) {
    const file = audioFiles[i]
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `sample_${i + 1}.wav`
    const filepath = path.join(trainingDir, filename)

    await writeFile(filepath, buffer)
    uploadedFiles.push(filepath)
  }

  return NextResponse.json({
    success: true,
    uploaded_files: uploadedFiles.length,
    training_dir: trainingDir,
  })
}

async function trainRVCModel(formData: FormData) {
  const modelName = formData.get("model_name") as string
  const epochs = Number.parseInt(formData.get("epochs") as string) || 300
  const batchSize = Number.parseInt(formData.get("batch_size") as string) || 8
  const learningRate = Number.parseFloat(formData.get("learning_rate") as string) || 0.0001

  if (!modelName) {
    return NextResponse.json({ error: "Model name is required" }, { status: 400 })
  }

  const trainingDir = path.join(process.cwd(), "rvc_training", modelName)
  const outputDir = path.join(process.cwd(), "rvc_models")

  // Ensure directories exist
  await fs.mkdir(outputDir, { recursive: true })

  // Check if training data exists
  try {
    const files = await fs.readdir(trainingDir)
    if (files.length === 0) {
      return NextResponse.json({ error: "No training data found" }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "Training directory not found" }, { status: 400 })
  }

  // Start RVC training process
  const pythonScript = path.join(process.cwd(), "backend", "rvc_voice_service.py")

  const trainingParams = {
    command: "train",
    model_name: modelName,
    training_dir: trainingDir,
    output_dir: outputDir,
    epochs: epochs,
    batch_size: batchSize,
    learning_rate: learningRate,
  }

  return new Promise((resolve) => {
    const pythonProcess = spawn("python3", [pythonScript], {
      stdio: ["pipe", "pipe", "pipe"],
    })

    pythonProcess.stdin.write(JSON.stringify(trainingParams))
    pythonProcess.stdin.end()

    let output = ""
    let error = ""

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString()
    })

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output)
          resolve(
            NextResponse.json({
              success: true,
              model_path: result.model_path,
              training_time: result.training_time,
              final_loss: result.final_loss,
            }),
          )
        } catch (parseError) {
          resolve(
            NextResponse.json(
              {
                error: "Failed to parse training output",
                details: output,
              },
              { status: 500 },
            ),
          )
        }
      } else {
        resolve(
          NextResponse.json(
            {
              error: "Training failed",
              details: error,
              exit_code: code,
            },
            { status: 500 },
          ),
        )
      }
    })
  })
}
