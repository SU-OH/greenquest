"use client"

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { useFirebase } from "./firebase-provider"

export const useFirebaseStorage = () => {
  const { storage } = useFirebase()

  const uploadImage = async (file: File, path: string): Promise<string> => {
    if (!storage) throw new Error("Firebase Storage not initialized")

    // Create a storage reference
    const storageRef = ref(storage, path)

    // Upload the file
    await uploadBytes(storageRef, file)

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef)

    return downloadURL
  }

  const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
    const path = `profiles/${userId}/${Date.now()}-${file.name}`
    return uploadImage(file, path)
  }

  const uploadPostImage = async (userId: string, file: File): Promise<string> => {
    const path = `posts/${userId}/${Date.now()}-${file.name}`
    return uploadImage(file, path)
  }

  const uploadMarketplaceImage = async (userId: string, file: File): Promise<string> => {
    const path = `marketplace/${userId}/${Date.now()}-${file.name}`
    return uploadImage(file, path)
  }

  const deleteImage = async (url: string): Promise<void> => {
    if (!storage) throw new Error("Firebase Storage not initialized")

    // Extract the path from the URL
    // This is a simplified approach and might need adjustment based on your storage setup
    const storageRef = ref(storage, url)

    // Delete the file
    await deleteObject(storageRef)
  }

  return {
    uploadImage,
    uploadProfileImage,
    uploadPostImage,
    uploadMarketplaceImage,
    deleteImage,
  }
}
