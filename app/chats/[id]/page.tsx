"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppHeader } from "@/components/app-header"
import { Send, ImageIcon, Paperclip } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"

export default function ChatDetailPage() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [authReady, setAuthReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [chat, setChat] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Track when auth is fully ready
  useEffect(() => {
    if (!loading) {
      setAuthReady(true)
    }
  }, [loading])

  // Redirect if not logged in
  useEffect(() => {
    if (authReady && !user) {
      router.push("/login")
    }
  }, [user, authReady, router])

  // Fetch chat data
  useEffect(() => {
    const fetchChatData = async () => {
      if (!authReady || !user || !id) return

      try {
        setIsLoading(true)

        // In a real app, you'd fetch this from Firestore
        // For now, we'll use mock data to avoid Firestore permission issues
        const mockChat = {
          id: id as string,
          name: "Kai Nakamura",
          avatar: "/diverse-group-city.png",
          messages: [
            {
              id: "1",
              sender: "other",
              text: "Hi there! I saw your listing for the Biology textbook. Is it still available?",
              timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
            },
            {
              id: "2",
              sender: "me",
              text: "Yes, it's still available! Are you interested?",
              timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            },
            {
              id: "3",
              sender: "other",
              text: "Great! I'd like to buy it. When can we meet?",
              timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
            },
            {
              id: "4",
              sender: "other",
              text: "Is the textbook still available?",
              timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
            },
          ],
        }

        setChat(mockChat)
      } catch (err) {
        console.error("Error fetching chat data:", err)
        setError("Failed to load chat. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchChatData()
  }, [id, user, authReady])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!isLoading && chat) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [isLoading, chat])

  if (loading || (authReady && user && isLoading)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  if (error) {
    return (
      <div>
        <AppHeader showBack title="Error" />
        <div className="p-4 text-center">
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={() => router.push("/chats")}>
            Back to Chats
          </Button>
        </div>
      </div>
    )
  }

  if (!chat) {
    return (
      <div>
        <AppHeader showBack title="Chat not found" />
        <div className="p-4 text-center">
          <p>This chat could not be found or has been deleted.</p>
          <Button className="mt-4" onClick={() => router.push("/chats")}>
            Back to Chats
          </Button>
        </div>
      </div>
    )
  }

  const handleSendMessage = () => {
    if (!message.trim()) return
    // In a real app, you'd send the message to Firestore here
    console.log("Sending message:", message)
    setMessage("")
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader showBack title={chat.name} />

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-3">
          {chat.messages.map((msg: any) => (
            <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
              {msg.sender !== "me" && (
                <Avatar className="h-8 w-8 mr-2 mt-1">
                  <AvatarImage src={chat.avatar || "/placeholder.svg"} alt={chat.name} />
                  <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[75%] rounded-lg px-4 py-2 ${
                  msg.sender === "me" ? "bg-green-600 text-white" : "bg-white border border-gray-200"
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === "me" ? "text-green-100" : "text-gray-500"}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-2 border-t bg-white">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <Button
            size="icon"
            className="bg-green-600 hover:bg-green-700"
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
