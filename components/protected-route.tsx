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
    if (!loading && !user && !isAuthPage) {
      router.replace("/auth/login")
    }
  }, [user, loading, isAuthPage, router])

  // ✅ Don’t show the global spinner on auth pages
  if (loading && !isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    )
  }

  return <>{children}</>
}
