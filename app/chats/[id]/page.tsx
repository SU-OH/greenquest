"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/lib/firebase/auth-context"
import { useChatFirestore } from "@/lib/firebase/firestore"
import { useMarketplaceFirestore } from "@/lib/firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDistanceToNow } from "date-fns"

export default function ChatPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const chatFirestore = useChatFirestore()
  const marketplaceFirestore = useMarketplaceFirestore()
  const [chat, setChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !id) return

    const fetchChat = async () => {
      try {
        const chatMessages = await chatFirestore.getChatMessages(id as string)
        setMessages(chatMessages)

        // Subscribe to new messages
        const unsubscribe = chatFirestore.subscribeToMessages(id as string, (newMessages) => {
          setMessages(newMessages)
          scrollToBottom()
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("Error fetching chat:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChat()
  }, [user, id, chatFirestore])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !id) return

    try {
      await chatFirestore.sendMessage(id as string, user.uid, newMessage.trim())
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader showBack title="Chat" />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user.uid ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.senderId === user.uid
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p>{message.message}</p>
              <p className="text-xs mt-1 opacity-70">
                {formatDistanceToNow(message.timestamp?.toDate() || new Date(), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSendMessage()
              }
            }}
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
