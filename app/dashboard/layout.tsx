import type React from "react"
import { Inter } from "next/font/google"
import ClientLayout from "./client-layout"
import "./globals.css"
import ProtectedRoute from "@/components/protected-route"


const inter = Inter({ subsets: ["latin"] })

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: { children : React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ClientLayout>{children}</ClientLayout>
    </ProtectedRoute>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
