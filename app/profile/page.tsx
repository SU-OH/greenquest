"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppHeader } from "@/components/app-header"
import { Settings, LogOut, Award, ShoppingBag, Leaf, Activity } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { useUserFirestore } from "@/lib/firebase/firestore"
import { usePostsFirestore } from "@/lib/firebase/firestore"
import { useMarketplaceFirestore } from "@/lib/firebase/firestore"
import { useActivityFirestore } from "@/lib/firebase/firestore"
import { ProfileEditDialog } from "@/components/profile-edit-dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const userFirestore = useUserFirestore()
  const postsFirestore = usePostsFirestore()
  const marketplaceFirestore = useMarketplaceFirestore()
  const activityFirestore = useActivityFirestore()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [userListings, setUserListings] = useState<any[]>([])
  const [userActivities, setUserActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)

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

  // Fetch user data only when auth is ready and user exists
  useEffect(() => {
    const fetchData = async () => {
      if (!authReady || !user) return

      try {
        setIsLoading(true)

        // Default profile data
        const defaultProfile = {
          points: 0,
          level: 1,
          carbonSaved: 0,
          school: "Not specified",
        }

        // Get user profile with fallback
        let profile = defaultProfile
        try {
          const fetchedProfile = await userFirestore.getUserProfile(user.uid)
          if (fetchedProfile) {
            profile = fetchedProfile
          } else {
            // If profile doesn't exist, create a basic one
            try {
              await userFirestore.createUserProfile(user.uid, {
                displayName: user.displayName || "User",
                email: user.email || "",
                photoURL: user.photoURL || "",
                school: "Not specified",
              })
            } catch (createError) {
              console.error("Error creating user profile:", createError)
            }
          }
        } catch (profileError) {
          console.error("Error fetching user profile:", profileError)
        }
        setUserProfile(profile)

        // Get user posts with empty fallback
        try {
          const posts = await postsFirestore.getUserPosts(user.uid)
          setUserPosts(posts)
        } catch (postsError) {
          console.error("Error fetching user posts:", postsError)
          setUserPosts([])
        }

        // Get user listings with empty fallback
        try {
          const listings = await marketplaceFirestore.getUserListings(user.uid)
          setUserListings(listings)
        } catch (listingsError) {
          console.error("Error fetching user listings:", listingsError)
          setUserListings([])
        }

        // Get user activities
        try {
          const activities = await activityFirestore.getUserActivities(user.uid)
          setUserActivities(activities)
        } catch (activitiesError) {
          console.error("Error fetching user activities:", activitiesError)
          setUserActivities([])
        }
      } catch (error) {
        console.error("Error in profile data fetching:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, authReady, userFirestore, postsFirestore, marketplaceFirestore, activityFirestore])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Show loading state
  if (loading || (authReady && user && isLoading)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  // Will redirect in useEffect if not logged in
  if (!user) {
    return null
  }

  return (
    <div>
      <AppHeader title="Profile" />

      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Avatar className="h-16 w-16 mr-4">
              <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
              <AvatarFallback className="bg-green-200 text-green-800 text-xl">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user.displayName || "User"}</h2>
              <p className="text-gray-500">{userProfile?.school || "School not set"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ProfileEditDialog />
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-700">{userProfile?.points || 0}</p>
            <p className="text-xs text-gray-500">Points</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-700">{userProfile?.level || 1}</p>
            <p className="text-xs text-gray-500">Level</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-700">{userProfile?.carbonSaved || 0}</p>
            <p className="text-xs text-gray-500">CO2 Saved</p>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <span>My Achievements</span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                </div>
                <span>My Listings</span>
              </div>
              <Badge variant="secondary">{userListings.length} items</Badge>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <span>Recent Activities</span>
              </div>
              <Badge variant="secondary">{userActivities.length} activities</Badge>
            </div>
            {userActivities.length > 0 && (
              <div className="mt-4 space-y-2">
                {userActivities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="text-sm text-gray-600">
                    <p>{activity.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.timestamp?.toDate?.() || activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Recent Posts</h3>
          {userPosts.length > 0 ? (
            <div className="space-y-4">
              {userPosts.slice(0, 2).map((post) => (
                <Card key={post.id} className="p-4">
                  <p className="line-clamp-2">{post.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(post.timestamp?.toDate?.() || post.timestamp).toLocaleDateString()}
                  </p>
                </Card>
              ))}
              {userPosts.length > 2 && (
                <Button variant="outline" className="w-full">
                  View All Posts
                </Button>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No posts yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
