"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, MessageCircle, Share2, Video, Mic, MicOff, VideoOff, Crown } from "lucide-react"

interface Collaborator {
  id: string
  name: string
  avatar: string
  role: "owner" | "editor" | "viewer"
  isOnline: boolean
  cursor?: { x: number; y: number }
  selection?: { start: number; end: number }
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  message: string
  timestamp: number
  type: "text" | "system" | "audio_comment"
  audioTimestamp?: number
}

export function CollaborationStudio({ songId }: { songId: string }) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: "1",
      name: "Fire Producer",
      avatar: "/avatars/producer.jpg",
      role: "owner",
      isOnline: true,
    },
    {
      id: "2",
      name: "Beat Master",
      avatar: "/avatars/beatmaster.jpg",
      role: "editor",
      isOnline: true,
    },
    {
      id: "3",
      name: "Vocal Artist",
      avatar: "/avatars/vocalist.jpg",
      role: "viewer",
      isOnline: false,
    },
  ])

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      userId: "1",
      userName: "Fire Producer",
      message: "Let's work on the chorus at 1:30",
      timestamp: Date.now() - 300000,
      type: "text",
      audioTimestamp: 90,
    },
    {
      id: "2",
      userId: "2",
      userName: "Beat Master",
      message: "The bass needs more punch in that section",
      timestamp: Date.now() - 120000,
      type: "text",
    },
  ])

  const [newMessage, setNewMessage] = useState("")
  const [isVideoCallActive, setIsVideoCallActive] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(true)
  const [isCameraOff, setIsCameraOff] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: "current-user",
      userName: "You",
      message: newMessage,
      timestamp: Date.now(),
      type: "text",
    }

    setChatMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  const inviteCollaborator = (email: string, role: "editor" | "viewer") => {
    // TODO: Send invitation
    console.log(`Inviting ${email} as ${role}`)
  }

  const toggleVideoCall = () => {
    setIsVideoCallActive(!isVideoCallActive)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-3 h-3 text-yellow-400" />
      case "editor":
        return <Users className="w-3 h-3 text-green-400" />
      default:
        return <Users className="w-3 h-3 text-gray-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "border-yellow-400 text-yellow-400"
      case "editor":
        return "border-green-400 text-green-400"
      default:
        return "border-gray-400 text-gray-400"
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Collaboration Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Active Collaborators */}
        <Card className="bg-black/80 border-green-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-300 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Active Collaborators ({collaborators.filter((c) => c.isOnline).length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleVideoCall}
                  className={`${
                    isVideoCallActive
                      ? "bg-green-500 text-white border-green-500"
                      : "border-green-500/30 text-green-300"
                  }`}
                >
                  <Video className="w-4 h-4 mr-1" />
                  {isVideoCallActive ? "End Call" : "Start Call"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteModal(true)}
                  className="border-green-500/30 text-green-300"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Invite
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={collaborator.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{collaborator.name[0]}</AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
                        collaborator.isOnline ? "bg-green-400" : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-green-100 text-sm font-medium">{collaborator.name}</span>
                      {getRoleIcon(collaborator.role)}
                    </div>
                    <Badge variant="outline" className={`text-xs ${getRoleColor(collaborator.role)}`}>
                      {collaborator.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Video Call Interface */}
        {isVideoCallActive && (
          <Card className="bg-black/80 border-green-500/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {collaborators
                  .filter((c) => c.isOnline)
                  .map((collaborator) => (
                    <div key={collaborator.id} className="relative bg-black/60 rounded-lg aspect-video">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={collaborator.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-2xl">{collaborator.name[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/80 rounded px-2 py-1">
                        <span className="text-white text-xs">{collaborator.name}</span>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`${
                    isMicMuted ? "bg-red-500 text-white border-red-500" : "border-green-500/30 text-green-300"
                  }`}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCameraOff(!isCameraOff)}
                  className={`${
                    isCameraOff ? "bg-red-500 text-white border-red-500" : "border-green-500/30 text-green-300"
                  }`}
                >
                  {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chat Panel */}
      <div className="lg:col-span-1">
        <Card className="bg-black/80 border-green-500/30 h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-green-300 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Project Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-4">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {chatMessages.map((message) => (
                <div key={message.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-green-300 text-sm font-medium">{message.userName}</span>
                    <span className="text-gray-400 text-xs">{new Date(message.timestamp).toLocaleTimeString()}</span>
                    {message.audioTimestamp && (
                      <Badge variant="outline" className="text-xs border-blue-400 text-blue-400">
                        @{Math.floor(message.audioTimestamp / 60)}:
                        {(message.audioTimestamp % 60).toString().padStart(2, "0")}
                      </Badge>
                    )}
                  </div>
                  <div className="text-gray-100 text-sm bg-black/40 rounded-lg p-2">{message.message}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="bg-black/40 border-green-500/30 text-green-100"
              />
              <Button onClick={sendMessage} size="sm" className="bg-green-500 hover:bg-green-600">
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
