"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { db, storage, auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Camera, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingStep, setLoadingStep] = useState<string>("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [skipImage, setSkipImage] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSkipImage(false)

      // 파일 크기 체크 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "이미지 크기 초과",
          description: "이미지 크기는 10MB 이하여야 합니다.",
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

  // 이미지 크기 줄이기
  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // 파일 크기가 작으면 그대로 반환
      if (file.size < 500 * 1024) {
        // 500KB 미만이면 압축하지 않음
        file
          .arrayBuffer()
          .then((buffer) => {
            resolve(new Blob([buffer], { type: file.type }))
          })
          .catch(reject)
        return
      }

      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string

        img.onload = () => {
          // 원본 크기 저장
          const originalWidth = img.width
          const originalHeight = img.height

          // 목표 크기 계산 (최대 1200px, 원본 비율 유지)
          let targetWidth = originalWidth
          let targetHeight = originalHeight
          const MAX_SIZE = 1200

          if (originalWidth > MAX_SIZE || originalHeight > MAX_SIZE) {
            if (originalWidth > originalHeight) {
              targetWidth = MAX_SIZE
              targetHeight = Math.round(originalHeight * (MAX_SIZE / originalWidth))
            } else {
              targetHeight = MAX_SIZE
              targetWidth = Math.round(originalWidth * (MAX_SIZE / originalHeight))
            }
          }

          // 캔버스 생성 및 이미지 그리기
          const canvas = document.createElement("canvas")
          canvas.width = targetWidth
          canvas.height = targetHeight

          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Canvas context not available"))
            return
          }

          // 이미지 그리기
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

          // 이미지 포맷 결정 (JPEG로 통일)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`Original size: ${file.size / 1024}KB, Compressed: ${blob.size / 1024}KB`)
                resolve(blob)
              } else {
                // 압축 실패 시 원본 반환
                file
                  .arrayBuffer()
                  .then((buffer) => {
                    resolve(new Blob([buffer], { type: "image/jpeg" }))
                  })
                  .catch(reject)
              }
            },
            "image/jpeg",
            0.8, // 품질 설정
          )
        }

        img.onerror = () => {
          // 이미지 로드 실패 시 원본 반환
          file
            .arrayBuffer()
            .then((buffer) => {
              resolve(new Blob([buffer], { type: file.type }))
            })
            .catch(reject)
        }
      }

      reader.onerror = () => reject(new Error("파일 읽기 실패"))
    })
  }

  // 이미지 없이 진행
  const handleSkipImage = () => {
    setSkipImage(true)
    setImage(null)
    setImagePreview(null)
    setUploadError(null)
  }

  // 재시도 로직
  useEffect(() => {
    if (retryCount > 0 && retryCount <= maxRetries && isSubmitting && uploadError) {
      // 재시도 로직
      const retryUpload = async () => {
        setUploadError(null)
        setLoadingStep(`재시도 중... (${retryCount}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, 1000)) // 잠시 대기
        handleSubmit(new Event("submit") as any, true)
      }

      retryUpload()
    }
  }, [retryCount])

  const handleSubmit = async (e: React.FormEvent, isRetry = false) => {
    if (!isRetry) {
      e.preventDefault()
      setRetryCount(0)
    }

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
      if (!isRetry) {
        setIsSubmitting(true)
        setUploadProgress(0)
      }

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

      let imageUrl = null

      // 이미지가 있고 스킵하지 않았으면 업로드
      if (image && !skipImage) {
        try {
          setLoadingStep("이미지 처리 중...")
          setUploadProgress(10)

          // 이미지 리사이징
          const resizedImage = await resizeImage(image)
          setUploadProgress(30)

          setLoadingStep("이미지 업로드 중...")
          // 이미지 업로드 (파일명에 타임스탬프 추가)
          const timestamp = Date.now()
          const filename = `${timestamp}-${image.name.replace(/[^a-zA-Z0-9.]/g, "_").substring(0, 30)}`
          const storageRef = ref(storage, `products/${userId}/${filename}`)

          // 업로드 작업 생성
          const uploadTask = uploadBytesResumable(storageRef, resizedImage)

          // 진행 상황 모니터링
          await new Promise<void>((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                // 진행 상황 업데이트
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 50) + 30
                setUploadProgress(progress <= 80 ? progress : 80)
              },
              (error) => {
                // 업로드 실패
                console.error("Upload failed:", error)
                setUploadError("이미지 업로드 중 오류가 발생했습니다.")

                // 재시도 로직
                if (retryCount < maxRetries) {
                  setRetryCount((prev) => prev + 1)
                }

                reject(error)
              },
              () => {
                // 업로드 완료
                resolve()
              },
            )
          })

          // URL 가져오기
          setUploadProgress(85)
          imageUrl = await getDownloadURL(uploadTask.snapshot.ref)
          setUploadProgress(90)
        } catch (error) {
          console.error("이미지 업로드 실패:", error)

          // 최대 재시도 횟수를 초과한 경우
          if (retryCount >= maxRetries) {
            toast({
              title: "이미지 업로드 실패",
              description: "이미지 없이 상품을 등록하시겠습니까?",
              variant: "destructive",
            })

            // 사용자에게 이미지 없이 계속할지 물어보기
            setUploadError("이미지 업로드에 실패했습니다. 이미지 없이 등록하시겠습니까?")
            return
          }

          throw error
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
        imageUrl,
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

      // 최대 재시도 횟수를 초과한 경우에만 오류 메시지 표시
      if (retryCount >= maxRetries) {
        toast({
          title: "상품 등록 실패",
          description: error.message || "상품 등록 중 오류가 발생했습니다.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        setLoadingStep("")
        setUploadProgress(0)
      }
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
              disabled={isSubmitting || !image}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              이미지 없이 등록
            </Button>
          )}
        </div>

        {!skipImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`
              cursor-pointer border-2 border-dashed rounded-md p-4 
              flex flex-col items-center justify-center
              ${imagePreview ? "border-green-300" : "border-gray-300 hover:border-green-300"}
              transition-colors
            `}
          >
            {imagePreview ? (
              <div className="relative w-full">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Product preview"
                  className="w-full h-48 object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-md">
                  <p className="text-white text-sm font-medium">이미지 변경하기</p>
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center">
                <Camera className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">이미지를 업로드하려면 클릭하세요</p>
                <p className="text-xs text-gray-400 mt-1">권장: 1200x1200 이하 크기의 이미지</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleImageChange}
              className="hidden"
              disabled={isSubmitting}
            />
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
              onClick={() => {
                setUploadError(null)
                setRetryCount((prev) => prev + 1)
              }}
              className="text-xs"
            >
              다시 시도
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
