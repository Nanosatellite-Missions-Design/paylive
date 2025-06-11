"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { usePathname } from "next/navigation"

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith("/auth")

  useEffect(() => {
    console.log(user)
  }, [user])

  if (isAuthPage) {
    // Auth pages don't need navigation
    return <main className="min-h-screen">{children}</main>
  }

  useEffect(() => {
    if (!loading && !user) {
      console.log("humm")
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return user ? <>{children}</> : null;
}
