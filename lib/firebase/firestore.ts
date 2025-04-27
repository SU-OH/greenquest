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

  const getListingById = async (listingId: string) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const listingRef = doc(db, "marketplace", listingId)
      const listingSnap = await getDoc(listingRef)

      if (listingSnap.exists()) {
        return { id: listingSnap.id, ...listingSnap.data() }
      }
      return null
    } catch (error) {
      console.error("Error fetching listing:", error)
      return null
    }
  }

  const likeListing = async (listingId: string, userId: string) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const listingRef = doc(db, "marketplace", listingId)
      const listingSnap = await getDoc(listingRef)

      if (listingSnap.exists()) {
        const listingData = listingSnap.data()
        const currentLikes = listingData.likes || 0

        await updateDoc(listingRef, {
          likes: currentLikes + 1,
        })

        return currentLikes + 1
      }

      return null
    } catch (error) {
      console.error("Error liking listing:", error)
      return null
    }
  }

  const getListingChatCount = async (listingId: string) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const chatsRef = collection(db, "chats")
      const q = query(chatsRef, where("listingId", "==", listingId))
      const querySnapshot = await getDocs(q)
      return querySnapshot.size
    } catch (error) {
      console.error("Error getting chat count:", error)
      return 0
    }
  }

  return {
    createListing,
    getListings,
    getSchoolListings,
    getUserListings,
    updateListing,
    deleteListing,
    getListingById,
    likeListing,
    getListingChatCount,
  }
}

// Chat-related functions
export const useChatFirestore = () => {
  const { db } = useFirebase()

  const createChat = async (listingId: string, buyerId: string, sellerId: string) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      // Check if chat already exists
      const chatsRef = collection(db, "chats")
      const q = query(
        chatsRef,
        where("listingId", "==", listingId),
        where("participants", "array-contains", buyerId)
      )
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id
      }

      // Create new chat
      const docRef = await addDoc(chatsRef, {
        listingId,
        participants: [buyerId, sellerId],
        lastMessage: "",
        lastMessageTime: serverTimestamp(),
        createdAt: serverTimestamp(),
      })

      return docRef.id
    } catch (error) {
      console.error("Error creating chat:", error)
      throw error
    }
  }

  const sendMessage = async (chatId: string, senderId: string, message: string) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const messagesRef = collection(db, "chats", chatId, "messages")
      await addDoc(messagesRef, {
        senderId,
        message,
        timestamp: serverTimestamp(),
      })

      // Update chat's last message
      const chatRef = doc(db, "chats", chatId)
      await updateDoc(chatRef, {
        lastMessage: message,
        lastMessageTime: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  const getChatMessages = async (chatId: string) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const messagesRef = collection(db, "chats", chatId, "messages")
      const q = query(messagesRef, orderBy("timestamp", "asc"))
      const querySnapshot = await getDocs(q)

      const messages: DocumentData[] = []
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() })
      })

      return messages
    } catch (error) {
      console.error("Error fetching messages:", error)
      return []
    }
  }

  const getUserChats = async (userId: string) => {
    if (!db) throw new Error("Firestore not initialized")

    try {
      const chatsRef = collection(db, "chats")
      const q = query(chatsRef, where("participants", "array-contains", userId))
      const querySnapshot = await getDocs(q)

      const chats: DocumentData[] = []
      querySnapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() })
      })

      return chats
    } catch (error) {
      console.error("Error fetching user chats:", error)
      return []
    }
  }

  return {
    createChat,
    sendMessage,
    getChatMessages,
    getUserChats,
  }
}
