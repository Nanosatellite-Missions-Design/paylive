"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User, AuthContextType, SignupData } from "@/types/auth"
import { useToast } from "@/components/ui/use-toast"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const isAuthenticated = !!user

  // Check if current route is an auth route
  const isAuthRoute = pathname.startsWith("/auth")

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus()
  }, [])

  useEffect(() => {
    // Redirect logic
    if (!isLoading) {
      if (!isAuthenticated && !isAuthRoute) {
        router.push("/auth/login")
      } else if (isAuthenticated && isAuthRoute) {
        router.push("/")
      }
    }
  }, [isAuthenticated, isAuthRoute, isLoading, router])

  const checkAuthStatus = async () => {
    try {
      // Check localStorage for existing session
      const storedUser = localStorage.getItem("paylive_user")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error("Error checking auth status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock user data - in real app, this would come from API
      const mockUser: User = {
        id: "1",
        name: "Jane Cooper",
        email: email,
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
      }

      setUser(mockUser)
      localStorage.setItem("paylive_user", JSON.stringify(mockUser))

      toast({
        title: "Login successful",
        description: "Welcome back to PayLive!",
      })
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (userData: SignupData): Promise<void> => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock user creation
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        bio: "",
        isCreator: userData.isCreator,
        avatar: "/placeholder.svg?height=100&width=100",
        joinedDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        }),
        location: "",
        website: "",
        allowMessages: true,
        showEmail: false,
        showPhone: false,
      }

      setUser(newUser)
      localStorage.setItem("paylive_user", JSON.stringify(newUser))

      toast({
        title: "Account created",
        description: "Welcome to PayLive!",
      })
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("paylive_user")
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    })
    router.push("/auth/login")
  }

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    if (!user) return

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem("paylive_user", JSON.stringify(updatedUser))

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
