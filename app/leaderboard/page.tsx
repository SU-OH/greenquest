"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Award, Trophy, Users, School, User } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"

export default function LeaderboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

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

  // Mock data for leaderboards
  const schoolLeaderboard = [
    { rank: 1, name: "Kaimuki High School", points: 12450, students: 156, change: "up" },
    { rank: 2, name: "Roosevelt High School", points: 10280, students: 142, change: "up" },
    { rank: 3, name: "Kalani High School", points: 9875, students: 128, change: "down" },
    { rank: 4, name: "Your School", points: 8320, students: 110, change: "same" },
    { rank: 5, name: "Moanalua High School", points: 7640, students: 98, change: "up" },
    { rank: 6, name: "McKinley High School", points: 6980, students: 87, change: "down" },
    { rank: 7, name: "Farrington High School", points: 6540, students: 76, change: "up" },
    { rank: 8, name: "Kaiser High School", points: 5890, students: 65, change: "down" },
    { rank: 9, name: "Aiea High School", points: 5230, students: 58, change: "same" },
    { rank: 10, name: "Campbell High School", points: 4780, students: 52, change: "up" },
  ]

  const userLeaderboard = [
    {
      rank: 1,
      name: "Leilani Wong",
      school: "Kaimuki High School",
      points: 1250,
      avatar: "/placeholder.svg?height=40&width=40&query=person",
    },
    {
      rank: 2,
      name: "Kai Nakamura",
      school: "Roosevelt High School",
      points: 1180,
      avatar: "/placeholder.svg?height=40&width=40&query=person",
    },
    {
      rank: 3,
      name: "Noah Patel",
      school: "Kalani High School",
      points: 1050,
      avatar: "/placeholder.svg?height=40&width=40&query=person",
    },
    {
      rank: 4,
      name: "Emma Chen",
      school: "Roosevelt High School",
      points: 980,
      avatar: "/placeholder.svg?height=40&width=40&query=person",
    },
    {
      rank: 5,
      name: "Kekoa Silva",
      school: "Moanalua High School",
      points: 920,
      avatar: "/placeholder.svg?height=40&width=40&query=person",
    },
    {
      rank: 6,
      name: "Malia Johnson",
      school: "Kaimuki High School",
      points: 870,
      avatar: "/placeholder.svg?height=40&width=40&query=person",
    },
    {
      rank: 7,
      name: "You",
      school: "Your School",
      points: 820,
      avatar: user.photoURL || "/placeholder.svg?height=40&width=40&query=person",
    },
    {
      rank: 8,
      name: "Aiden Lee",
      school: "McKinley High School",
      points: 780,
      avatar: "/placeholder.svg?height=40&width=40&query=person",
    },
    {
      rank: 9,
      name: "Sophia Kim",
      school: "Kalani High School",
      points: 750,
      avatar: "/placeholder.svg?height=40&width=40&query=person",
    },
    {
      rank: 10,
      name: "Lucas Nguyen",
      school: "Farrington High School",
      points: 720,
      avatar: "/placeholder.svg?height=40&width=40&query=person",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="flex items-center mb-8">
        <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
        <div>
          <h1 className="text-3xl font-bold">Leaderboards</h1>
          <p className="text-muted-foreground">See how you and your school rank in environmental impact</p>
        </div>
      </div>

      <Tabs defaultValue="schools">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="schools" className="flex items-center gap-2">
            <School className="h-4 w-4" /> Schools
          </TabsTrigger>
          <TabsTrigger value="individuals" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Individuals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schools">
          <Card>
            <CardHeader>
              <CardTitle>School Rankings</CardTitle>
              <CardDescription>Based on total environmental impact points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schoolLeaderboard.map((school) => (
                  <SchoolLeaderboardItem key={school.rank} school={school} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individuals">
          <Card>
            <CardHeader>
              <CardTitle>Individual Rankings</CardTitle>
              <CardDescription>Top environmentally conscious students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userLeaderboard.map((user) => (
                  <UserLeaderboardItem key={user.rank} user={user} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 text-green-600 mr-2" />
              Monthly Challenge
            </CardTitle>
            <CardDescription>April 2025: Reduce, Reuse, Recycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Challenge Details:</h3>
              <p className="mb-4">
                Track your waste reduction activities and earn bonus points! The school with the most recycling and
                reuse activities this month will win a $500 sustainability grant.
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Current Leader:</p>
                  <p>Kaimuki High School</p>
                </div>
                <div>
                  <p className="font-medium">Time Remaining:</p>
                  <p>12 days</p>
                </div>
                <div>
                  <p className="font-medium">Your School Rank:</p>
                  <p>4th Place</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SchoolLeaderboardItem({ school }: { school: any }) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        school.name === "Your School" ? "bg-green-50" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <RankBadge rank={school.rank} />
        <div>
          <p className="font-medium">{school.name}</p>
          <p className="text-sm text-muted-foreground flex items-center">
            <Users className="h-3 w-3 mr-1" /> {school.students} students participating
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold">{school.points.toLocaleString()} pts</p>
        <p
          className={`text-xs flex items-center justify-end ${
            school.change === "up" ? "text-green-600" : school.change === "down" ? "text-red-600" : "text-gray-500"
          }`}
        >
          {school.change === "up" && "↑"}
          {school.change === "down" && "↓"}
          {school.change === "same" && "–"} {school.change === "up" && "Trending up"}
          {school.change === "down" && "Trending down"}
          {school.change === "same" && "No change"}
        </p>
      </div>
    </div>
  )
}

function UserLeaderboardItem({ user }: { user: any }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${user.name === "You" ? "bg-green-50" : ""}`}>
      <div className="flex items-center gap-4">
        <RankBadge rank={user.rank} />
        <Avatar>
          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.school}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold">{user.points.toLocaleString()} pts</p>
      </div>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  let badgeClass = "w-8 h-8 flex items-center justify-center rounded-full text-white font-bold"

  if (rank === 1) {
    badgeClass += " bg-yellow-500"
  } else if (rank === 2) {
    badgeClass += " bg-gray-400"
  } else if (rank === 3) {
    badgeClass += " bg-amber-700"
  } else {
    badgeClass += " bg-green-600"
  }

  return <div className={badgeClass}>{rank}</div>
}
