"use client"

import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Camera, Edit, LogOut } from "lucide-react"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!auth.currentUser) return

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))

        if (userDoc.exists()) {
          setUser(userDoc.data())
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const BADGES = [
    { id: "eco_warrior", name: "Eco Warrior", description: "Completed 10 environmental activities", icon: "🌱" },
    {
      id: "recycling_master",
      name: "Recycling Master",
      description: "Recycled materials for 7 consecutive days",
      icon: "♻️",
    },
    { id: "energy_saver", name: "Energy Saver", description: "Reduced energy consumption for 5 days", icon: "💡" },
    { id: "marketplace_pro", name: "Marketplace Pro", description: "Sold 5 items on GQX", icon: "🛍️" },
    { id: "water_guardian", name: "Water Guardian", description: "Saved 100 gallons of water", icon: "💧" },
  ]

  return (
    <div className="container mx-auto p-4">
      {loading ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="mt-4 h-6 w-40" />
            <Skeleton className="mt-2 h-4 w-60" />
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.profileImage || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl">{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 rounded-full bg-green-600 p-2 text-white shadow-md">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h1 className="mt-4 text-xl font-bold">{user?.name}</h1>
            <p className="text-muted-foreground">{user?.school}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                {user?.points || 0} points
              </span>
            </div>
            <Button variant="outline" className="mt-4 gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>

          <Tabs defaultValue="badges" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="badges" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Badges</CardTitle>
                  <CardDescription>Achievements you've earned on your green journey</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {BADGES.map((badge) => {
                    const earned = user?.badges?.includes(badge.id)
                    return (
                      <div
                        key={badge.id}
                        className={`rounded-lg border p-3 ${
                          earned ? "border-green-200 bg-green-50" : "border-dashed opacity-50"
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                            <span className="text-lg">{badge.icon}</span>
                          </div>
                          <h3 className="font-medium">{badge.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Your environmental contributions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <Award className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-medium">No activities recorded yet</h3>
                    <p className="mb-4 text-muted-foreground">Start logging your daily environmental activities!</p>
                    <Button className="bg-green-600 hover:bg-green-700">Log Activity</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Notification Preferences</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Email notifications</span>
                      <div className="flex h-6 w-11 cursor-pointer items-center rounded-full bg-green-600 px-1">
                        <div className="h-4 w-4 rounded-full bg-white"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Push notifications</span>
                      <div className="flex h-6 w-11 cursor-pointer items-center rounded-full bg-green-600 px-1">
                        <div className="h-4 w-4 translate-x-5 rounded-full bg-white"></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Privacy</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Show my school on profile</span>
                      <div className="flex h-6 w-11 cursor-pointer items-center rounded-full bg-green-600 px-1">
                        <div className="h-4 w-4 translate-x-5 rounded-full bg-white"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Allow message requests</span>
                      <div className="flex h-6 w-11 cursor-pointer items-center rounded-full bg-green-600 px-1">
                        <div className="h-4 w-4 translate-x-5 rounded-full bg-white"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSignOut} variant="destructive" className="w-full gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
