"use client"

import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Clock, TrendingUp, Star } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <ProtectedRoute>
      <div className="container max-w-lg mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Welcome to PayLive</h1>
          <p className="text-gray-500">Discover live sales and auctions from your favorite creators</p>
        </header>

        <Tabs defaultValue="live" className="mb-6">
          <TabsList className="w-full">
            <TabsTrigger value="live" className="flex-1">
              Live Now
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex-1">
              Trending
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex-1">
              Featured
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4">
            <Link href="/live/1">
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src="/placeholder.svg?height=200&width=400"
                    alt="Live Sale"
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-2 right-2 bg-red-500">Live Now</Badge>
                  <Badge className="absolute bottom-2 left-2 bg-black/70">
                    <Users className="h-3 w-3 mr-1" />
                    1,243 watching
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold">Summer Fashion Collection</h3>
                  <p className="text-sm text-gray-500 mt-1">Jane Cooper • Fashion & Lifestyle</p>
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                    <span>8 products featured</span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Started 2h ago
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            <Card className="overflow-hidden">
              <div className="relative">
                <img src="/placeholder.svg?height=200&width=400" alt="Trending" className="w-full h-48 object-cover" />
                <Badge className="absolute top-2 right-2 bg-orange-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Trending
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold">Tech Gadgets Flash Sale</h3>
                <p className="text-sm text-gray-500 mt-1">Mike Johnson • Electronics</p>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                  <span>12 products</span>
                  <span>Starts in 2 hours</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="featured" className="space-y-4">
            <Card className="overflow-hidden">
              <div className="relative">
                <img src="/placeholder.svg?height=200&width=400" alt="Featured" className="w-full h-48 object-cover" />
                <Badge className="absolute top-2 right-2 bg-yellow-500">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold">Home Decor Showcase</h3>
                <p className="text-sm text-gray-500 mt-1">Sarah Wilson • Home & Garden</p>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                  <span>15 products</span>
                  <span>Tomorrow at 6 PM</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/live">
            <Button variant="outline" className="w-full h-20 flex flex-col">
              <Users className="h-6 w-6 mb-2" />
              <span>Live Sales</span>
            </Button>
          </Link>
          <Link href="/auctions">
            <Button variant="outline" className="w-full h-20 flex flex-col">
              <Clock className="h-6 w-6 mb-2" />
              <span>Auctions</span>
            </Button>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  )
}
