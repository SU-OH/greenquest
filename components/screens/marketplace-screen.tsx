"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Tag } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ProductForm from "@/components/marketplace/product-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function MarketplaceScreen() {
  const [products, setProducts] = useState<any[]>([])
  const [myProducts, setMyProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMyProducts, setLoadingMyProducts] = useState(true)
  const [userSchool, setUserSchool] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    const fetchUserSchool = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", auth.currentUser.email)))

          if (!userDoc.empty) {
            setUserSchool(userDoc.docs[0].data().school)
          }
        } catch (error) {
          console.error("Error fetching user school:", error)
        }
      }
    }

    fetchUserSchool()
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userSchool) return

      try {
        setLoading(true)

        // orderBy 없이 쿼리 실행 (인덱스 필요 없음)
        const productsQuery = query(collection(db, "products"), where("school", "==", userSchool))

        const querySnapshot = await getDocs(productsQuery)

        // JavaScript에서 데이터 정렬
        const productsData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            // createdAt이 없는 경우 기본값 설정
            const dateA = a.createdAt?.toDate?.() || new Date(0)
            const dateB = b.createdAt?.toDate?.() || new Date(0)
            return dateB.getTime() - dateA.getTime() // 내림차순 정렬
          })

        setProducts(productsData)
      } catch (error) {
        console.error("Error fetching products:", error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    if (userSchool) {
      fetchProducts()
    }
  }, [userSchool])

  useEffect(() => {
    const fetchMyProducts = async () => {
      if (!auth.currentUser) return

      try {
        setLoadingMyProducts(true)
        const userId = auth.currentUser.uid

        // 내 상품만 가져오기
        const myProductsQuery = query(collection(db, "products"), where("sellerId", "==", userId))

        const querySnapshot = await getDocs(myProductsQuery)

        // JavaScript에서 데이터 정렬
        const myProductsData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0)
            const dateB = b.createdAt?.toDate?.() || new Date(0)
            return dateB.getTime() - dateA.getTime() // 내림차순 정렬
          })

        setMyProducts(myProductsData)
      } catch (error) {
        console.error("Error fetching my products:", error)
        setMyProducts([])
      } finally {
        setLoadingMyProducts(false)
      }
    }

    fetchMyProducts()
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = category === "all" || product.category === category
    return matchesSearch && matchesCategory
  })

  const handleProductAdded = () => {
    // 폼 닫기
    setIsFormOpen(false)

    // 상품 목록 새로고침
    if (auth.currentUser) {
      const userId = auth.currentUser.uid

      // 내 상품 목록 새로고침
      const fetchMyProducts = async () => {
        try {
          setLoadingMyProducts(true)
          const myProductsQuery = query(collection(db, "products"), where("sellerId", "==", userId))
          const querySnapshot = await getDocs(myProductsQuery)

          const myProductsData = querySnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(0)
              const dateB = b.createdAt?.toDate?.() || new Date(0)
              return dateB.getTime() - dateA.getTime()
            })

          setMyProducts(myProductsData)
        } catch (error) {
          console.error("Error refreshing my products:", error)
        } finally {
          setLoadingMyProducts(false)
        }
      }

      // 전체 상품 목록 새로고침
      const fetchAllProducts = async () => {
        if (!userSchool) return

        try {
          setLoading(true)
          const productsQuery = query(collection(db, "products"), where("school", "==", userSchool))
          const querySnapshot = await getDocs(productsQuery)

          const productsData = querySnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(0)
              const dateB = b.createdAt?.toDate?.() || new Date(0)
              return dateB.getTime() - dateA.getTime()
            })

          setProducts(productsData)
        } catch (error) {
          console.error("Error refreshing products:", error)
        } finally {
          setLoading(false)
        }
      }

      fetchMyProducts()
      fetchAllProducts()
    }
  }

  const getCategoryLabel = (categoryValue: string) => {
    switch (categoryValue) {
      case "books":
        return "도서"
      case "electronics":
        return "전자기기"
      case "clothing":
        return "의류"
      case "furniture":
        return "가구"
      case "other":
        return "기타"
      default:
        return categoryValue
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-green-800">GQX Marketplace</h1>
        <p className="text-sm text-muted-foreground">Buy and sell items at {userSchool}</p>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="books">도서</SelectItem>
            <SelectItem value="electronics">전자기기</SelectItem>
            <SelectItem value="clothing">의류</SelectItem>
            <SelectItem value="furniture">가구</SelectItem>
            <SelectItem value="other">기타</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="my-items">My Items</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square animate-pulse bg-gray-200"></div>
                    <CardContent className="p-3">
                      <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200"></div>
                      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.imageUrl || "/placeholder.svg?height=200&width=200&query=product"}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                    <Badge className="absolute right-2 top-2 bg-green-600">${product.price}</Badge>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium line-clamp-1">{product.title}</h3>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{getCategoryLabel(product.category)}</span>
                      <span className="text-xs text-green-600">+5 points</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="mb-2 text-lg font-medium">No items found</h3>
              <p className="text-muted-foreground">
                {products.length === 0
                  ? "Unable to load marketplace items. Please check back later."
                  : "Try adjusting your search or be the first to list an item!"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-items" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button className="gap-2 bg-green-600 hover:bg-green-700" onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>List New Item</span>
            </Button>
          </div>

          {loadingMyProducts ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square animate-pulse bg-gray-200"></div>
                    <CardContent className="p-3">
                      <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200"></div>
                      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : myProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {myProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.imageUrl || "/placeholder.svg?height=200&width=200&query=product"}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                    <Badge className="absolute right-2 top-2 bg-green-600">${product.price}</Badge>
                    <Badge
                      className={`absolute left-2 top-2 ${
                        product.status === "sold"
                          ? "bg-red-500"
                          : product.status === "reserved"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                      }`}
                    >
                      {product.status === "sold" ? "판매완료" : product.status === "reserved" ? "예약중" : "판매중"}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium line-clamp-1">{product.title}</h3>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{getCategoryLabel(product.category)}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.createdAt?.toDate?.() ? new Date(product.createdAt.toDate()).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Tag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">No items listed yet</h3>
              <p className="mb-4 text-muted-foreground">Start selling your unused items and earn green points!</p>
              <Button className="gap-2 bg-green-600 hover:bg-green-700" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4" />
                <span>List Your First Item</span>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 상품 등록 다이얼로그 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>상품 등록하기</DialogTitle>
            <DialogDescription>
              판매하고자 하는 상품의 정보를 입력해주세요. 상품 등록 시 5 포인트가 적립됩니다.
            </DialogDescription>
          </DialogHeader>
          <ProductForm onSuccess={handleProductAdded} onCancel={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
