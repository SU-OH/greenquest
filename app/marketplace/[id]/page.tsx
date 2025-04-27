"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppHeader } from "@/components/app-header"
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { useMarketplaceFirestore } from "@/lib/firebase/firestore"

export default function ItemDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const marketplaceFirestore = useMarketplaceFirestore()
  const [item, setItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return

      try {
        // In a real app, you'd have a getListingById function
        const listings = await marketplaceFirestore.getListings()
        const foundItem = listings.find((listing: any) => listing.id === id)

        if (foundItem) {
          setItem(foundItem)
        } else {
          // Handle item not found
          console.error("Item not found")
        }
      } catch (error) {
        console.error("Error fetching item:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchItem()
  }, [id, marketplaceFirestore])

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  if (!item) {
    return (
      <div>
        <AppHeader showBack title="Item not found" />
        <div className="p-4 text-center">
          <p>This item could not be found or has been removed.</p>
          <Button className="mt-4" onClick={() => router.push("/marketplace")}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    )
  }

  // Format timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now"

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="pb-16">
      <AppHeader showBack />

      <div className="w-full aspect-square bg-gray-100">
        <img
          src={item.imageUrl || "/placeholder.svg?height=400&width=400&query=product"}
          alt={item.title}
          className="w-full h-full object-contain"
        />
      </div>

      <div className="p-4">
        <div className="flex items-center mb-4">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={item.sellerAvatar || ""} alt={item.sellerName} />
            <AvatarFallback>{item.sellerName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{item.sellerName}</p>
            <p className="text-sm text-gray-500">{item.school}</p>
          </div>
        </div>

        <h1 className="text-xl font-bold mb-2">{item.title}</h1>
        <p className="text-sm text-gray-500 mb-2">
          {item.condition} • Posted {formatDate(item.timestamp)}
        </p>
        <p className="text-2xl font-bold mb-4">${item.price}</p>

        <div className="border-t border-b border-gray-200 py-4 mb-4">
          <p className="text-gray-700 whitespace-pre-line">{item.description}</p>
        </div>

        <div className="text-sm text-gray-500 mb-6">
          <p>Meetup Location: {item.meetupLocation}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="rounded-full">
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full">
            <Share className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
          <Button className="flex-1 bg-green-600 hover:bg-green-700">
            <MessageCircle className="h-5 w-5 mr-2" /> Chat with Seller
          </Button>
        </div>
      </div>
    </div>
  )
}
