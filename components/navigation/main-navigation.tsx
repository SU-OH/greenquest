"use client"

import { useState } from "react"
import { Home, ShoppingBag, BarChart2, MessageSquare, User } from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import HomeScreen from "@/components/screens/home-screen"
import MarketplaceScreen from "@/components/screens/marketplace-screen"
import LeaderboardScreen from "@/components/screens/leaderboard-screen"
import MessagesScreen from "@/components/screens/messages-screen"
import ProfileScreen from "@/components/screens/profile-screen"

export default function MainNavigation() {
  const [activeTab, setActiveTab] = useState("home")
  const { toast } = useToast()

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

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-800">GreenQuest</h1>
          <button
            onClick={handleSignOut}
            className="rounded-md bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {activeTab === "home" && <HomeScreen />}
        {activeTab === "marketplace" && <MarketplaceScreen />}
        {activeTab === "leaderboard" && <LeaderboardScreen />}
        {activeTab === "messages" && <MessagesScreen />}
        {activeTab === "profile" && <ProfileScreen />}
      </main>

      <nav className="border-t bg-white shadow-lg">
        <div className="grid grid-cols-5">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center p-3 ${
              activeTab === "home" ? "text-green-600" : "text-gray-500"
            }`}
          >
            <Home size={24} />
            <span className="mt-1 text-xs">Home</span>
          </button>
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`flex flex-col items-center justify-center p-3 ${
              activeTab === "marketplace" ? "text-green-600" : "text-gray-500"
            }`}
          >
            <ShoppingBag size={24} />
            <span className="mt-1 text-xs">GQX</span>
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex flex-col items-center justify-center p-3 ${
              activeTab === "leaderboard" ? "text-green-600" : "text-gray-500"
            }`}
          >
            <BarChart2 size={24} />
            <span className="mt-1 text-xs">Leaderboard</span>
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex flex-col items-center justify-center p-3 ${
              activeTab === "messages" ? "text-green-600" : "text-gray-500"
            }`}
          >
            <MessageSquare size={24} />
            <span className="mt-1 text-xs">Messages</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center p-3 ${
              activeTab === "profile" ? "text-green-600" : "text-gray-500"
            }`}
          >
            <User size={24} />
            <span className="mt-1 text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
