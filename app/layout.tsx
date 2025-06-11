import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import DesktopNavigation from "@/components/desktop-navigation"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <div className="flex min-h-screen">
            <div className="hidden md:flex">
              <DesktopNavigation />
            </div>
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
