"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Gavel } from "lucide-react"
import AuthLayout from "@/components/auth-layout"

export default function AuctionsPage() {
  // Mock auctions data
  const auctions = [
    {
      id: 1,
      title: "Vintage Camera Collection",
      currentBid: 299,
      startingPrice: 199,
      endsIn: "2h 15m",
      status: "active",
      bids: 12,
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: 2,
      title: "Limited Edition Sneakers",
      currentBid: 175,
      startingPrice: 100,
      endsIn: "45m",
      status: "active",
      bids: 8,
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: 3,
      title: "Art Print Collection",
      currentBid: 85,
      startingPrice: 50,
      endsIn: "5h 30m",
      status: "active",
      bids: 5,
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: 4,
      title: "Antique Pocket Watch",
      currentBid: 450,
      startingPrice: 300,
      endsIn: "Ended",
      status: "ended",
      bids: 15,
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: 5,
      title: "Handcrafted Leather Bag",
      currentBid: 220,
      startingPrice: 150,
      endsIn: "Ended",
      status: "ended",
      bids: 9,
      image: "/placeholder.svg?height=200&width=400",
    },
  ]

  return (
    <AuthLayout>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Auctions</h1>
          <p className="text-gray-500">Bid on unique items from your favorite creators</p>
        </header>

        <Tabs defaultValue="active">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="active" className="flex-1">
              Active
            </TabsTrigger>
            <TabsTrigger value="ending" className="flex-1">
              Ending Soon
            </TabsTrigger>
            <TabsTrigger value="ended" className="flex-1">
              Ended
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-4">
            {auctions
              .filter((auction) => auction.status === "active")
              .map((auction) => (
                <Link key={auction.id} href={`/auctions/${auction.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img
                        src={auction.image || "/placeholder.svg"}
                        alt={auction.title}
                        className="w-full h-48 object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-primary">
                        <Gavel className="h-3 w-3 mr-1" />
                        {auction.bids} bids
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{auction.title}</h3>
                      <div className="flex justify-between mt-2 text-sm">
                        <div>
                          <p className="text-gray-500">Current bid:</p>
                          <p className="font-medium text-primary">${auction.currentBid}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500">Ends in:</p>
                          <p className="font-medium flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-accent" />
                            <span className="text-accent">{auction.endsIn}</span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </TabsContent>
          <TabsContent value="ending" className="space-y-4">
            {auctions
              .filter((auction) => auction.status === "active" && auction.endsIn.includes("m"))
              .map((auction) => (
                <Link key={auction.id} href={`/auctions/${auction.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img
                        src={auction.image || "/placeholder.svg"}
                        alt={auction.title}
                        className="w-full h-48 object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-red-500">Ending Soon</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{auction.title}</h3>
                      <div className="flex justify-between mt-2 text-sm">
                        <div>
                          <p className="text-gray-500">Current bid:</p>
                          <p className="font-medium text-primary">${auction.currentBid}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500">Ends in:</p>
                          <p className="font-medium flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-red-500" />
                            <span className="text-red-500">{auction.endsIn}</span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </TabsContent>
          <TabsContent value="ended" className="space-y-4">
            {auctions
              .filter((auction) => auction.status === "ended")
              .map((auction) => (
                <Link key={auction.id} href={`/auctions/${auction.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img
                        src={auction.image || "/placeholder.svg"}
                        alt={auction.title}
                        className="w-full h-48 object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-gray-500">Ended</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{auction.title}</h3>
                      <div className="flex justify-between mt-2 text-sm">
                        <div>
                          <p className="text-gray-500">Final bid:</p>
                          <p className="font-medium">${auction.currentBid}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500">Total bids:</p>
                          <p className="font-medium">{auction.bids}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </AuthLayout>
  )
}
