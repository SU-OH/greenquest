"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, X, Leaf, LogOut, User, Settings } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when path changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const isHomePage = pathname === "/"
  const navbarClass = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    scrolled || !isHomePage ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
  }`
  const textClass = scrolled || !isHomePage ? "text-green-900" : "text-white"

  return (
    <nav className={navbarClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Leaf className={`h-8 w-8 ${textClass}`} />
              <span className={`ml-2 text-xl font-bold ${textClass}`}>GreenQuest</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLinks textClass={textClass} />
            {user ? (
              <UserMenu user={user} signOut={signOut} textClass={textClass} />
            ) : (
              <AuthButtons textClass={textClass} />
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className={`p-2 rounded-md ${textClass}`}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <MobileNavLinks />
            {user ? <MobileUserMenu user={user} signOut={signOut} /> : <MobileAuthButtons />}
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLinks({ textClass }: { textClass: string }) {
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/feed", label: "Social Feed" },
    { href: "/marketplace", label: "GQX Marketplace" },
    { href: "/leaderboard", label: "Leaderboard" },
  ]

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            pathname === link.href
              ? "bg-green-100 text-green-800"
              : `${textClass} hover:bg-green-100 hover:text-green-800`
          }`}
        >
          {link.label}
        </Link>
      ))}
    </>
  )
}

function MobileNavLinks() {
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/feed", label: "Social Feed" },
    { href: "/marketplace", label: "GQX Marketplace" },
    { href: "/leaderboard", label: "Leaderboard" },
  ]

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`block px-3 py-2 rounded-md text-base font-medium ${
            pathname === link.href
              ? "bg-green-100 text-green-800"
              : "text-gray-800 hover:bg-green-100 hover:text-green-800"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </>
  )
}

function AuthButtons({ textClass }: { textClass: string }) {
  return (
    <>
      <Button asChild variant="ghost" className={textClass}>
        <Link href="/login">Log in</Link>
      </Button>
      <Button asChild className="bg-green-600 hover:bg-green-700">
        <Link href="/signup">Sign up</Link>
      </Button>
    </>
  )
}

function MobileAuthButtons() {
  return (
    <div className="pt-4 flex flex-col space-y-2">
      <Button asChild variant="outline" className="w-full">
        <Link href="/login">Log in</Link>
      </Button>
      <Button asChild className="w-full bg-green-600 hover:bg-green-700">
        <Link href="/signup">Sign up</Link>
      </Button>
    </div>
  )
}

function UserMenu({
  user,
  signOut,
  textClass,
}: {
  user: any
  signOut: () => Promise<void>
  textClass: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
            <AvatarFallback className="bg-green-200 text-green-800">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MobileUserMenu({ user, signOut }: { user: any; signOut: () => Promise<void> }) {
  return (
    <div className="pt-4 space-y-2">
      <Link
        href="/profile"
        className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-green-100 hover:text-green-800"
      >
        <User className="inline mr-2 h-4 w-4" />
        Profile
      </Link>
      <Link
        href="/settings"
        className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-green-100 hover:text-green-800"
      >
        <Settings className="inline mr-2 h-4 w-4" />
        Settings
      </Link>
      <button
        onClick={signOut}
        className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-green-100 hover:text-green-800"
      >
        <LogOut className="inline mr-2 h-4 w-4" />
        Log out
      </button>
    </div>
  )
}
