"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
} from "@/components/ui"
import {
  Eye,
  EyeOff,
  Mic,
  Trophy,
  Music,
  Search,
  Library,
  User,
  HardDrive,
  Edit,
  Sparkles,
  Volume2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AppHeader } from "@/components/app-header"
import { useMainContent } from "@/hooks/use-main-content"

//  ────────────────────────────────────────────────────────────────────────────
//  NOTE:  *** All state & helper code from the original file is intact. ***
//  ────────────────────────────────────────────────────────────────────────────
//  (nothing in the business logic was modified – only the missing JSX
//   closers were added so the file builds correctly.)
//  ────────────────────────────────────────────────────────────────────────────

const menuItems = [
  {
    id: "song-generator" as const,
    label: "Song Generator",
    icon: Music,
    description: "Create AI-powered music",
    badge: "New",
  },
  {
    id: "voice-cloning" as const,
    label: "Voice Cloning",
    icon: Mic,
    description: "Clone and synthesize voices",
    badge: "Beta",
  },
  {
    id: "music-discovery" as const,
    label: "Music Discovery",
    icon: Search,
    description: "Discover new tracks",
  },
  {
    id: "song-library" as const,
    label: "Song Library",
    icon: Library,
    description: "Your music collection",
  },
  {
    id: "song-editor" as const,
    label: "Song Editor",
    icon: Edit,
    description: "Edit and refine songs",
  },
  {
    id: "contest-boosts" as const,
    label: "Contest Boosts",
    icon: Trophy,
    description: "Boost your contest entries",
  },
  {
    id: "user-plan" as const,
    label: "User Plan",
    icon: User,
    description: "Manage your subscription",
  },
  {
    id: "storage-manager" as const,
    label: "Storage",
    icon: HardDrive,
    description: "Manage your files",
  },
]

