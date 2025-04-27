"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"
import { firebaseConfig } from "./firebase-config"
import { AuthProvider } from "./auth-context"

// Create a context for Firebase instances
interface FirebaseContextType {
  app: FirebaseApp | null
  db: Firestore | null
  storage: FirebaseStorage | null
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  db: null,
  storage: null,
})

export const useFirebase = () => useContext(FirebaseContext)

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [firebaseInstance, setFirebaseInstance] = useState<FirebaseContextType>({
    app: null,
    db: null,
    storage: null,
  })

  useEffect(() => {
    // Initialize Firebase only if it hasn't been initialized yet
    let app
    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }

    const db = getFirestore(app)
    const storage = getStorage(app)

    setFirebaseInstance({
      app,
      db,
      storage,
    })
  }, [])

  return (
    <FirebaseContext.Provider value={firebaseInstance}>
      <AuthProvider>{children}</AuthProvider>
    </FirebaseContext.Provider>
  )
}
