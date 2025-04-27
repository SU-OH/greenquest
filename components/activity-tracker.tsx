"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Car, Droplet, Utensils, Lightbulb, Recycle, ShoppingBag } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/firebase/auth-context"
import { useActivityFirestore } from "@/lib/firebase/firestore"
import { useUserFirestore } from "@/lib/firebase/firestore"

export function ActivityTracker() {
  const { user } = useAuth()
  const activityFirestore = useActivityFirestore()
  const userFirestore = useUserFirestore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for each activity type
  const [transportationValue, setTransportationValue] = useState("bus")
  const [showerLength, setShowerLength] = useState(5)
  const [waterBottle, setWaterBottle] = useState(false)
  const [waterOff, setWaterOff] = useState(false)
  const [foodChoice, setFoodChoice] = useState("vegetarian")
  const [lightsOff, setLightsOff] = useState(false)
  const [naturalLight, setNaturalLight] = useState(false)
  const [unplugElectronics, setUnplugElectronics] = useState(false)
  const [useFan, setUseFan] = useState(false)
  const [recycled, setRecycled] = useState(false)
  const [composted, setComposted] = useState(false)
  const [reusableContainer, setReusableContainer] = useState(false)
  const [refusedItems, setRefusedItems] = useState(false)
  const [shoppingChoice, setShoppingChoice] = useState("secondhand")

  const getPointsForActivity = (category: string, value: any): number => {
    switch (category) {
      case "transportation":
        switch (value) {
          case "bus":
            return 10
          case "bike":
            return 15
          case "carpool":
            return 5
          case "car":
            return 0
          default:
            return 0
        }
      case "water":
        let waterPoints = 0
        // Points for shorter showers
        if (showerLength <= 3) waterPoints += 15
        else if (showerLength <= 5) waterPoints += 10
        else if (showerLength <= 8) waterPoints += 5

        // Additional points for other water-saving activities
        if (waterBottle) waterPoints += 5
        if (waterOff) waterPoints += 5

        return waterPoints
      case "food":
        switch (value) {
          case "vegan":
            return 15
          case "vegetarian":
            return 10
          case "local":
            return 5
          case "standard":
            return 0
          default:
            return 0
        }
      case "energy":
        let energyPoints = 0
        if (lightsOff) energyPoints += 5
        if (naturalLight) energyPoints += 5
        if (unplugElectronics) energyPoints += 5
        if (useFan) energyPoints += 10
        return energyPoints
      case "waste":
        let wastePoints = 0
        if (recycled) wastePoints += 5
        if (composted) wastePoints += 10
        if (reusableContainer) wastePoints += 5
        if (refusedItems) wastePoints += 5
        return wastePoints
      case "shopping":
        switch (value) {
          case "secondhand":
            return 15
          case "eco-friendly":
            return 10
          case "local-business":
            return 5
          case "no-purchase":
            return 5
          default:
            return 0
        }
      default:
        return 0
    }
  }

  const handleSubmit = async (category: string) => {
    if (!user) return

    setIsSubmitting(true)

    try {
      // Determine the value and points based on the category
      let activityValue
      let points = 0

      switch (category) {
        case "transportation":
          activityValue = transportationValue
          points = getPointsForActivity(category, activityValue)
          break
        case "water":
          activityValue = { showerLength, waterBottle, waterOff }
          points = getPointsForActivity(category, activityValue)
          break
        case "food":
          activityValue = foodChoice
          points = getPointsForActivity(category, activityValue)
          break
        case "energy":
          activityValue = { lightsOff, naturalLight, unplugElectronics, useFan }
          points = getPointsForActivity(category, activityValue)
          break
        case "waste":
          activityValue = { recycled, composted, reusableContainer, refusedItems }
          points = getPointsForActivity(category, activityValue)
          break
        case "shopping":
          activityValue = shoppingChoice
          points = getPointsForActivity(category, activityValue)
          break
      }

      // Log the activity in Firestore
      await activityFirestore.logActivity(user.uid, {
        category,
        value: activityValue,
        points,
        carbonSaved: calculateCarbonSaved(category, activityValue),
      })

      // Update user points
      await userFirestore.updateUserPoints(user.uid, points)

      toast({
        title: "Activity logged successfully!",
        description: `Your ${category} activity has been recorded and ${points} points added to your account.`,
      })
    } catch (error) {
      console.error("Error logging activity:", error)
      toast({
        title: "Error logging activity",
        description: "There was a problem recording your activity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Simple function to estimate carbon savings
  const calculateCarbonSaved = (category: string, value: any): number => {
    // This would be a more complex calculation in a real app
    // For now, we'll use simplified estimates
    switch (category) {
      case "transportation":
        switch (value) {
          case "bus":
            return 2.5 // kg CO2
          case "bike":
            return 4.0
          case "carpool":
            return 1.5
          case "car":
            return 0
          default:
            return 0
        }
      case "water":
        let waterSavings = 0
        if (typeof value === "object") {
          // Shower length savings
          if (value.showerLength <= 3) waterSavings += 1.5
          else if (value.showerLength <= 5) waterSavings += 1.0
          else if (value.showerLength <= 8) waterSavings += 0.5

          // Other water savings
          if (value.waterBottle) waterSavings += 0.5
          if (value.waterOff) waterSavings += 0.3
        }
        return waterSavings
      // Add other categories with similar logic
      default:
        return 0
    }
  }

  return (
    <Tabs defaultValue="transportation">
      <TabsList className="grid grid-cols-3 md:grid-cols-6">
        <TabsTrigger value="transportation" className="flex flex-col items-center gap-1 py-2">
          <Car className="h-4 w-4" />
          <span className="text-xs">Transport</span>
        </TabsTrigger>
        <TabsTrigger value="water" className="flex flex-col items-center gap-1 py-2">
          <Droplet className="h-4 w-4" />
          <span className="text-xs">Water</span>
        </TabsTrigger>
        <TabsTrigger value="food" className="flex flex-col items-center gap-1 py-2">
          <Utensils className="h-4 w-4" />
          <span className="text-xs">Food</span>
        </TabsTrigger>
        <TabsTrigger value="energy" className="flex flex-col items-center gap-1 py-2">
          <Lightbulb className="h-4 w-4" />
          <span className="text-xs">Energy</span>
        </TabsTrigger>
        <TabsTrigger value="waste" className="flex flex-col items-center gap-1 py-2">
          <Recycle className="h-4 w-4" />
          <span className="text-xs">Waste</span>
        </TabsTrigger>
        <TabsTrigger value="shopping" className="flex flex-col items-center gap-1 py-2">
          <ShoppingBag className="h-4 w-4" />
          <span className="text-xs">Shopping</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="transportation" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Transportation</CardTitle>
            <CardDescription>How did you get around today?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup defaultValue="bus" value={transportationValue} onValueChange={setTransportationValue}>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="bus" id="bus" />
                <Label htmlFor="bus">Public Transportation (+10 points)</Label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="bike" id="bike" />
                <Label htmlFor="bike">Biking or Walking (+15 points)</Label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="carpool" id="carpool" />
                <Label htmlFor="carpool">Carpooling (+5 points)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="car" id="car" />
                <Label htmlFor="car">Personal Vehicle (0 points)</Label>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleSubmit("transportation")}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Logging..." : "Log Activity"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="water" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Water Usage</CardTitle>
            <CardDescription>How much water did you save today?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Shower Length (minutes)</Label>
                <span className="text-sm font-medium">{showerLength} min</span>
              </div>
              <Slider
                defaultValue={[5]}
                value={[showerLength]}
                onValueChange={(value) => setShowerLength(value[0])}
                max={20}
                step={1}
              />
              <p className="text-xs text-muted-foreground">Shorter showers save water and energy</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="water-bottle">Used reusable water bottle</Label>
                <p className="text-xs text-muted-foreground">Avoided single-use plastic bottles</p>
              </div>
              <Switch id="water-bottle" checked={waterBottle} onCheckedChange={setWaterBottle} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="water-off">Turned off water while brushing teeth</Label>
                <p className="text-xs text-muted-foreground">Saves up to 8 gallons per day</p>
              </div>
              <Switch id="water-off" checked={waterOff} onCheckedChange={setWaterOff} />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleSubmit("water")}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Logging..." : "Log Activity"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="food" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Food Choices</CardTitle>
            <CardDescription>What did you eat today?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup defaultValue="vegetarian" value={foodChoice} onValueChange={setFoodChoice}>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="vegan" id="vegan" />
                <Label htmlFor="vegan">Plant-based meals all day (+15 points)</Label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="vegetarian" id="vegetarian" />
                <Label htmlFor="vegetarian">Vegetarian meals (+10 points)</Label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="local" id="local" />
                <Label htmlFor="local">Locally sourced food (+5 points)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard">Standard diet (0 points)</Label>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleSubmit("food")}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Logging..." : "Log Activity"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="energy" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Energy Usage</CardTitle>
            <CardDescription>How did you conserve energy today?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="lights-off">Turned off lights when not in use</Label>
                <p className="text-xs text-muted-foreground">Saves electricity and reduces carbon emissions</p>
              </div>
              <Switch id="lights-off" checked={lightsOff} onCheckedChange={setLightsOff} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="natural-light">Used natural light instead of artificial</Label>
                <p className="text-xs text-muted-foreground">Reduces energy consumption</p>
              </div>
              <Switch id="natural-light" checked={naturalLight} onCheckedChange={setNaturalLight} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="unplug">Unplugged electronics when not in use</Label>
                <p className="text-xs text-muted-foreground">Eliminates phantom energy usage</p>
              </div>
              <Switch id="unplug" checked={unplugElectronics} onCheckedChange={setUnplugElectronics} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ac-fan">Used fan instead of air conditioning</Label>
                <p className="text-xs text-muted-foreground">Significantly reduces energy consumption</p>
              </div>
              <Switch id="ac-fan" checked={useFan} onCheckedChange={setUseFan} />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleSubmit("energy")}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Logging..." : "Log Activity"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="waste" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Waste Management</CardTitle>
            <CardDescription>How did you reduce waste today?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="recycled">Recycled paper, plastic, glass, or metal</Label>
                <p className="text-xs text-muted-foreground">Diverts waste from landfills</p>
              </div>
              <Switch id="recycled" checked={recycled} onCheckedChange={setRecycled} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compost">Composted food waste</Label>
                <p className="text-xs text-muted-foreground">Reduces methane emissions from landfills</p>
              </div>
              <Switch id="compost" checked={composted} onCheckedChange={setComposted} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reusable-container">Used reusable containers for lunch/snacks</Label>
                <p className="text-xs text-muted-foreground">Eliminates single-use packaging waste</p>
              </div>
              <Switch id="reusable-container" checked={reusableContainer} onCheckedChange={setReusableContainer} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="refuse">Refused unnecessary items (straws, bags, etc.)</Label>
                <p className="text-xs text-muted-foreground">Prevents waste at the source</p>
              </div>
              <Switch id="refuse" checked={refusedItems} onCheckedChange={setRefusedItems} />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleSubmit("waste")}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Logging..." : "Log Activity"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="shopping" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Shopping Habits</CardTitle>
            <CardDescription>How sustainable were your purchases?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup defaultValue="secondhand" value={shoppingChoice} onValueChange={setShoppingChoice}>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="secondhand" id="secondhand" />
                <Label htmlFor="secondhand">Bought/sold secondhand items on GQX (+15 points)</Label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="eco-friendly" id="eco-friendly" />
                <Label htmlFor="eco-friendly">Purchased eco-friendly products (+10 points)</Label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <RadioGroupItem value="local-business" id="local-business" />
                <Label htmlFor="local-business">Supported local businesses (+5 points)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no-purchase" id="no-purchase" />
                <Label htmlFor="no-purchase">Made no unnecessary purchases today (+5 points)</Label>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleSubmit("shopping")}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Logging..." : "Log Activity"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