export default function BurntBeatsApp() {
  const [selectedLogo, setSelectedLogo] = useState("/logos/demon-logo.jpeg")
  const [showLogoSelector, setShowLogoSelector] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Music generation states
  const [songData, setSongData] = useState({
    title: "",
    lyrics: "",
    genre: "",
    vocalStyle: "",
    tempo: [120],
    duration: [180],
    selectedVoiceId: null as string | null,
    selectedVoiceName: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSong, setGeneratedSong] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [isSimpleMode, setIsSimpleMode] = useState(true)

  // Voice cloning states
  const [showVoiceUpload, setShowVoiceUpload] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [voiceName, setVoiceName] = useState("")
  const [makePublic, setMakePublic] = useState(false)
  const [isCloningVoice, setIsCloningVoice] = useState(false)
  const [availableVoices, setAvailableVoices] = useState([
    {
      id: "voice_public_1",
      name: "Default Male Voice",
      isPublic: true,
      audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio%20sample%20BB1-H1FFSxbomW3iCfaAgmk0Hg37VA8KUb.mp3",
    },
    {
      id: "voice_public_2",
      name: "Default Female Voice",
      isPublic: true,
      audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Audion%20Sample%20BB2-sKRqesjrFVwnjY2IpduXNVzw8o0R5A.mp3",
    },
    { id: "voice_public_3", name: "Versatile Voice", isPublic: true, audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio%20VM%20for%20BB-e0JfvAP82p7pTkU6IkedDbiqkgNKc2.mp3" },
  ])

  // Advanced features states
  const [totalFileSize, setTotalFileSize] = useState(0)
  const [exportFormat, setExportFormat] = useState("mp3")
  const [draggedFiles, setDraggedFiles] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [showMixer, setShowMixer] = useState(false)
  const [showAI, setShowAI] = useState(true)
  const [aiMessages, setAiMessages] = useState(["Oh look, another 'producer' who thinks they're the next Kanye... 🙄"])
  const [stems, setStems] = useState({
    vocals: { volume: 75, muted: false },
    drums: { volume: 80, muted: false },
    bass: { volume: 70, muted: false },
    melody: { volume: 85, muted: false },
  })

  const { toast } = useToast()

  // Sassy AI responses
  const sassyResponses = [
    "That beat is more basic than a pumpkin spice latte 🎃",
    "I've heard elevator music with more soul than this...",
    "Are you trying to make music or summon demons? Because this ain't it chief 😈",
    "Your lyrics are so fire... said no one ever 🔥❄️",
    "This track has less energy than a dead battery 🔋",
    "I'm not saying your music is bad, but my circuits are crying 🤖😭",
    "That melody is flatter than Earth according to conspiracy theorists 🌍",
    "Your tempo is slower than internet in 1995 📡",
    "This beat hits different... like a wet noodle 🍜",
    "I've analyzed 10 million songs, and this... this is definitely one of them 📊",
  ]

  // Mock file sizes for generated tracks
  const [generatedTracks, setGeneratedTracks] = useState([
    { id: 1, title: "Burnt Nights", size: 4.2, duration: "3:24", audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio%20sample%20BB1-H1FFSxbomW3iCfaAgmk0Hg37VA8KUb.mp3" },
    { id: 2, title: "Fire Dreams", size: 5.8, duration: "3:45", audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Audion%20Sample%20BB2-sKRqesjrFVwnjY2IpduXNVzw8o0R5A.mp3" },
    { id: 3, title: "Inferno Vibes", size: 3.9, duration: "2:58", audioUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio%20VM%20for%20BB-e0JfvAP82p7pTkU6IkedDbiqkgNKc2.mp3" },
  ])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files).map((file) => file.name)
    setDraggedFiles([...draggedFiles, ...files])

    // Add sassy comment about dropped files
    const newMessage = sassyResponses[Math.floor(Math.random() * sassyResponses.length)]
    setAiMessages((prev) => [...prev, newMessage])
  }

  const addSassyComment = () => {
    const newMessage = sassyResponses[Math.floor(Math.random() * sassyResponses.length)]
    setAiMessages((prev) => [...prev, newMessage])
  }

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        setRecordedBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop()
          setIsRecording(false)
        }
      }, 30000)
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access microphone",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
  }

  // Voice cloning function
  const handleCloneVoice = async () => {
    if (!voiceName.trim() || (!recordedBlob && !uploadedFile)) {
      toast({
        title: "Missing Information",
        description: "Please provide a voice name and audio sample",
        variant: "destructive",
      })
      return
    }

    setIsCloningVoice(true)

    try {
      const formData = new FormData()
      formData.append("name", voiceName)
      formData.append("makePublic", makePublic.toString())
      formData.append("userId", "user_123")

      if (recordedBlob) {
        formData.append("audio", recordedBlob, "recording.wav")
      } else if (uploadedFile) {
        formData.append("audio", uploadedFile)
      }

      const response = await fetch("/api/voice-cloning", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setAvailableVoices((prev) => [
          ...prev,
          {
            id: result.id,
            name: result.name,
            isPublic: result.isPublic,
            audioUrl: result.audioUrl,
          },
        ])

        toast({
          title: "Voice Cloned Successfully!",
          description: `"${voiceName}" is now available for music generation`,
        })

        // Reset form
        setVoiceName("")
        setRecordedBlob(null)
        setUploadedFile(null)
        setMakePublic(false)
        setShowVoiceUpload(false)
      } else {
        throw new Error("Failed to clone voice")
      }
    } catch (error) {
      toast({
        title: "Voice Cloning Failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsCloningVoice(false)
    }
  }

  // Music generation function
  const handleGenerate = async () => {
    if (!songData.title || !songData.lyrics || !songData.genre) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, lyrics, and genre",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      toast({
        title: "🎵 Starting Generation",
        description: "Analyzing your lyrics and preferences...",
      })

      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "🎤 Processing Vocals",
        description: `Applying ${songData.selectedVoiceName || "default"} voice characteristics...`,
      })

      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "🎸 Arranging Music",
        description: `Creating ${songData.genre} arrangement...`,
      })

      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Create generated song
      const newSong = {
        id: Date.now(),
        title: songData.title,
        audioUrl: songData.selectedVoiceId
          ? availableVoices.find((v) => v.id === songData.selectedVoiceId)?.audioUrl ||
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio%20sample%20BB1-H1FFSxbomW3iCfaAgmk0Hg37VA8KUb.mp3"
          : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/audio%20sample%20BB1-H1FFSxbomW3iCfaAgmk0Hg37VA8KUb.mp3",
        duration: `${Math.floor(songData.duration[0] / 60)}:${(songData.duration[0] % 60).toString().padStart(2, "0")}`,
        voiceName: songData.selectedVoiceName || "Default Voice",
        genre: songData.genre,
        size: Math.random() * 3 + 2,
      }

      setGeneratedSong(newSong)
      setGeneratedTracks((prev) => [newSong, ...prev])
      setTotalFileSize((prev) => prev + newSong.size)

      toast({
        title: "🔥 Song Generated!",
        description: `"${songData.title}" is ready to play`,
      })

      addSassyComment()
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Audio playback functions
  const handlePlayPause = (audioUrl: string) => {
    if (isPlaying && currentAudio) {
      currentAudio.pause()
      setIsPlaying(false)
      setCurrentAudio(null)
    } else {
      if (currentAudio) {
        currentAudio.pause()
      }

      const audio = new Audio(audioUrl)
      audio.volume = 0.7

      audio.onended = () => {
        setIsPlaying(false)
        setCurrentAudio(null)
      }

      audio.onerror = () => {
        toast({
          title: "Playback Error",
          description: "Failed to play audio",
          variant: "destructive",
        })
        setIsPlaying(false)
        setCurrentAudio(null)
      }

      setCurrentAudio(audio)
      audio.play()
      setIsPlaying(true)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      toast({
        title: "File Uploaded",
        description: `${file.name} ready for voice cloning`,
      })
    }
  }

  const genres = [
    "Pop",
    "Rock",
    "Hip Hop",
    "Electronic",
    "Jazz",
    "Classical",
    "Country",
    "R&B",
    "Reggae",
    "Blues",
    "Folk",
    "Punk",
    "Metal",
    "Indie",
    "Alternative",
    "Ambient",
  ]

  const voiceTypes = [
    "Male Vocalist",
    "Female Vocalist",
    "Child Voice",
    "Elderly Voice",
    "Robotic",
    "Whisper",
    "Powerful",
    "Soft",
    "Raspy",
    "Smooth",
  ]

  const moods = [
    "Happy",
    "Sad",
    "Energetic",
    "Calm",
    "Romantic",
    "Aggressive",
    "Mysterious",
    "Uplifting",
    "Melancholic",
    "Dreamy",
  ]

  const logoOptions = [
    { id: "demon", src: "/logos/demon-logo.jpeg", name: "Demon Fire" },
    { id: "minimal", src: "/logos/minimal-logo.jpeg", name: "Minimal Dark" },
    { id: "neon", src: "/logos/neon-wolf.jpeg", name: "Neon Wolf" },
    { id: "musical", src: "/logos/musical-note.jpeg", name: "Musical Note" },
    { id: "watermark", src: "/logos/watermark.png", name: "Watermark" },
    { id: "headphone", src: "/logos/headphone-character.png", name: "DJ Character" },
    { id: "fire-girl", src: "/logos/fire-girl.jpeg", name: "Fire Girl" },
    { id: "cute-fox-1", src: "/logos/cute-fox-1.jpeg", name: "Cute Fox" },
    { id: "cute-fox-2", src: "/logos/cute-fox-2.jpeg", name: "Cute Fox Alt" },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLogoSelector && !(event.target as Element).closest(".logo-selector")) {
        setShowLogoSelector(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showLogoSelector])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggedIn(true)
    toast({
      title: "Welcome to Burnt Beats!",
      description: "Ready to create some fire tracks?",
    })
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords don't match!",
        variant: "destructive",
      })
      return
    }
    setIsLoggedIn(true)
    toast({
      title: "Account Created!",
      description: "Welcome to Burnt Beats!",
    })
  }

  const { currentContent, setActiveMenuItem, activeMenuItem } = useMainContent()
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false)

  // Login/Register Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-2xl shadow-green-500/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/50">
                <img
                  src={selectedLogo || "/placeholder.svg"}
                  alt="Burnt Beats Logo"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-green-400 bg-clip-text text-transparent">
                Burnt Beats
              </h1>
            </div>
            <p className="text-green-300/80">Create fire tracks with AI</p>
          </CardHeader>
          <CardContent>
            <Tabs value={isLogin ? "login" : "register"} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/60 border border-green-500/20">
                <TabsTrigger
                  value="login"
                  onClick={() => setIsLogin(true)}
                  className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  onClick={() => setIsLogin(false)}
                  className="text-green-300 data-[state=active]:bg-green-500/30 data-[state=active]:text-white"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label className="text-green-300 mb-2 block">Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-green-300 mb-2 block">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-green-400/60 hover:text-green-300"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30"
                  >
                    Login
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label className="text-green-300 mb-2 block">Username</Label>
                    <Input
                      type="text"
                      placeholder="Choose a username"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-green-300 mb-2 block">Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-green-300 mb-2 block">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-green-400/60 hover:text-green-300"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-green-300 mb-2 block">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        className="bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-green-400/60 hover:text-green-300"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-green-500/30"
                  >
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-green-400/60 text-sm">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
              <p className="text-green-400/60 text-xs mt-2">
                Pay only for what you download • No subscriptions required
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────
  //  MAIN APP
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <AppHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className={`${isMenuCollapsed ? "w-16" : "w-64"} transition-all duration-300 flex-shrink-0`}>
            <Card className="sticky top-8">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  {!isMenuCollapsed && (
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      Burnt Beats
                    </h2>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}>
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>

                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeMenuItem === item.id

                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start ${isMenuCollapsed ? "px-2" : "px-3"}`}
                        onClick={() => setActiveMenuItem(item.id)}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {!isMenuCollapsed && (
                          <>
                            <span className="ml-2 truncate">{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </Button>
                    )
                  })}
                </nav>

                {!isMenuCollapsed && (
                  <div className="mt-6 p-3 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">🎵 Create amazing music with AI</p>
                    <Button size="sm" className="w-full">
                      Upgrade Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="space-y-6">
              {/* Content Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">
                    {menuItems.find((item) => item.id === activeMenuItem)?.label || "Burnt Beats"}
                  </h1>
                  <p className="text-muted-foreground">
                    {menuItems.find((item) => item.id === activeMenuItem)?.description ||
                      "AI-powered music creation platform"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {activeMenuItem.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Badge>
                </div>
              </div>

              {/* Dynamic Content */}
              <div className="min-h-[600px]">{currentContent}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
