"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Video, Gavel, User, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export default function MobileNavigation() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Live",
      href: "/live",
      icon: Video,
    },
    {
      name: "Auctions",
      href: "/auctions",
      icon: Gavel,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ]

  return (
    <nav className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-2">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center px-3 py-1 text-xs rounded-md transition-colors",
                isActive
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
              )}
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
