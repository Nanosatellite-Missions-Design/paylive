"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LandingNavbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  function changeLanguage(locale: string) {
    document.cookie = `NEXT_LOCALE=${locale}; path=/`;
    router.refresh(); // instead of window.location.reload()
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              {/* <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PL</span>
              </div>
              <span className="text-xl font-bold text-gray-900">PayLive</span> */}
              <Image
                src="/paylive-logo.png"
                alt="PayLive"
                width={150}
                height={150}
              />
            </Link>
          </div>

          {/* Navigation Button */}
          <div className="flex gap-5 items-center">
            <Button>FR</Button>
            {loading ? (
              <div className="w-20 h-9 bg-gray-200 animate-pulse rounded-md"></div>
            ) : user ? (
              <Link href="/dashboard/lives">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
