"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ShoppingBag, PlusCircle, MessageCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Home",
      href: "/feed",
      icon: Home,
    },
    {
      name: "Marketplace",
      href: "/marketplace",
      icon: ShoppingBag,
    },
    {
      name: "Sell",
      href: "/marketplace/create",
      icon: PlusCircle,
    },
    {
      name: "Chats",
      href: "/chats",
      icon: MessageCircle,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full",
                isActive ? "text-green-600" : "text-gray-500",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
