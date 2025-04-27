"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ImageIcon, X, Loader2 } from "lucide-react"
import { useFirebaseStorage } from "@/lib/firebase/storage"

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  userId: string
  type: "profile" | "post" | "marketplace"
  className?: string
}

export function ImageUpload({ onImageUploaded, userId, type, className = "" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const storage = useFirebaseStorage()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create a preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload the file
    setIsUploading(true)
    try {
      let imageUrl = ""

      if (type === "profile") {
        imageUrl = await storage.uploadProfileImage(userId, file)
      } else if (type === "post") {
        imageUrl = await storage.uploadPostImage(userId, file)
      } else if (type === "marketplace") {
        imageUrl = await storage.uploadMarketplaceImage(userId, file)
      }

      onImageUploaded(imageUrl)
    } catch (error) {
      console.error("Error uploading image:", error)
      // Reset preview on error
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onImageUploaded("")
  }

  return (
    <div className={className}>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {previewUrl ? (
        <div className="relative">
          <Card className="overflow-hidden">
            <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-full h-auto object-cover" />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </Card>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={handleButtonClick}
          disabled={isUploading}
          className="w-full h-32 flex flex-col gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-6 w-6" />
              <span>Upload Image</span>
            </>
          )}
        </Button>
      )}
    </div>
  )
}
