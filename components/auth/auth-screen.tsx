"use client"

import type React from "react"

import { useState } from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const HAWAII_HIGH_SCHOOLS = [
  "Aiea High School",
  "Baldwin High School",
  "Campbell High School",
  "Castle High School",
  "Farrington High School",
  "Hilo High School",
  "Kahuku High School",
  "Kailua High School",
  "Kaiser High School",
  "Kalaheo High School",
  "Kalani High School",
  "Kapolei High School",
  "Kauai High School",
  "King Kekaulike High School",
  "Konawaena High School",
  "Leilehua High School",
  "Maui High School",
  "McKinley High School",
  "Mililani High School",
  "Moanalua High School",
  "Pearl City High School",
  "Radford High School",
  "Roosevelt High School",
  "Waialua High School",
  "Waianae High School",
  "Waiakea High School",
  "Waipahu High School",
]

export default function AuthScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [school, setSchool] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const validateEmail = (email: string) => {
    // Check if email ends with .edu or a Hawaii high school domain
    return email.endsWith(".edu") || email.includes("@k12.hi.us")
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please use your high school email address",
        variant: "destructive",
      })
      return
    }

    if (!school) {
      toast({
        title: "School Required",
        description: "Please select your high school",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Create user profile in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        school,
        points: 0,
        createdAt: new Date(),
        badges: [],
        profileImage: null,
      })

      toast({
        title: "Account created!",
        description: "Welcome to GreenQuest",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Welcome back!",
        description: "Successfully signed in",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-green-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-green-800">GreenQuest</h1>
          <p className="text-green-600">Environmental Responsibility for Hawaii High School Students</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your high school email to sign in</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.name@school.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>Join GreenQuest with your high school email</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your.name@school.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school">High School</Label>
                    <Select value={school} onValueChange={setSchool} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your school" />
                      </SelectTrigger>
                      <SelectContent>
                        {HAWAII_HIGH_SCHOOLS.map((school) => (
                          <SelectItem key={school} value={school}>
                            {school}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
