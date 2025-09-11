"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Video,
  Gavel,
  User,
  Settings,
  LogOut,
  ShoppingBasket,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export default function DesktopNavigation() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    {
      name: "Live",
      href: "/dashboard/lives",
      icon: Video,
    },
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: Receipt,
    },
    {
      name: "Products",
      href: "/dashboard/products",
      icon: ShoppingBasket,
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="fixed top-0 left-0 h-screen w-64 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mb-8 px-4">
        <h1 className="text-2xl font-bold text-primary">PayLive</h1>
      </div>
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm rounded-md transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={logout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
