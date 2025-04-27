"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/lib/firebase/auth-context"
import { useMarketplaceFirestore } from "@/lib/firebase/firestore"
import { useUserFirestore } from "@/lib/firebase/firestore"
import { ImageUpload } from "@/components/image-upload"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  price: z.coerce.number().min(0, {
    message: "Price must be a positive number.",
  }),
  condition: z.string({
    required_error: "Please select a condition.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  meetupLocation: z.string().min(3, {
    message: "Please specify a meetup location.",
  }),
})

export default function CreateListingPage() {
  const { user } = useAuth()
  const marketplaceFirestore = useMarketplaceFirestore()
  const userFirestore = useUserFirestore()
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      price: 0,
      condition: "",
      description: "",
      meetupLocation: "School Cafeteria",
    },
  })

  const handleImageUploaded = (url: string) => {
    setImageUrl(url)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to create a listing.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setIsSubmitting(true)

    try {
      // Get user profile to get school
      let userProfile
      try {
        userProfile = await userFirestore.getUserProfile(user.uid)
      } catch (profileError) {
        console.error("Error fetching user profile:", profileError)
        userProfile = null
      }

      // Create the listing in Firestore
      await marketplaceFirestore.createListing(user.uid, {
        title: values.title,
        price: values.price,
        condition: values.condition,
        description: values.description,
        meetupLocation: values.meetupLocation,
        imageUrl: imageUrl,
        school: userProfile?.school || "Not specified",
        sellerName: user.displayName || "Anonymous",
        sellerAvatar: user.photoURL || "",
      })

      // Award points for creating a listing
      try {
        await userFirestore.updateUserPoints(user.uid, 10)
      } catch (pointsError) {
        console.error("Error updating points:", pointsError)
        // Continue even if points update fails
      }

      toast({
        title: "Listing created successfully!",
        description: "Your item has been listed on the marketplace.",
      })

      // Redirect to marketplace
      router.push("/marketplace")
    } catch (error) {
      console.error("Error creating listing:", error)
      toast({
        title: "Error creating listing",
        description: "There was a problem creating your listing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <AppHeader showBack title="List an Item" />

      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-6">
              {user && <ImageUpload onImageUploaded={handleImageUploaded} userId={user.uid} type="marketplace" />}
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Biology Textbook (10th Grade)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value)} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Like New">Like New</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your item, including any details about its condition, features, etc."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meetupLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meetup Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., School Cafeteria" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
              {isSubmitting ? "Creating Listing..." : "List Item"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
