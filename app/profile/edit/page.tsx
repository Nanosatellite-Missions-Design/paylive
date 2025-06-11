"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, Camera, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import AuthLayout from "@/components/auth-layout"

export default function EditProfilePage() {
  // Mock user data
  const [user, setUser] = useState({
    name: "Jane Cooper",
    email: "jane@example.com",
    phone: "+1 (555) 123-4567",
    bio: "Content creator specializing in fashion and lifestyle products.",
    isCreator: true,
    avatar: "/placeholder.svg?height=100&width=100",
    joinedDate: "March 2023",
    location: "New York, NY",
    website: "https://janecooper.com",
    allowMessages: true,
    showEmail: false,
    showPhone: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleChange = (field, value) => {
    setUser({
      ...user,
      [field]: value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    }, 1000)
  }

  return (
    <AuthLayout>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
        <header className="mb-6">
          <div className="flex items-center mb-4">
            <Link href="/profile" className="mr-2">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Edit Profile</h1>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
                    <img
                      src={user.avatar || "/placeholder.svg"}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-primary hover:bg-primary/90"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500">Member since {user.joinedDate}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={user.name} onChange={(e) => handleChange("name", e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={user.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={user.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="City, Country"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={user.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={user.bio}
                    onChange={(e) => handleChange("bio", e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Privacy Settings</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Allow Direct Messages</p>
                    <p className="text-sm text-gray-500">Let other users send you messages</p>
                  </div>
                  <Switch
                    checked={user.allowMessages}
                    onCheckedChange={(checked) => handleChange("allowMessages", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Email Address</p>
                    <p className="text-sm text-gray-500">Display your email on your public profile</p>
                  </div>
                  <Switch checked={user.showEmail} onCheckedChange={(checked) => handleChange("showEmail", checked)} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Phone Number</p>
                    <p className="text-sm text-gray-500">Display your phone number on your public profile</p>
                  </div>
                  <Switch checked={user.showPhone} onCheckedChange={(checked) => handleChange("showPhone", checked)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              "Saving changes..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
