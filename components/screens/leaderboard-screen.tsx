"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Medal } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LeaderboardScreen() {
  const [users, setUsers] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userSchool, setUserSchool] = useState("")
  const [timeframe, setTimeframe] = useState("all-time")

  useEffect(() => {
    const fetchUserSchool = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", auth.currentUser.email)))

          if (!userDoc.empty) {
            setUserSchool(userDoc.docs[0].data().school)
          }
        } catch (error) {
          console.error("Error fetching user school:", error)
        }
      }
    }

    fetchUserSchool()
  }, [])

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        // Fetch top users - 인덱스 없이 쿼리
        const usersQuery = query(collection(db, "users"))

        const usersSnapshot = await getDocs(usersQuery)
        const usersData = usersSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          // JavaScript에서 정렬
          .sort((a, b) => (b.points || 0) - (a.points || 0))
          // 상위 20명만 선택
          .slice(0, 20)
          // 순위 추가
          .map((user, index) => ({
            ...user,
            rank: index + 1,
          }))

        setUsers(usersData)

        // Fetch top schools - 인덱스 없이 쿼리
        const schoolsQuery = query(collection(db, "schools"))

        const schoolsSnapshot = await getDocs(schoolsQuery)
        const schoolsData = schoolsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          // JavaScript에서 정렬
          .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
          // 상위 10개만 선택
          .slice(0, 10)
          // 순위 추가
          .map((school, index) => ({
            ...school,
            rank: index + 1,
          }))

        setSchools(schoolsData)
      } catch (error) {
        console.error("Error fetching leaderboards:", error)
        setUsers([])
        setSchools([])
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboards()
  }, [timeframe])

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-500"
      case 2:
        return "text-gray-400"
      case 3:
        return "text-amber-700"
      default:
        return "text-gray-300"
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-green-800">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">See who's making the biggest environmental impact</p>
      </div>

      <div className="mb-6">
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-time">All Time</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="this-week">This Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="individuals" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individuals">Individuals</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
        </TabsList>

        <TabsContent value="individuals" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Top Environmentalists</CardTitle>
              <CardDescription>
                {timeframe === "all-time"
                  ? "All time leaders"
                  : timeframe === "this-month"
                    ? "This month's leaders"
                    : "This week's leaders"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-center gap-4 border-b py-3">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="mt-1 h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))
              ) : users.length > 0 ? (
                users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-4 border-b py-3 ${
                      user.school === userSchool ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="flex h-6 w-6 items-center justify-center">
                      {user.rank <= 3 ? (
                        <Medal className={`h-5 w-5 ${getMedalColor(user.rank)}`} />
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">{user.rank}</span>
                      )}
                    </div>
                    <Avatar>
                      <AvatarImage src={user.profileImage || "/placeholder.svg"} />
                      <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-xs text-muted-foreground">{user.school}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-green-600">{user.points || 0}</span>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Top Schools</CardTitle>
              <CardDescription>Schools making the biggest environmental impact</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-center gap-4 border-b py-3">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="mt-1 h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))
              ) : schools.length > 0 ? (
                schools.map((school) => (
                  <div
                    key={school.id}
                    className={`flex items-center gap-4 border-b py-3 ${
                      school.name === userSchool ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="flex h-6 w-6 items-center justify-center">
                      {school.rank <= 3 ? (
                        <Medal className={`h-5 w-5 ${getMedalColor(school.rank)}`} />
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">{school.rank}</span>
                      )}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <span className="text-lg font-bold text-green-800">{school.name?.charAt(0) || "S"}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{school.name}</h3>
                      <p className="text-xs text-muted-foreground">{school.studentCount || 0} students</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-green-600">{school.totalPoints || 0}</span>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
