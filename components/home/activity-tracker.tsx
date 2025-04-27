"use client"

import { useState } from "react"
import { doc, updateDoc, increment, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const ACTIVITIES = [
  { id: "reusable_bottle", label: "Used reusable water bottle", points: 5 },
  { id: "public_transport", label: "Used public transportation", points: 10 },
  { id: "recycling", label: "Recycled materials", points: 5 },
  { id: "local_food", label: "Ate locally sourced food", points: 8 },
  { id: "energy_saving", label: "Reduced energy consumption", points: 7 },
]

interface ActivityTrackerProps {
  setUserPoints: (points: number) => void
}

export default function ActivityTracker({ setUserPoints }: ActivityTrackerProps) {
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleActivityToggle = (activityId: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId) ? prev.filter((id) => id !== activityId) : [...prev, activityId],
    )
  }

  const calculatePoints = () => {
    return ACTIVITIES.filter((activity) => selectedActivities.includes(activity.id)).reduce(
      (total, activity) => total + activity.points,
      0,
    )
  }

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to track activities",
        variant: "destructive",
      })
      return
    }

    if (selectedActivities.length === 0) {
      toast({
        title: "No activities selected",
        description: "Please select at least one activity",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const userId = auth.currentUser.uid
      const userRef = doc(db, "users", userId)
      const pointsToAdd = calculatePoints()

      // Update user points in Firestore
      await updateDoc(userRef, {
        points: increment(pointsToAdd),
        [`activities.${new Date().toISOString().split("T")[0]}`]: selectedActivities,
      })

      // Get updated user data
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        setUserPoints(userDoc.data().points || 0)
      }

      toast({
        title: "Activities logged!",
        description: `You earned ${pointsToAdd} points`,
      })

      setSelectedActivities([])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {ACTIVITIES.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-2">
            <Checkbox
              id={activity.id}
              checked={selectedActivities.includes(activity.id)}
              onCheckedChange={() => handleActivityToggle(activity.id)}
            />
            <Label htmlFor={activity.id} className="flex-1">
              {activity.label} <span className="text-green-600">+{activity.points}</span>
            </Label>
          </div>
        ))}
      </div>

      {selectedActivities.length > 0 && (
        <div className="rounded-md bg-green-50 p-2 text-center text-sm text-green-700">
          You'll earn {calculatePoints()} points for these activities
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={selectedActivities.length === 0 || isSubmitting}
        variant="outline"
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Log Activities"}
      </Button>
    </div>
  )
}
