import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { MobileNav } from "@/components/mobile-nav"
import { FirebaseProvider } from "@/lib/firebase/firebase-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GreenQuest",
  description: "Environmental marketplace for Hawaii students",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <FirebaseProvider>
            <div className="flex flex-col min-h-screen">
              <MobileNav />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </FirebaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
