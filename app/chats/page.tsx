"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/lib/firebase/auth-context"

export default function ChatsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [authReady, setAuthReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [chats, setChats] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

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

  // Fetch chats data
  useEffect(() => {
    const fetchChats = async () => {
      if (!authReady || !user) return

      try {
        setIsLoading(true)

        // In a real app, you'd fetch this from Firestore
        // For now, we'll use mock data to avoid Firestore permission issues
        const mockChats = [
          {
            id: "1",
            name: "Kai Nakamura",
            avatar: "/diverse-group-city.png",
            lastMessage: "Is the textbook still available?",
            timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
            unread: 2,
          },
          {
            id: "2",
            name: "Leilani Wong",
            avatar: "/diverse-group-city.png",
            lastMessage: "I can meet tomorrow at the cafeteria",
            timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
            unread: 0,
          },
          {
            id: "3",
            name: "Noah Patel",
            avatar: "/diverse-group-city.png",
            lastMessage: "Thanks for the calculator! It works great.",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
            unread: 0,
          },
        ]

        setChats(mockChats)
      } catch (err) {
        console.error("Error fetching chats:", err)
        setError("Failed to load chats. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchChats()
  }, [user, authReady])

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
        <AppHeader title="Chats" />
        <div className="p-4 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  return (
    <div>
      <AppHeader title="Chats" showSearch />

      <div className="divide-y">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className="flex items-center p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => router.push(`/chats/${chat.id}`)}
          >
            <Avatar className="h-12 w-12 mr-3">
              <AvatarImage src={chat.avatar || "/placeholder.svg"} alt={chat.name} />
              <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h3 className="font-medium truncate">{chat.name}</h3>
                <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{formatTime(chat.timestamp)}</span>
              </div>
              <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
            </div>
            {chat.unread > 0 && (
              <div className="ml-2 bg-green-600 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                {chat.unread}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
