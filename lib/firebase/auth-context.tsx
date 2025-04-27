"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth"
import { useFirebase } from "./firebase-provider"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<User>
  signUp: (email: string, password: string, displayName: string) => Promise<User>
  signOut: () => Promise<void>
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {
    throw new Error("Not implemented")
  },
  signUp: async () => {
    throw new Error("Not implemented")
  },
  signOut: async () => {
    throw new Error("Not implemented")
  },
  updateUserProfile: async () => {
    throw new Error("Not implemented")
  },
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { app } = useFirebase()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authInitialized, setAuthInitialized] = useState(false)

  useEffect(() => {
    if (!app) return

    const auth = getAuth(app)

    // Set a timeout to ensure we don't wait forever
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Auth initialization timed out, setting loading to false")
        setLoading(false)
      }
    }, 5000)

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      setAuthInitialized(true)
      clearTimeout(timeoutId)
    })

    return () => {
      unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [app])

  const signIn = async (email: string, password: string) => {
    if (!app) throw new Error("Firebase not initialized")

    const auth = getAuth(app)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!app) throw new Error("Firebase not initialized")

    const auth = getAuth(app)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    // Update the user's profile with the display name
    await updateProfile(userCredential.user, { displayName })

    return userCredential.user
  }

  const signOut = async () => {
    if (!app) throw new Error("Firebase not initialized")

    const auth = getAuth(app)
    await firebaseSignOut(auth)
  }

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    if (!app || !user) throw new Error("Firebase not initialized or user not logged in")

    const auth = getAuth(app)
    await updateProfile(auth.currentUser!, { displayName, photoURL })
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
