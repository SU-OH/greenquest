"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/lib/firebase/auth-context"
import { useChatFirestore } from "@/lib/firebase/firestore"
import { useMarketplaceFirestore } from "@/lib/firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

export default function ChatsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const chatFirestore = useChatFirestore()
  const marketplaceFirestore = useMarketplaceFirestore()
  const [chats, setChats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchChats = async () => {
      try {
        const userChats = await chatFirestore.getUserChats(user.uid)
        const chatsWithDetails = await Promise.all(
          userChats.map(async (chat) => {
            const listing = await marketplaceFirestore.getListingById(chat.listingId)
            const otherParticipant = chat.participants.find((id: string) => id !== user.uid)
            return {
              ...chat,
              listing,
              otherParticipant,
            }
          })
        )
        setChats(chatsWithDetails)
      } catch (error) {
        console.error("Error fetching chats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChats()
  }, [user, chatFirestore, marketplaceFirestore])

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
    <div>
      <AppHeader title="Chats" />

      <div className="p-4">
        {chats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No chats yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/chats/${chat.id}`)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chat.listing?.sellerAvatar} alt={chat.listing?.sellerName} />
                  <AvatarFallback>{chat.listing?.sellerName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{chat.listing?.sellerName}</h3>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(chat.lastMessageTime?.toDate() || new Date(), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">{chat.lastMessage}</p>
                  <p className="text-xs text-gray-400 mt-1">{chat.listing?.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
