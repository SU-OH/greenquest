"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Leaf, Award, TrendingUp, Car, Utensils, Droplet, Lightbulb, ShoppingBag } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { ActivityTracker } from "@/components/activity-tracker"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [points, setPoints] = useState(0)
  const [level, setLevel] = useState(1)
  const [progress, setProgress] = useState(0)

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Simulate fetching user data
  useEffect(() => {
    if (user) {
      // This would be replaced with actual data from Firebase
      setPoints(275)
      setLevel(3)
      setProgress(65)
    }
  }, [user])

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
    <div className="container mx-auto px-4 py-24 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Your Environmental Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{points}</div>
            <p className="text-xs text-muted-foreground">+20 points this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {level}</div>
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {progress}% to Level {level + 1}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carbon Saved</CardTitle>
            <Leaf className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42 kg</div>
            <p className="text-xs text-muted-foreground">Equivalent to planting 2 trees</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="track" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="track">Track Activities</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        <TabsContent value="track" className="mt-6">
          <ActivityTracker />
        </TabsContent>
        <TabsContent value="achievements" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AchievementCard
              title="Eco Starter"
              description="Logged your first 5 eco-friendly activities"
              icon={<Leaf className="h-8 w-8 text-green-600" />}
              completed={true}
            />
            <AchievementCard
              title="Water Saver"
              description="Reduced water usage for 7 consecutive days"
              icon={<Droplet className="h-8 w-8 text-blue-600" />}
              completed={true}
            />
            <AchievementCard
              title="Energy Efficient"
              description="Reduced electricity usage by 10%"
              icon={<Lightbulb className="h-8 w-8 text-yellow-600" />}
              completed={false}
              progress={60}
            />
            <AchievementCard
              title="Green Commuter"
              description="Used eco-friendly transportation 10 times"
              icon={<Car className="h-8 w-8 text-green-600" />}
              completed={false}
              progress={40}
            />
            <AchievementCard
              title="Sustainable Eater"
              description="Chose plant-based meals 15 times"
              icon={<Utensils className="h-8 w-8 text-green-600" />}
              completed={false}
              progress={30}
            />
            <AchievementCard
              title="Reuse Champion"
              description="Sold or bought 5 items on GQX Marketplace"
              icon={<ShoppingBag className="h-8 w-8 text-green-600" />}
              completed={false}
              progress={20}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>School Leaderboard</CardTitle>
            <CardDescription>How your school compares to others</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge className="mr-2 bg-yellow-500">1</Badge>
                  <span>Kaimuki High School</span>
                </div>
                <span className="font-bold">12,450 pts</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge className="mr-2 bg-gray-400">2</Badge>
                  <span>Roosevelt High School</span>
                </div>
                <span className="font-bold">10,280 pts</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge className="mr-2 bg-amber-700">3</Badge>
                  <span>Kalani High School</span>
                </div>
                <span className="font-bold">9,875 pts</span>
              </div>
              <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                <div className="flex items-center">
                  <Badge className="mr-2">4</Badge>
                  <span className="font-medium">Your School</span>
                </div>
                <span className="font-bold">8,320 pts</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge className="mr-2">5</Badge>
                  <span>Moanalua High School</span>
                </div>
                <span className="font-bold">7,640 pts</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="/leaderboard">View Full Leaderboard</a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest environmental actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-2 rounded-full">
                  <Car className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Used public transportation</p>
                  <p className="text-sm text-muted-foreground">Today • +10 points</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Droplet className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Reduced water usage</p>
                  <p className="text-sm text-muted-foreground">Yesterday • +15 points</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">Used energy-efficient lighting</p>
                  <p className="text-sm text-muted-foreground">2 days ago • +5 points</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-2 rounded-full">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Sold textbook on GQX Marketplace</p>
                  <p className="text-sm text-muted-foreground">3 days ago • +20 points</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="/activity">View All Activity</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

function AchievementCard({
  title,
  description,
  icon,
  completed,
  progress = 100,
}: {
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  progress?: number
}) {
  return (
    <Card className={completed ? "border-green-500" : ""}>
      <CardHeader className="flex flex-row items-start gap-4 pb-2">
        <div className="mt-1">{icon}</div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {completed ? (
          <Badge className="bg-green-600">Completed</Badge>
        ) : (
          <div>
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">{progress}% complete</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
