"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchConversations = async () => {
      if (!auth.currentUser) return

      try {
        setLoading(true)
        const userId = auth.currentUser.uid

        // orderBy 없이 쿼리 실행 (인덱스 필요 없음)
        const conversationsQuery = query(
          collection(db, "conversations"),
          where("participants", "array-contains", userId),
        )

        const querySnapshot = await getDocs(conversationsQuery)

        // JavaScript에서 데이터 정렬
        const conversationsData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            // lastMessageAt이 없는 경우 기본값 설정
            const dateA = a.lastMessageAt?.toDate?.() || new Date(0)
            const dateB = b.lastMessageAt?.toDate?.() || new Date(0)
            return dateB.getTime() - dateA.getTime() // 내림차순 정렬
          })

        setConversations(conversationsData)
      } catch (error) {
        console.error("Error fetching conversations:", error)
        setConversations([])
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  const filteredConversations = conversations.filter((conversation) =>
    conversation.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-green-800">Messages</h1>
        <p className="text-sm text-muted-foreground">Connect with other environmentally conscious students</p>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-4 space-y-2">
          {loading ? (
            Array(5)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="cursor-pointer hover:bg-gray-50">
                  <CardContent className="flex items-center gap-3 p-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="mt-1 h-3 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <Card key={conversation.id} className="cursor-pointer hover:bg-gray-50">
                <CardContent className="flex items-center gap-3 p-3">
                  <Avatar>
                    <AvatarImage src={conversation.otherUserImage || "/placeholder.svg"} />
                    <AvatarFallback>{conversation.otherUserName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{conversation.otherUserName}</h3>
                      <span className="text-xs text-muted-foreground">
                        {conversation.lastMessageAt?.toDate?.()
                          ? new Date(conversation.lastMessageAt.toDate()).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{conversation.lastMessage}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="mb-2 text-lg font-medium">No messages yet</h3>
              <p className="text-muted-foreground">Start a conversation with someone from your school!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h3 className="mb-2 text-lg font-medium">No message requests</h3>
            <p className="text-muted-foreground">When someone new messages you, it will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
