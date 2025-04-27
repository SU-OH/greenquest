"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/lib/firebase/auth-context"
import { useMarketplaceFirestore } from "@/lib/firebase/firestore"
import { useUserFirestore } from "@/lib/firebase/firestore"
import { Heart } from "lucide-react"

export default function MarketplacePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const marketplaceFirestore = useMarketplaceFirestore()
  const userFirestore = useUserFirestore()
  const [searchQuery, setSearchQuery] = useState("")
  const [listings, setListings] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Fetch listings and user profile
  useEffect(() => {
    const fetchData = async () => {
      if (user && !loading) {
        try {
          // Get user profile
          const profile = await userFirestore.getUserProfile(user.uid)
          setUserProfile(profile)

          // Get all listings
          const allListings = await marketplaceFirestore.getListings()
          setListings(allListings)
        } catch (error) {
          console.error("Error fetching marketplace data:", error)
          // Don't let the error crash the app, just show empty listings
          setListings([])
        }
      }
    }

    fetchData()
  }, [user, loading, marketplaceFirestore, userFirestore])

  // Filter listings based on search query
  const filteredListings = listings.filter((listing) => {
    return (
      searchQuery === "" ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="pb-4">
      <AppHeader title="Marketplace" showSearch showNotification onSearch={handleSearch} />

      <div className="px-4 pt-4">
        <div className="flex overflow-x-auto pb-2 gap-2 mb-4 no-scrollbar">
          <Badge variant="outline" className="whitespace-nowrap px-3 py-1 text-sm">
            All Items
          </Badge>
          <Badge variant="outline" className="whitespace-nowrap px-3 py-1 text-sm">
            Textbooks
          </Badge>
          <Badge variant="outline" className="whitespace-nowrap px-3 py-1 text-sm">
            School Supplies
          </Badge>
          <Badge variant="outline" className="whitespace-nowrap px-3 py-1 text-sm">
            Electronics
          </Badge>
          <Badge variant="outline" className="whitespace-nowrap px-3 py-1 text-sm">
            Clothing
          </Badge>
          <Badge variant="outline" className="whitespace-nowrap px-3 py-1 text-sm">
            Sports
          </Badge>
        </div>

        {filteredListings.length > 0 ? (
          <div className="space-y-4">
            {filteredListings.map((item) => (
              <MarketplaceItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MarketplaceItem({ item }: { item: any }) {
  const router = useRouter()
  const marketplaceFirestore = useMarketplaceFirestore()
  const [likes, setLikes] = useState(item.likes || 0)
  const [chatCount, setChatCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const chatCount = await marketplaceFirestore.getListingChatCount(item.id)
        setChatCount(chatCount)
      } catch (error) {
        console.error("Error fetching counts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCounts()
  }, [item.id, marketplaceFirestore])

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const newLikes = await marketplaceFirestore.likeListing(item.id, item.userId)
      if (newLikes !== null) {
        setLikes(newLikes)
      }
    } catch (error) {
      console.error("Error liking item:", error)
    }
  }

  // Format timestamp
  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Just now"

    const now = new Date()
    const postTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const diffMs = now.getTime() - postTime.getTime()

    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`
    } else if (diffHours > 0) {
      return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`
    } else if (diffMins > 0) {
      return diffMins === 1 ? "1 minute ago" : `${diffMins} minutes ago`
    } else {
      return "Just now"
    }
  }

  const handleClick = () => {
    router.push(`/marketplace/${item.id}`)
  }

  return (
    <div className="flex border-b border-gray-200 pb-4 cursor-pointer" onClick={handleClick}>
      <div className="h-24 w-24 rounded-md overflow-hidden mr-4 flex-shrink-0 bg-gray-100">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg?height=96&width=96&query=product"
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <img
              src="/placeholder.svg?height=96&width=96&query=product"
              alt="Placeholder"
              className="h-12 w-12 opacity-50"
            />
          </div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-medium line-clamp-1">{item.title}</h3>
        <p className="text-sm text-gray-500 mb-1">
          {item.school} · {formatTimeAgo(item.timestamp)}
        </p>
        <p className="font-bold text-lg">${item.price}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">{item.condition}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
            >
              <Heart className="h-3 w-3" /> {likes}
            </button>
            <span className="text-xs text-gray-500">Chat {chatCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
