"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, X } from "lucide-react"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void
  currentImageUrl?: string
  className?: string
}

export function ImageUpload({ onFileSelect, currentImageUrl, className = "" }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      // Check file type
      if (!file.type.match(/image\/(jpeg|png|gif|webp)/)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPG, PNG, GIF, or WebP image",
          variant: "destructive",
        })
        return
      }

      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
      onFileSelect(file)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />
      {previewUrl ? (
        <div className="relative">
          <div className="relative w-24 h-24 rounded-full overflow-hidden">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-24 w-24 rounded-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </Button>
      )}
    </div>
  )
}
