"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, type ReactNode } from "react"

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith("/auth")

  useEffect(() => {
    console.log("User:", user)
  }, [user])

  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      console.log("Redirecting...")
      router.push("/auth/login")
    }
  }, [user, loading, router, isAuthPage])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Separate logic after hooks
  if (isAuthPage) {
    return <main className="min-h-screen">{children}</main>
  }

  return user ? <>{children}</> : null
}
