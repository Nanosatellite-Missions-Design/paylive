"use client"

import { usePathname } from "next/navigation"
import MobileNavigation from "@/components/mobile-navigation"

export default function AuthLayout({ children }) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith("/auth")

  return (
    <>
      {children}
      {!isAuthPage && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden">
          <MobileNavigation />
        </div>
      )}
    </>
  )
}
