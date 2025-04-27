"use client"

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore"
import { useFirebase } from "./firebase-provider"

// User-related functions
export const useUserFirestore = () => {
  const { db } = useFirebase()

  const createUserProfile = async (userId: string, userData: any) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const userRef = doc(db, "users", userId)
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        points: 0,
        level: 1,
        school: userData.school || "",
        carbonSaved: 0,
      })
    } catch (error) {
      console.error("Error creating user profile:", error)
      throw error
    }
  }

  const getUserProfile = async (userId: string) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() }
      }

      return null
    } catch (error) {
      console.error("Error getting user profile:", error)
      // Return null instead of throwing error to allow graceful fallback
      return null
    }
  }

  const updateUserProfile = async (userId: string, userData: any) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  const updateUserPoints = async (userId: string, pointsToAdd: number) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        const currentPoints = userData.points || 0
        const newPoints = currentPoints + pointsToAdd

        // Calculate level based on points
        // Simple formula: level = 1 + floor(points / 100)
        const newLevel = Math.floor(newPoints / 100) + 1

        await updateDoc(userRef, {
          points: newPoints,
          level: newLevel,
          updatedAt: serverTimestamp(),
        })

        return { points: newPoints, level: newLevel }
      }

      return null
    } catch (error) {
      console.error("Error updating user points:", error)
      return null
    }
  }

  const getSchoolLeaderboard = async (limitCount = 10) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      // This would typically aggregate user data by school
      // For simplicity, we'll use a mock implementation
      const schoolsRef = collection(db, "schools")
      const q = query(schoolsRef, orderBy("points", "desc"), limit(limitCount))

      const querySnapshot = await getDocs(q)
      const schools: DocumentData[] = []

      querySnapshot.forEach((doc) => {
        schools.push({ id: doc.id, ...doc.data() })
      })

      return schools
    } catch (error) {
      console.error("Error getting school leaderboard:", error)
      return []
    }
  }

  const getUserLeaderboard = async (limitCount = 10) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, orderBy("points", "desc"), limit(limitCount))

      const querySnapshot = await getDocs(q)
      const users: DocumentData[] = []

      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() })
      })

      return users
    } catch (error) {
      console.error("Error getting user leaderboard:", error)
      return []
    }
  }

  return {
    createUserProfile,
    getUserProfile,
    updateUserProfile,
    updateUserPoints,
    getSchoolLeaderboard,
    getUserLeaderboard,
  }
}

// Activity-related functions
export const useActivityFirestore = () => {
  const { db } = useFirebase()

  const logActivity = async (userId: string, activityData: any) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const activitiesRef = collection(db, "activities")
      const docRef = await addDoc(activitiesRef, {
        userId,
        ...activityData,
        timestamp: serverTimestamp(),
      })

      return docRef.id
    } catch (error) {
      console.error("Error logging activity:", error)
      throw error
    }
  }

  const getUserActivities = async (userId: string, limitCount = 10) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const activitiesRef = collection(db, "activities")
      // 단순화된 쿼리: userId로만 필터링하고 클라이언트에서 정렬
      const q = query(activitiesRef, where("userId", "==", userId), limit(limitCount))

      const querySnapshot = await getDocs(q)
      const activities: DocumentData[] = []

      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() })
      })

      // 클라이언트에서 timestamp 기준으로 정렬
      return activities.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || a.timestamp
        const timeB = b.timestamp?.toDate?.() || b.timestamp
        return timeB - timeA
      })
    } catch (error) {
      console.error("Error getting user activities:", error)
      return []
    }
  }

  return {
    logActivity,
    getUserActivities,
  }
}

// Social post-related functions
export const usePostsFirestore = () => {
  const { db } = useFirebase()

  const createPost = async (userId: string, postData: any) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const postsRef = collection(db, "posts")
      const docRef = await addDoc(postsRef, {
        userId,
        ...postData,
        likes: 0,
        comments: 0,
        timestamp: serverTimestamp(),
      })

      return docRef.id
    } catch (error) {
      console.error("Error creating post:", error)
      throw error
    }
  }

  const getPosts = async (constraints: QueryConstraint[] = [], limitCount = 10) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const postsRef = collection(db, "posts")
      const baseConstraints = [orderBy("timestamp", "desc"), limit(limitCount)]
      const q = query(postsRef, ...constraints, ...baseConstraints)

      const querySnapshot = await getDocs(q)
      const posts: DocumentData[] = []

      querySnapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() })
      })

      return posts
    } catch (error) {
      console.error("Error getting posts:", error)
      return []
    }
  }

  const getUserPosts = async (userId: string, limitCount = 10) => {
    try {
      return await getPosts([where("userId", "==", userId)], limitCount)
    } catch (error) {
      console.error("Error getting user posts:", error)
      return []
    }
  }

  const getSchoolPosts = async (schoolName: string, limitCount = 10) => {
    try {
      return await getPosts([where("school", "==", schoolName)], limitCount)
    } catch (error) {
      console.error("Error getting school posts:", error)
      return []
    }
  }

  const likePost = async (postId: string, userId: string) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      // In a real app, you'd track which users liked which posts
      // For simplicity, we'll just increment the like count
      const postRef = doc(db, "posts", postId)
      const postSnap = await getDoc(postRef)

      if (postSnap.exists()) {
        const postData = postSnap.data()
        const currentLikes = postData.likes || 0

        await updateDoc(postRef, {
          likes: currentLikes + 1,
        })

        return currentLikes + 1
      }

      return null
    } catch (error) {
      console.error("Error liking post:", error)
      return null
    }
  }

  return {
    createPost,
    getPosts,
    getUserPosts,
    getSchoolPosts,
    likePost,
  }
}

