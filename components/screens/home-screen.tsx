"use client"

import { useState, useEffect } from "react"
import { collection, query, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, MessageSquare, Award } from "lucide-react"
import ActivityTracker from "@/components/home/activity-tracker"
import { Skeleton } from "@/components/ui/skeleton"

export default function HomeScreen() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userPoints, setUserPoints] = useState(0)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // orderBy 없이 쿼리 실행 (인덱스 필요 없음)
        const postsQuery = query(collection(db, "posts"))

        const querySnapshot = await getDocs(postsQuery)
        const postsData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          // JavaScript에서 데이터 정렬
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0)
            const dateB = b.createdAt?.toDate?.() || new Date(0)
            return dateB.getTime() - dateA.getTime() // 내림차순 정렬
          })
          // 상위 10개만 선택
          .slice(0, 10)

        setPosts(postsData)
      } catch (error) {
        console.error("Error fetching posts:", error)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Your Environmental Impact</CardTitle>
          <CardDescription>Track your daily activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Your Points</h3>
              <p className="text-3xl font-bold text-green-600">{userPoints}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <ActivityTracker setUserPoints={setUserPoints} />
        </CardContent>
        <CardFooter>
          <Button className="w-full bg-green-600 hover:bg-green-700">Log New Activity</Button>
        </CardFooter>
      </Card>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feed">Community Feed</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-4 space-y-4">
          {loading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-40 w-full rounded-md" />
                  </CardContent>
                  <CardFooter>
                    <div className="flex w-full justify-between">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardFooter>
                </Card>
              ))
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.userImage || "/placeholder.svg"} />
                      <AvatarFallback>{post.userName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{post.userName}</h3>
                      <p className="text-xs text-muted-foreground">{post.school}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="mb-3">{post.content}</p>
                  {post.imageUrl && (
                    <div className="relative aspect-video overflow-hidden rounded-md">
                      <img
                        src={post.imageUrl || "/placeholder.svg"}
                        alt="Post image"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                      +{post.pointsEarned || 5} points
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {post.createdAt?.toDate?.() ? new Date(post.createdAt.toDate()).toLocaleDateString() : ""}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex w-full justify-between">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{post.likes || 0}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.comments?.length || 0}</span>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="mb-2 text-lg font-medium">No posts yet</h3>
              <p className="text-muted-foreground">Be the first to share your environmental activities!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="challenges" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Challenges</CardTitle>
              <CardDescription>Complete challenges to earn extra points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-green-50 p-4">
                <h3 className="mb-1 font-medium text-green-800">Beach Cleanup Challenge</h3>
                <p className="mb-2 text-sm text-green-700">Collect trash at your local beach and share a photo</p>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-green-700">+50 points</span>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Join
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border bg-amber-50 p-4">
                <h3 className="mb-1 font-medium text-amber-800">Zero Waste Week</h3>
                <p className="mb-2 text-sm text-amber-700">Reduce your waste to zero for one week</p>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-amber-700">+75 points</span>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                    Join
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border bg-blue-50 p-4">
                <h3 className="mb-1 font-medium text-blue-800">Water Conservation</h3>
                <p className="mb-2 text-sm text-blue-700">Track and reduce your water usage for 5 days</p>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-blue-700">+60 points</span>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Join
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
