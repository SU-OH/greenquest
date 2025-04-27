"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bell, ArrowLeft } from "lucide-react"

interface AppHeaderProps {
  title?: string
  showSearch?: boolean
  showBack?: boolean
  showNotification?: boolean
  onSearch?: (query: string) => void
}

export function AppHeader({
  title,
  showSearch = false,
  showBack = false,
  showNotification = false,
  onSearch,
}: AppHeaderProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center gap-2">
          {showBack && (
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {title && <h1 className="text-lg font-semibold">{title}</h1>}
        </div>

        {showSearch && (
          <form onSubmit={handleSearch} className="flex-1 mx-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        )}

        {showNotification && (
          <Button variant="ghost" size="icon" className="ml-auto">
            <Bell className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  )
}
