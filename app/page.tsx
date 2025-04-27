"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import AuthScreen from "@/components/auth/auth-screen"
import LoadingScreen from "@/components/ui/loading-screen"
import MainNavigation from "@/components/navigation/main-navigation"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthScreen />
  }

  return <MainNavigation />
}
