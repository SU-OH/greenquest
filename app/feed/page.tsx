"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { AppHeader } from "@/components/app-header"
import { Heart, MessageCircle, Share2, ImageIcon } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { usePostsFirestore } from "@/lib/firebase/firestore"
import { useUserFirestore } from "@/lib/firebase/firestore"
import { ImageUpload } from "@/components/image-upload"
import { toast } from "@/components/ui/use-toast"

export default function FeedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const postsFirestore = usePostsFirestore()
  const userFirestore = useUserFirestore()
  const [postContent, setPostContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showPostForm, setShowPostForm] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Fetch user profile and posts
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          // Get user profile
          const profile = await userFirestore.getUserProfile(user.uid)
          setUserProfile(profile)

          // Get all posts
          const allPosts = await postsFirestore.getPosts()
          setPosts(allPosts)
        } catch (error) {
          console.error("Error fetching data:", error)
        }
      }
    }

    fetchData()
  }, [user, postsFirestore, userFirestore])

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

  const handlePostSubmit = async () => {
    if (!postContent.trim() && !imageUrl) {
      toast({
        title: "Cannot submit empty post",
        description: "Please add some text or an image to your post.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create the post in Firestore
      await postsFirestore.createPost(user.uid, {
        content: postContent,
        imageUrl: imageUrl,
        school: userProfile?.school || "",
        userName: user.displayName || "Anonymous",
        userAvatar: user.photoURL || "",
      })

      // Award points for posting
      await userFirestore.updateUserPoints(user.uid, 5)

      // Reset the form
      setPostContent("")
      setImageUrl("")
      setShowImageUpload(false)
      setShowPostForm(false)

      // Refresh posts
      const allPosts = await postsFirestore.getPosts()
      setPosts(allPosts)

      toast({
        title: "Post created successfully!",
        description: "Your post has been shared with the community.",
      })
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error creating post",
        description: "There was a problem sharing your post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUploaded = (url: string) => {
    setImageUrl(url)
  }

  return (
    <div>
      <AppHeader title="GreenQuest" showNotification />

      {showPostForm ? (
        <div className="p-4">
          <Card className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <Avatar>
                <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                <AvatarFallback className="bg-green-200 text-green-800">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="Share your environmental achievements..."
                className="flex-1"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={3}
              />
            </div>

            {showImageUpload && user && (
              <div className="mb-3">
                <ImageUpload onImageUploaded={handleImageUploaded} userId={user.uid} type="post" />
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setShowImageUpload(!showImageUpload)}>
                <ImageIcon className="h-4 w-4 mr-1" /> Add Photo
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPostForm(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePostSubmit}
                  disabled={isSubmitting || (!postContent.trim() && !imageUrl)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="p-4">
          <Button
            className="w-full flex items-center justify-start gap-3 h-12 mb-4"
            variant="outline"
            onClick={() => setShowPostForm(true)}
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
              <AvatarFallback className="bg-green-200 text-green-800 text-xs">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-gray-500">Share your environmental achievements...</span>
          </Button>
        </div>
      )}

      <div className="space-y-4 px-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <FeedPostCard key={post.id} post={post} currentUser={user} postsFirestore={postsFirestore} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function FeedPostCard({ post, currentUser, postsFirestore }: { post: any; currentUser: any; postsFirestore: any }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes || 0)

  const handleLike = async () => {
    if (liked) {
      setLikeCount(likeCount - 1)
    } else {
      setLikeCount(likeCount + 1)

      // Update like count in Firestore
      try {
        await postsFirestore.likePost(post.id, currentUser.uid)
      } catch (error) {
        console.error("Error liking post:", error)
        // Revert UI state if the API call fails
        setLikeCount(likeCount)
        setLiked(liked)
        return
      }
    }
    setLiked(!liked)
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

  return (
    <Card className="overflow-hidden mb-4">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar>
            <AvatarImage src={post.userAvatar || "/placeholder.svg"} alt={post.userName} />
            <AvatarFallback>{post.userName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{post.userName}</div>
            <div className="text-xs text-gray-500">
              {formatTimeAgo(post.timestamp)} • {post.school}
            </div>
          </div>
        </div>

        <p className="mb-3">{post.content}</p>

        {post.imageUrl && (
          <div className="rounded-md overflow-hidden mb-3">
            <img src={post.imageUrl || "/placeholder.svg"} alt="Post content" className="w-full h-auto" />
          </div>
        )}

        <div className="flex justify-between text-sm text-gray-500 pt-2 border-t">
          <Button variant="ghost" size="sm" className={`${liked ? "text-red-500" : ""}`} onClick={handleLike}>
            <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} /> {likeCount}
          </Button>
          <Button variant="ghost" size="sm">
            <MessageCircle className="h-4 w-4 mr-1" /> {post.comments || 0}
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
        </div>
      </div>
    </Card>
  )
}
