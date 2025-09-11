"use client";

import type React from "react";

import { usePathname } from "next/navigation";
import DesktopNavigation from "@/components/desktop-navigation";
import MobileNavigation from "@/components/mobile-navigation";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");

  if (isAuthPage) {
    // Auth pages don't need navigation
    return <main className="min-h-screen">{children}</main>;
  }

  // Protected pages with navigation
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <DesktopNavigation />
      </div>
      <main className="flex-1 pb-16 md:pb-0 md:ml-64">{children}</main>
      <div className="fixed bottom-0 left-0 right-0 md:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
}

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return <LayoutContent>{children}</LayoutContent>;
}
