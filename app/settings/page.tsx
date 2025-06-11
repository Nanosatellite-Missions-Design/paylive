"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Globe, Moon, Sun, LogOut } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import AuthLayout from "@/components/auth-layout"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    liveSales: true,
    auctions: true,
    messages: false,
    promotions: false,
  })

  const [language, setLanguage] = useState("en")
  const [theme, setTheme] = useState("light")
  const { toast } = useToast()

  const handleNotificationChange = (key, checked) => {
    setNotifications({
      ...notifications,
      [key]: checked,
    })

    toast({
      title: "Settings updated",
      description: `${key} notifications ${checked ? "enabled" : "disabled"}.`,
    })
  }

  const handleLanguageChange = (value) => {
    setLanguage(value)

    toast({
      title: "Language updated",
      description: "Your language preference has been updated.",
    })
  }

  const handleThemeChange = (value) => {
    setTheme(value)

    toast({
      title: "Theme updated",
      description: `Theme changed to ${value}.`,
    })
  }

  const handleLogout = () => {
    toast({
      title: "Logging out",
      description: "You have been logged out successfully.",
    })

    // In a real app, you would redirect to the login page
    setTimeout(() => {
      window.location.href = "/auth/login"
    }, 1500)
  }

  return (
    <AuthLayout>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-500">Manage your account settings and preferences</p>
        </header>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Notifications</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="liveSales" className="flex-1">
                    <span className="font-medium">Live Sales</span>
                    <p className="text-sm text-gray-500">Get notified when a creator you follow goes live</p>
                  </Label>
                  <Switch
                    id="liveSales"
                    checked={notifications.liveSales}
                    onCheckedChange={(checked) => handleNotificationChange("liveSales", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auctions" className="flex-1">
                    <span className="font-medium">Auctions</span>
                    <p className="text-sm text-gray-500">Get notified about auction updates and outbids</p>
                  </Label>
                  <Switch
                    id="auctions"
                    checked={notifications.auctions}
                    onCheckedChange={(checked) => handleNotificationChange("auctions", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="messages" className="flex-1">
                    <span className="font-medium">Messages</span>
                    <p className="text-sm text-gray-500">Get notified when you receive a new message</p>
                  </Label>
                  <Switch
                    id="messages"
                    checked={notifications.messages}
                    onCheckedChange={(checked) => handleNotificationChange("messages", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="promotions" className="flex-1">
                    <span className="font-medium">Promotions</span>
                    <p className="text-sm text-gray-500">Get notified about deals and promotional offers</p>
                  </Label>
                  <Switch
                    id="promotions"
                    checked={notifications.promotions}
                    onCheckedChange={(checked) => handleNotificationChange("promotions", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Language</h2>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Select your preferred language</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {theme === "light" ? (
                  <Sun className="h-5 w-5 text-primary" />
                ) : (
                  <Moon className="h-5 w-5 text-primary" />
                )}
                <h2 className="text-xl font-semibold">Theme</h2>
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme">Select your preferred theme</Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </AuthLayout>
  )
}
