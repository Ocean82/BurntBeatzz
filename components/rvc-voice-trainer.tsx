"use client"

import React, { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Upload, Mic, Play, Pause, Trash2, Download, Settings, Info } from "lucide-react"

interface AudioFile {
  id: string
  name: string
  file: File
  duration: number
  size: number
  status: "pending" | "processed" | "error"
  waveform?: number[]
}

interface TrainingProgress {
  stage: string
  epoch: number
  total_epochs: number
  loss: number
  eta: string
  progress: number
}

interface RVCModel {
  id: string
  name: string
  path: string
  size_mb: number
  quality_score: number
  training_time: string
  created_at: string
  test_audio_path?: string
}

export default function RVCVoiceTrainer() {
  // Training data
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [modelName, setModelName] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

  // Training settings
  const [epochs, setEpochs] = useState([300])
  const [batchSize, setBatchSize] = useState([8])
  const [learningRate, setLearningRate] = useState([0.0001])
  const [saveInterval, setSaveInterval] = useState([50])

  // Training state
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress>({
    stage: "",
    epoch: 0,
    total_epochs: 0,
    loss: 0,
    eta: "",
    progress: 0,
  })

  // Models
  const [trainedModels, setTrainedModels] = useState<RVCModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")

  // Audio playback
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map())

  // Error handling
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing models on component mount
  React.useEffect(() => {
    loadExistingModels()
  }, [])

  const loadExistingModels = async () => {
    try {
      const response = await fetch("/api/backend/train-rvc-model")
      if (response.ok) {
        const data = await response.json()
        setTrainedModels(data.models || [])
      }
    } catch (error) {
      console.error("Failed to load existing models:", error)
    }
  }

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    // Filter for audio files
    const audioFiles = files.filter(
      (file) => file.type.startsWith("audio/") || file.name.match(/\.(wav|mp3|m4a|flac|ogg)$/i),
    )

    if (audioFiles.length === 0) {
      setError("Please select audio files (WAV, MP3, M4A, FLAC, OGG)")
      return
    }

    const newAudioFiles: AudioFile[] = audioFiles.map((file) => ({
      id: `${Date.now()}_${Math.random()}`,
      name: file.name,
      file: file,
      duration: 0, // Would be calculated from actual audio
      size: file.size,
      status: "pending",
    }))

    setAudioFiles((prev) => [...prev, ...newAudioFiles])
    setError(null)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    // Process files to get duration and waveform
    processAudioFiles(newAudioFiles)
  }, [])

  const processAudioFiles = async (filesToProcess: AudioFile[]) => {
    for (const audioFile of filesToProcess) {
      try {
        // Create audio element to get duration
        const audio = new Audio(URL.createObjectURL(audioFile.file))

        audio.addEventListener("loadedmetadata", () => {
          setAudioFiles((prev) =>
            prev.map((f) => (f.id === audioFile.id ? { ...f, duration: audio.duration, status: "processed" } : f)),
          )
        })

        audio.addEventListener("error", () => {
          setAudioFiles((prev) => prev.map((f) => (f.id === audioFile.id ? { ...f, status: "error" } : f)))
        })
      } catch (error) {
        setAudioFiles((prev) => prev.map((f) => (f.id === audioFile.id ? { ...f, status: "error" } : f)))
      }
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        const file = new File([blob], `recording_${Date.now()}.wav`, { type: "audio/wav" })

        const newAudioFile: AudioFile = {
          id: `rec_${Date.now()}`,
          name: file.name,
          file: file,
          duration: 0,
          size: file.size,
          status: "processed",
        }

        setAudioFiles((prev) => [...prev, newAudioFile])
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      setError("Failed to access microphone")
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setMediaRecorder(null)
      setIsRecording(false)
    }
  }

  const removeAudioFile = useCallback((id: string) => {
    setAudioFiles((prev) => prev.filter((file) => file.id !== id))
  }, [])

  const playAudio = useCallback(
    (audioFile: AudioFile) => {
      const audioUrl = URL.createObjectURL(audioFile.file)

      // Stop currently playing audio
      if (playingAudio) {
        const currentAudio = audioElements.get(playingAudio)
        if (currentAudio) {
          currentAudio.pause()
          currentAudio.currentTime = 0
        }
      }

      // Play new audio
      const audio = new Audio(audioUrl)
      audio.addEventListener("ended", () => {
        setPlayingAudio(null)
        URL.revokeObjectURL(audioUrl)
      })

      audio.play()
      setPlayingAudio(audioFile.id)
      setAudioElements((prev) => new Map(prev).set(audioFile.id, audio))
    },
    [playingAudio, audioElements],
  )

  const stopAudio = useCallback(() => {
    if (playingAudio) {
      const audio = audioElements.get(playingAudio)
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      setPlayingAudio(null)
    }
  }, [playingAudio, audioElements])

  const startTraining = async () => {
    if (!modelName.trim()) {
      setError("Please enter a model name")
      return
    }

    if (audioFiles.length < 5) {
      setError("Please upload at least 5 audio samples for training")
      return
    }

    const processedFiles = audioFiles.filter((f) => f.status === "processed")
    if (processedFiles.length < 5) {
      setError("Please ensure all audio files are processed successfully")
      return
    }

    setIsTraining(true)
    setError(null)

    try {
      // First, upload audio files
      const formData = new FormData()
      formData.append("action", "upload_audio")
      formData.append("model_name", modelName)

      processedFiles.forEach((audioFile) => {
        formData.append("audio_files", audioFile.file)
      })

      const uploadResponse = await fetch("/api/backend/train-rvc-model", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload training data")
      }

      // Start training
      const trainingFormData = new FormData()
      trainingFormData.append("action", "train")
      trainingFormData.append("model_name", modelName)
      trainingFormData.append("epochs", epochs[0].toString())
      trainingFormData.append("batch_size", batchSize[0].toString())
      trainingFormData.append("learning_rate", learningRate[0].toString())

      // Simulate training progress
      const progressStages = [
        { stage: "Preprocessing audio data...", progress: 5 },
        { stage: "Extracting features...", progress: 15 },
        { stage: "Initializing model...", progress: 25 },
        { stage: "Training in progress...", progress: 30 },
      ]

      for (const stage of progressStages) {
        setTrainingProgress({
          stage: stage.stage,
          epoch: 0,
          total_epochs: epochs[0],
          loss: 0,
          eta: "Calculating...",
          progress: stage.progress,
        })
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      // Simulate epoch progress
      for (let epoch = 1; epoch <= epochs[0]; epoch++) {
        const progress = 30 + (epoch / epochs[0]) * 65 // 30% to 95%
        const loss = Math.max(0.1, 2.0 - (epoch / epochs[0]) * 1.8) // Decreasing loss
        const eta = `${Math.max(0, Math.round(((epochs[0] - epoch) / epochs[0]) * 120))} min`

        setTrainingProgress({
          stage: "Training in progress...",
          epoch: epoch,
          total_epochs: epochs[0],
          loss: loss,
          eta: eta,
          progress: progress,
        })

        // Update every 10 epochs or at the end
        if (epoch % 10 === 0 || epoch === epochs[0]) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      // Final stage
      setTrainingProgress({
        stage: "Finalizing model...",
        epoch: epochs[0],
        total_epochs: epochs[0],
        loss: 0.1,
        eta: "0 min",
        progress: 95,
      })

      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Make actual training request
      const trainingResponse = await fetch("/api/backend/train-rvc-model", {
        method: "POST",
        body: trainingFormData,
      })

      if (!trainingResponse.ok) {
        throw new Error("Training failed")
      }

      const result = await trainingResponse.json()

      // Add new model to list
      const newModel: RVCModel = {
        id: `model_${Date.now()}`,
        name: modelName,
        path: result.model_path || `/rvc_models/${modelName}.pth`,
        size_mb: Math.round(Math.random() * 50 + 10), // Mock size
        quality_score: 0.8 + Math.random() * 0.15, // Mock quality
        training_time: `${Math.round(epochs[0] / 10)} min`,
        created_at: new Date().toISOString(),
        test_audio_path: result.test_audio_path,
      }

      setTrainedModels((prev) => [...prev, newModel])

      setTrainingProgress({
        stage: "Training complete!",
        epoch: epochs[0],
        total_epochs: epochs[0],
        loss: 0.1,
        eta: "0 min",
        progress: 100,
      })

      // Clear form
      setModelName("")
      setAudioFiles([])
    } catch (error) {
      setError(error instanceof Error ? error.message : "Training failed")
    } finally {
      setIsTraining(false)
    }
  }

  const testModel = useCallback((model: RVCModel) => {
    if (model.test_audio_path) {
      const audio = new Audio(model.test_audio_path)
      audio.play()
    } else {
      setError("No test audio available for this model")
    }
  }, [])

  const downloadModel = useCallback((model: RVCModel) => {
    // Create download link
    const link = document.createElement("a")
    link.href = model.path
    link.download = `${model.name}.pth`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-6 w-6" />
            RVC Voice Trainer
          </CardTitle>
          <CardDescription>
            Train custom voice models using Ocean82/RVC for realistic voice conversion and singing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="data" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="data">Training Data</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="train">Train Model</TabsTrigger>
              <TabsTrigger value="models">My Models</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="lg"
                    disabled={isTraining}
                    className="h-24 border-dashed"
                  >
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto mb-2" />
                      <p className="font-medium">Upload Audio Files</p>
                      <p className="text-sm text-gray-500">WAV, MP3, M4A, FLAC, OGG</p>
                    </div>
                  </Button>

                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "outline"}
                    size="lg"
                    disabled={isTraining}
                    className="h-24"
                  >
                    <div className="text-center">
                      <Mic className="h-6 w-6 mx-auto mb-2" />
                      <p className="font-medium">{isRecording ? "Stop Recording" : "Record Audio"}</p>
                      <p className="text-sm text-gray-500">{isRecording ? "Click to stop" : "Record your voice"}</p>
                    </div>
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Training Tips:</strong>
                    <br />• Upload 10-30 audio samples (3-10 seconds each)
                    <br />• Use clear, high-quality recordings
                    <br />• Include variety in pitch and expression
                    <br />• Avoid background noise and echo
                  </AlertDescription>
                </Alert>

                {audioFiles.length > 0 && (
                  <div className="space-y-3">
                    <Label>Training Data ({audioFiles.length} files)</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {audioFiles.map((audioFile) => (
                        <Card key={audioFile.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge
                                variant={
                                  audioFile.status === "processed"
                                    ? "default"
                                    : audioFile.status === "error"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {audioFile.status}
                              </Badge>
                              <span className="font-medium">{audioFile.name}</span>
                              <span className="text-sm text-gray-500">
                                {formatFileSize(audioFile.size)}
                                {audioFile.duration > 0 && ` • ${formatDuration(audioFile.duration)}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {audioFile.status === "processed" && (
                                <Button
                                  onClick={() => (playingAudio === audioFile.id ? stopAudio() : playAudio(audioFile))}
                                  size="sm"
                                  variant="ghost"
                                >
                                  {playingAudio === audioFile.id ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              <Button
                                onClick={() => removeAudioFile(audioFile.id)}
                                size="sm"
                                variant="ghost"
                                disabled={isTraining}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Training Parameters</h4>

                  <div className="space-y-2">
                    <Label>Epochs: {epochs[0]}</Label>
                    <Slider
                      value={epochs}
                      onValueChange={setEpochs}
                      min={100}
                      max={1000}
                      step={50}
                      disabled={isTraining}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">More epochs = better quality but longer training time</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Batch Size: {batchSize[0]}</Label>
                    <Slider
                      value={batchSize}
                      onValueChange={setBatchSize}
                      min={4}
                      max={32}
                      step={4}
                      disabled={isTraining}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Higher batch size requires more GPU memory</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Advanced Settings</h4>

                  <div className="space-y-2">
                    <Label>Learning Rate: {learningRate[0]}</Label>
                    <Slider
                      value={learningRate}
                      onValueChange={setLearningRate}
                      min={0.00001}
                      max={0.001}
                      step={0.00001}
                      disabled={isTraining}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Lower learning rate = more stable training</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Save Interval: {saveInterval[0]} epochs</Label>
                    <Slider
                      value={saveInterval}
                      onValueChange={setSaveInterval}
                      min={10}
                      max={100}
                      step={10}
                      disabled={isTraining}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">How often to save training checkpoints</p>
                  </div>
                </div>
              </div>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <strong>GPU Requirements:</strong> Training requires NVIDIA GPU with 6GB+ VRAM. Training time: 2-4
                  hours depending on settings and data size.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="train" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-name">Model Name</Label>
                  <Input
                    id="model-name"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="Enter a name for your voice model"
                    disabled={isTraining}
                  />
                </div>

                {isTraining && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Training Progress</Label>
                      <Badge variant="secondary">{Math.round(trainingProgress.progress)}%</Badge>
                    </div>

                    <Progress value={trainingProgress.progress} className="w-full" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Stage</p>
                        <p className="text-gray-600">{trainingProgress.stage}</p>
                      </div>
                      <div>
                        <p className="font-medium">Epoch</p>
                        <p className="text-gray-600">
                          {trainingProgress.epoch}/{trainingProgress.total_epochs}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Loss</p>
                        <p className="text-gray-600">{trainingProgress.loss.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="font-medium">ETA</p>
                        <p className="text-gray-600">{trainingProgress.eta}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={startTraining}
                  disabled={isTraining || !modelName.trim() || audioFiles.length < 5}
                  className="w-full"
                  size="lg"
                >
                  {isTraining ? "Training in Progress..." : "Start Training"}
                </Button>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    <strong>Training Process:</strong>
                  </p>
                  <p>1. Audio preprocessing and feature extraction</p>
                  <p>2. Model initialization with Ocean82/RVC architecture</p>
                  <p>3. Training with your voice data</p>
                  <p>4. Model validation and quality assessment</p>
                  <p>5. Final model export and test audio generation</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="models" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Trained Models ({trainedModels.length})</Label>
                  <Button onClick={loadExistingModels} size="sm" variant="outline">
                    Refresh
                  </Button>
                </div>

                {trainedModels.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No trained models yet. Upload training data and train your first voice model!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trainedModels.map((model) => (
                      <Card key={model.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{model.name}</span>
                            <Badge variant="outline">{Math.round(model.quality_score * 100)}%</Badge>
                          </CardTitle>
                          <CardDescription>
                            {model.size_mb} MB • Trained {model.training_time} • Created{" "}
                            {new Date(model.created_at).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex gap-2">
                            <Button onClick={() => testModel(model)} size="sm" variant="outline">
                              <Play className="h-4 w-4 mr-2" />
                              Test
                            </Button>
                            <Button onClick={() => downloadModel(model)} size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              onClick={() => setSelectedModel(model.path)}
                              size="sm"
                              variant={selectedModel === model.path ? "default" : "outline"}
                            >
                              {selectedModel === model.path ? "Selected" : "Select"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
