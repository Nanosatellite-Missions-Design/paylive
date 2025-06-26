import type React from "react"
import ClientLayout from "./client-layout"
import ProtectedRoute from "@/components/protected-route"

export default function DashboardLayout({ children }: { children : React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ClientLayout>{children}</ClientLayout>
    </ProtectedRoute>
  )
}

