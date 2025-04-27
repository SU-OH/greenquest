"use client"

import type React from "react"

import { useState, useRef } from "react"
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Camera, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProductFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ProductForm({ onSuccess, onCancel }: ProductFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingStep, setLoadingStep] = useState<string>("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [skipImage, setSkipImage] = useState(false)
  const [imageInputMethod, setImageInputMethod] = useState<"upload" | "url">("upload")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSkipImage(false)

      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "이미지 크기 초과",
          description: "이미지 크기는 5MB 이하여야 합니다.",
          variant: "destructive",
        })
        return
      }

      setImage(file)
      setUploadError(null)

      // 이미지 미리보기 생성
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 이미지 URL 입력 처리
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value)
    setSkipImage(false)
    setUploadError(null)
  }

  // 이미지 URL 미리보기
  const handlePreviewImageUrl = () => {
    if (!imageUrl) {
      toast({
        title: "URL을 입력하세요",
        description: "이미지 URL을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    // URL 유효성 검사
    try {
      new URL(imageUrl)
      setImagePreview(imageUrl)
    } catch (e) {
      toast({
        title: "잘못된 URL",
        description: "유효한 이미지 URL을 입력해주세요",
        variant: "destructive",
      })
    }
  }

  // 이미지 없이 진행
  const handleSkipImage = () => {
    setSkipImage(true)
    setImage(null)
    setImagePreview(null)
    setImageUrl("")
    setUploadError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!auth.currentUser) {
      toast({
        title: "로그인이 필요합니다",
        description: "상품을 등록하려면 로그인해주세요",
        variant: "destructive",
      })
      return
    }

    if (!title || !description || !price || !category) {
      toast({
        title: "모든 필드를 입력해주세요",
        description: "상품 정보를 모두 입력해야 합니다",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      setUploadProgress(0)
      const userId = auth.currentUser.uid

      // 사용자 정보 가져오기
      setLoadingStep("사용자 정보 확인 중...")
      let userData = { name: "", school: "" }
      try {
        const userDocRef = doc(db, "users", userId)
        const userDocSnap = await getDoc(userDocRef)
        if (userDocSnap.exists()) {
          userData = userDocSnap.data() as { name: string; school: string }
        }
      } catch (error) {
        console.error("사용자 정보 조회 실패:", error)
      }

      let finalImageUrl = null

      // 이미지 처리 (스킵하지 않은 경우)
      if (!skipImage) {
        setUploadProgress(30)

        // URL 입력 방식인 경우
        if (imageInputMethod === "url" && imageUrl) {
          finalImageUrl = imageUrl
          setUploadProgress(80)
        }
        // 파일 업로드 방식인 경우 - CORS 오류로 인해 비활성화
        else if (imageInputMethod === "upload" && image) {
          // CORS 오류로 인해 업로드 대신 경고 표시
          toast({
            title: "이미지 업로드 제한",
            description: "CORS 정책으로 인해 이미지 업로드가 제한됩니다. URL을 사용하거나 이미지 없이 등록해주세요.",
            variant: "warning",
          })

          // 사용자에게 선택지 제공
          setUploadError("CORS 정책으로 인해 이미지 업로드가 제한됩니다. URL을 사용하거나 이미지 없이 등록해주세요.")
          setIsSubmitting(false)
          return
        }
      }

      // Firestore에 상품 정보 저장
      setLoadingStep("상품 정보 저장 중...")
      setUploadProgress(95)

      await addDoc(collection(db, "products"), {
        title,
        description,
        price: Number.parseFloat(price),
        category,
        imageUrl: finalImageUrl,
        sellerId: userId,
        sellerName: userData?.name || "",
        school: userData?.school || "",
        status: "available", // available, sold, reserved
        createdAt: serverTimestamp(),
      })

      setUploadProgress(100)

      toast({
        title: "상품이 등록되었습니다",
        description: "마켓플레이스에서 확인할 수 있습니다",
      })

      // 성공 후 콜백 실행
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Error adding product:", error)
      toast({
        title: "상품 등록 실패",
        description: error.message || "상품 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setLoadingStep("")
      setUploadProgress(0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">상품명</Label>
        <Input
          id="title"
          placeholder="상품명을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">상품 설명</Label>
        <Textarea
          id="description"
          placeholder="상품에 대한 설명을 입력하세요"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          required
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">가격 ($)</Label>
          <Input
            id="price"
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">카테고리</Label>
          <Select value={category} onValueChange={setCategory} disabled={isSubmitting} required>
            <SelectTrigger id="category">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="books">도서</SelectItem>
              <SelectItem value="electronics">전자기기</SelectItem>
              <SelectItem value="clothing">의류</SelectItem>
              <SelectItem value="furniture">가구</SelectItem>
              <SelectItem value="other">기타</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>상품 이미지</Label>
          {!skipImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSkipImage}
              disabled={isSubmitting}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              이미지 없이 등록
            </Button>
          )}
        </div>

        {!skipImage ? (
          <div className="space-y-4">
            <Tabs defaultValue="url" onValueChange={(value) => setImageInputMethod(value as "upload" | "url")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">이미지 URL</TabsTrigger>
                <TabsTrigger value="upload" disabled>
                  파일 업로드 (비활성화)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="이미지 URL을 입력하세요"
                    value={imageUrl}
                    onChange={handleImageUrlChange}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    onClick={handlePreviewImageUrl}
                    disabled={isSubmitting || !imageUrl}
                    className="whitespace-nowrap"
                  >
                    미리보기
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  <p>* 외부 이미지 URL을 사용할 경우 이미지가 삭제되거나 변경될 수 있습니다.</p>
                  <p>* 저작권에 문제가 없는 이미지를 사용해주세요.</p>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4 pt-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center"
                >
                  <div className="py-8 flex flex-col items-center">
                    <Camera className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">CORS 정책으로 인해 비활성화됨</p>
                    <p className="text-xs text-gray-400 mt-1">이미지 URL을 사용해주세요</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={true}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {imagePreview && (
              <div className="mt-4 border rounded-md p-2">
                <p className="text-sm font-medium mb-2">이미지 미리보기:</p>
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Product preview"
                  className="w-full h-48 object-contain rounded-md"
                  onError={() => {
                    setImagePreview(null)
                    toast({
                      title: "이미지 로드 실패",
                      description: "이미지를 불러올 수 없습니다. 다른 URL을 사용해주세요.",
                      variant: "destructive",
                    })
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-md p-4 text-center">
            <p className="text-sm text-gray-500">이미지 없이 상품을 등록합니다</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSkipImage(false)}
              disabled={isSubmitting}
              className="mt-2 text-xs text-green-600 hover:text-green-700"
            >
              이미지 추가하기
            </Button>
          </div>
        )}
      </div>

      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
          <div className="flex gap-2 mt-2">
            <Button type="button" variant="outline" size="sm" onClick={handleSkipImage} className="text-xs">
              이미지 없이 등록
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setImageInputMethod("url")}
              className="text-xs"
            >
              URL 사용하기
            </Button>
          </div>
        </Alert>
      )}

      {isSubmitting && uploadProgress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{loadingStep}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          취소
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting || !!uploadError}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {loadingStep || "등록 중..."}
            </>
          ) : (
            "상품 등록하기"
          )}
        </Button>
      </div>
    </form>
  )
}
