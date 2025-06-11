"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Edit, CreditCard, Package, Video, Gavel, ChevronRight, MapPin, Globe } from "lucide-react"
import AuthLayout from "@/components/auth-layout"

export default function ProfilePage() {
  // Mock user data
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

  return (
    <AuthLayout>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
        </header>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={user.avatar || "/placeholder.svg"}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                />
                {user.isCreator && <Badge className="absolute -bottom-1 -right-1 bg-secondary">Creator</Badge>}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-gray-500 text-sm">{user.email}</p>
                <p className="text-gray-500 text-xs">Member since {user.joinedDate}</p>

                {user.bio && <p className="text-sm mt-2 text-gray-600 line-clamp-2">{user.bio}</p>}

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {user.location && (
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      {user.location}
                    </div>
                  )}

                  {user.website && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Globe className="h-3 w-3 mr-1" />
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <Link href="/profile/edit">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Link href="/profile/payment-methods">
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-3 text-primary" />
                Manage Payment Methods
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>

          {user.isCreator && (
            <>
              <Link href="/profile/products">
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 mr-3 text-primary" />
                    My Products
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>

              <Link href="/profile/live-sales">
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <Video className="h-5 w-5 mr-3 text-primary" />
                    My Live Sales
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
            </>
          )}

          <Link href="/profile/auctions">
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center">
                <Gavel className="h-5 w-5 mr-3 text-primary" />
                {user.isCreator ? "My Auctions" : "Participated Auctions"}
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Activity</h2>
          <Tabs defaultValue="purchases">
            <TabsList className="w-full">
              <TabsTrigger value="purchases" className="flex-1">
                Purchases
              </TabsTrigger>
              <TabsTrigger value="auctions" className="flex-1">
                Auctions
              </TabsTrigger>
              {user.isCreator && (
                <TabsTrigger value="sales" className="flex-1">
                  Sales
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="purchases" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden">
                        <img
                          src="/placeholder.svg?height=50&width=50"
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Wireless Earbuds</h3>
                        <p className="text-sm text-gray-500">Purchased on Apr 15, 2023</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$89.99</p>
                        <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">
                          Delivered
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden">
                        <img
                          src="/placeholder.svg?height=50&width=50"
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Smart Watch</h3>
                        <p className="text-sm text-gray-500">Purchased on Mar 22, 2023</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$129.99</p>
                        <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">
                          Delivered
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="auctions" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden">
                        <img
                          src="/placeholder.svg?height=50&width=50"
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Vintage Camera</h3>
                        <p className="text-sm text-gray-500">Bid: $250.00</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-500">Won</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden">
                        <img
                          src="/placeholder.svg?height=50&width=50"
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Art Print</h3>
                        <p className="text-sm text-gray-500">Bid: $75.00</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            {user.isCreator && (
              <TabsContent value="sales" className="mt-4">
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md overflow-hidden">
                          <img
                            src="/placeholder.svg?height=50&width=50"
                            alt="Product"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">Designer Handbag</h3>
                          <p className="text-sm text-gray-500">Sold on Apr 18, 2023</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">$199.99</p>
                          <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">
                            Completed
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </AuthLayout>
  )
}