// Marketplace-related functions
export const useMarketplaceFirestore = () => {
  const { db } = useFirebase()

  const createListing = async (userId: string, listingData: any) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const listingsRef = collection(db, "marketplace")
      const docRef = await addDoc(listingsRef, {
        userId,
        ...listingData,
        status: "active",
        timestamp: serverTimestamp(),
      })

      return docRef.id
    } catch (error) {
      console.error("Error creating listing:", error)
      throw error
    }
  }

  const getListings = async (constraints: QueryConstraint[] = [], limitCount = 20) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const listingsRef = collection(db, "marketplace")
      const baseConstraints = [where("status", "==", "active"), orderBy("timestamp", "desc"), limit(limitCount)]
      const q = query(listingsRef, ...constraints, ...baseConstraints)

      const querySnapshot = await getDocs(q)
      const listings: DocumentData[] = []

      querySnapshot.forEach((doc) => {
        listings.push({ id: doc.id, ...doc.data() })
      })

      return listings
    } catch (error) {
      console.error("Error fetching listings:", error)
      return []
    }
  }

  const getSchoolListings = async (schoolName: string, limitCount = 20) => {
    try {
      return await getListings([where("school", "==", schoolName)], limitCount)
    } catch (error) {
      console.error("Error getting school listings:", error)
      return []
    }
  }

  const getUserListings = async (userId: string, limitCount = 20) => {
    try {
      return await getListings([where("userId", "==", userId)], limitCount)
    } catch (error) {
      console.error("Error getting user listings:", error)
      return []
    }
  }

  const updateListing = async (listingId: string, listingData: any) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const listingRef = doc(db, "marketplace", listingId)
      await updateDoc(listingRef, {
        ...listingData,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating listing:", error)
      throw error
    }
  }

  const deleteListing = async (listingId: string) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const listingRef = doc(db, "marketplace", listingId)
      await deleteDoc(listingRef)
    } catch (error) {
      console.error("Error deleting listing:", error)
      throw error
    }
  }

  return {
    createListing,
    getListings,
    getSchoolListings,
    getUserListings,
    updateListing,
    deleteListing,
  }
}

// Chat-related functions (new)
export const useChatFirestore = () => {
  const { db } = useFirebase()

  const getChats = async (userId: string) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      // In a real app, you'd fetch chats from Firestore
      // For now, return mock data to avoid permission issues
      return [
        {
          id: "1",
          name: "Kai Nakamura",
          avatar: "/diverse-group-city.png",
          lastMessage: "Is the textbook still available?",
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          unread: 2,
        },
        {
          id: "2",
          name: "Leilani Wong",
          avatar: "/diverse-group-city.png",
          lastMessage: "I can meet tomorrow at the cafeteria",
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          unread: 0,
        },
        {
          id: "3",
          name: "Noah Patel",
          avatar: "/diverse-group-city.png",
          lastMessage: "Thanks for the calculator! It works great.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          unread: 0,
        },
      ]
    } catch (error) {
      console.error("Error getting chats:", error)
      return []
    }
  }

  const getChatById = async (chatId: string) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      // In a real app, you'd fetch the chat from Firestore
      // For now, return mock data to avoid permission issues
      return {
        id: chatId,
        name: "Kai Nakamura",
        avatar: "/diverse-group-city.png",
        messages: [
          {
            id: "1",
            sender: "other",
            text: "Hi there! I saw your listing for the Biology textbook. Is it still available?",
            timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          },
          {
            id: "2",
            sender: "me",
            text: "Yes, it's still available! Are you interested?",
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          },
          {
            id: "3",
            sender: "other",
            text: "Great! I'd like to buy it. When can we meet?",
            timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
          },
          {
            id: "4",
            sender: "other",
            text: "Is the textbook still available?",
            timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          },
        ],
      }
    } catch (error) {
      console.error("Error getting chat:", error)
      return null
    }
  }

  const sendMessage = async (chatId: string, userId: string, message: string) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      // In a real app, you'd add the message to Firestore
      console.log(`Sending message to chat ${chatId} from user ${userId}: ${message}`)
      return {
        id: Date.now().toString(),
        sender: "me",
        text: message,
        timestamp: new Date(),
      }
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  return {
    getChats,
    getChatById,
    sendMessage,
  }
}
