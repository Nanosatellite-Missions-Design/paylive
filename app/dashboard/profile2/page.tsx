"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Settings,
  CreditCard,
  Gavel,
  Video,
  History,
  ChevronRight,
  DollarSign,
  TrendingUp,
  BarChart3,
  Package,
  Store,
} from "lucide-react"

export default function ProfilePage() {
  const user = {
    name: "Jane Cooper",
    email: "jane@example.com",
    phone: "+1 (555) 123-4567",
    bio: "Content creator specializing in fashion and lifestyle products.",
    isCreator: true,
    avatar: "/placeholder.svg?height=100&width=100",
    joinedDate: "March 2023",
    location: "New York, NY",
    website: "https://janecooper.com",
  }

  // Mock financial data
  const financialStats = {
    currentBalance: 1247.83,
    monthlyEarnings: 892.5,
    totalEarnings: 15420.75,
    pendingPayouts: 156.2,
    totalSales: 89,
    totalPurchases: 23,
  }

  if (!user) return null

  return (
    <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">My Account</h1>
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
            <img src={user.avatar || "/placeholder-user.jpg"} alt={user.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-semibold">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <Link href="/profile/edit" className="ml-auto">
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </Link>
        </div>
      </header>

      {/* Financial Overview - Only for creators */}
      {user.isCreator && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Financial Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-gray-500">Current Balance</h3>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-600">XAF{financialStats.currentBalance.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-gray-500">This Month</h3>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">XAF{financialStats.monthlyEarnings.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-gray-500">Total Earnings</h3>
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-2xl font-bold">XAF{financialStats.totalEarnings.toFixed(2)}</p>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-500">Total Sales: {financialStats.totalSales}</span>
                  <Link href="/profile/transactions" className="text-blue-600 flex items-center">
                    Details <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Activity Summary - For non-creators */}
      {!user.isCreator && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Activity Summary</h2>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm text-gray-500 mb-1">Total Purchases</h3>
                  <p className="text-xl font-bold">{financialStats.totalPurchases}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 mb-1">Last Purchase</h3>
                  <p className="text-xl font-bold">Apr 15, 2023</p>
                </div>
              </div>
              <div className="mt-3">
                <Link href="/profile/transactions">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <History className="h-4 w-4 mr-2" />
                    Transaction History
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {user.isCreator && (
            <Link href="/profile/products">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col bg-transparent">
                <Package className="h-6 w-6 mb-2" />
                <span>My Products</span>
              </Button>
            </Link>
          )}

          {user.isCreator && (
            <Link href="/profile/catalogs">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col bg-transparent">
                <Store className="h-6 w-6 mb-2" />
                <span>My Catalogs</span>
              </Button>
            </Link>
          )}

          {user.isCreator && (
            <Link href="/profile/live-sales">
              <Button variant="outline" className="w-full h-auto py-6 flex flex-col bg-transparent">
                <Video className="h-6 w-6 mb-2" />
                <span>Live Sales</span>
              </Button>
            </Link>
          )}

          <Link href="/profile/auctions">
            <Button variant="outline" className="w-full h-auto py-6 flex flex-col bg-transparent">
              <Gavel className="h-6 w-6 mb-2" />
              <span>My Auctions</span>
            </Button>
          </Link>

          <Link href="/profile/payment-methods">
            <Button variant="outline" className="w-full h-auto py-6 flex flex-col bg-transparent">
              <CreditCard className="h-6 w-6 mb-2" />
              <span>Payment Methods</span>
            </Button>
          </Link>

          <Link href="/profile/transactions" className="col-span-2">
            <Button variant="outline" className="w-full bg-transparent">
              <History className="h-4 w-4 mr-2" />
              Transaction History
            </Button>
          </Link>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Account Settings</h2>
        </div>
        <Card>
          <CardContent className="p-0">
            <Link href="/profile/edit" className="flex items-center justify-between p-4 border-b hover:bg-gray-50">
              <div className="flex items-center">
                <Settings className="h-5 w-5 mr-3 text-gray-500" />
                <span>Edit Profile</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
            <Link
              href="/profile/payment-methods"
              className="flex items-center justify-between p-4 border-b hover:bg-gray-50"
            >
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-3 text-gray-500" />
                <span>Payment Methods</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
            <Link href="/settings" className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center">
                <Settings className="h-5 w-5 mr-3 text-gray-500" />
                <span>App Settings</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 bg-transparent">
              Log Out
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  )
}
