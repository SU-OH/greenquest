"use client"

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { useFirebase } from "./firebase-provider"
import { getStorage } from "firebase/storage"
import { app } from "./config"

const storage = getStorage(app)

export const useFirebaseStorage = () => {
  const { storage } = useFirebase()

  const uploadImage = async (
    file: File,
    path: string,
    options?: {
      maxWidth?: number
      maxHeight?: number
      quality?: number
    }
  ): Promise<string> => {
    try {
      // Create a canvas to resize image if needed
      const img = new Image()
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      return new Promise<string>((resolve, reject) => {
        img.onload = () => {
          let width = img.width
          let height = img.height

          // Resize if dimensions exceed max
          if (options?.maxWidth && width > options.maxWidth) {
            height = (height * options.maxWidth) / width
            width = options.maxWidth
          }
          if (options?.maxHeight && height > options.maxHeight) {
            width = (width * options.maxHeight) / height
            height = options.maxHeight
          }

          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)

          // Convert to blob with quality option
          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                reject(new Error("Failed to create image blob"))
                return
              }

              const storageRef = ref(storage, path)
              await uploadBytes(storageRef, blob)
              const url = await getDownloadURL(storageRef)
              resolve(url)
            },
            file.type,
            options?.quality || 0.8
          )
        }

        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = URL.createObjectURL(file)
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      throw error
    }
  }

  const uploadProfileImage = async (file: File, userId: string): Promise<string> => {
    return uploadImage(file, `profiles/${userId}`, {
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.8,
    })
  }

  const uploadPostImage = async (file: File, postId: string): Promise<string> => {
    return uploadImage(file, `posts/${postId}`, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
    })
  }

  const uploadMarketplaceImage = async (file: File, userId: string): Promise<string> => {
    const tempId = `temp-${Date.now()}`
    return uploadImage(file, `marketplace/${userId}/${tempId}`, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
    })
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
