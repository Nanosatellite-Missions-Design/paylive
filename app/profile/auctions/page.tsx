"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Clock } from "lucide-react"

export default function ParticipatedAuctionsPage() {
  // Mock auctions data
  const [auctions, setAuctions] = useState([
    {
      id: 1,
      title: "Vintage Camera Collection",
      currentBid: 299,
      yourBid: 250,
      endsIn: "2h 15m",
      status: "active",
      position: "outbid",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 2,
      title: "Limited Edition Sneakers",
      currentBid: 175,
      yourBid: 175,
      endsIn: "45m",
      status: "active",
      position: "winning",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 3,
      title: "Art Print Collection",
      currentBid: 85,
      yourBid: 75,
      endsIn: "5h 30m",
      status: "active",
      position: "outbid",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 4,
      title: "Antique Pocket Watch",
      currentBid: 450,
      yourBid: 450,
      endsIn: "Ended",
      status: "ended",
      position: "won",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 5,
      title: "Handcrafted Leather Bag",
      currentBid: 220,
      yourBid: 200,
      endsIn: "Ended",
      status: "ended",
      position: "lost",
      image: "/placeholder.svg?height=100&width=100",
    },
  ])

  const getPositionBadge = (position: any) => {
    switch (position) {
      case "winning":
        return <Badge className="bg-green-500">Winning</Badge>
      case "outbid":
        return <Badge className="bg-red-500">Outbid</Badge>
      case "won":
        return <Badge className="bg-green-500">Won</Badge>
      case "lost":
        return <Badge className="bg-gray-500">Lost</Badge>
      default:
        return null
    }
  }

  return (
    <div>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
        <header className="mb-6">
          <div className="flex items-center mb-4">
            <Link href="/profile" className="mr-2">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">My Auctions</h1>
          </div>
          <p className="text-gray-500">Track your auction participation and bids</p>
        </header>

        <Tabs defaultValue="all">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1">
              Active
            </TabsTrigger>
            <TabsTrigger value="won" className="flex-1">
              Won
            </TabsTrigger>
            <TabsTrigger value="lost" className="flex-1">
              Lost
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {auctions.map((auction) => (
              <Link key={auction.id} href={`/auctions/${auction.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-md overflow-hidden">
                        <img
                          src={auction.image || "/placeholder.svg"}
                          alt={auction.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{auction.title}</h3>
                          {getPositionBadge(auction.position)}
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                          <div>
                            <p className="text-gray-500">Your bid:</p>
                            <p className="font-medium">${auction.yourBid}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500">Current bid:</p>
                            <p className="font-medium">${auction.currentBid}</p>
                          </div>
                        </div>
                        {auction.status === "active" && (
                          <div className="mt-2 text-sm flex items-center text-accent">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>Ends in: {auction.endsIn}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {auctions
              .filter((auction) => auction.status === "active")
              .map((auction) => (
                <Link key={auction.id} href={`/auctions/${auction.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-md overflow-hidden">
                          <img
                            src={auction.image || "/placeholder.svg"}
                            alt={auction.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{auction.title}</h3>
                            {getPositionBadge(auction.position)}
                          </div>
                          <div className="flex justify-between mt-2 text-sm">
                            <div>
                              <p className="text-gray-500">Your bid:</p>
                              <p className="font-medium">${auction.yourBid}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-500">Current bid:</p>
                              <p className="font-medium">${auction.currentBid}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-sm flex items-center text-accent">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>Ends in: {auction.endsIn}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </TabsContent>

          <TabsContent value="won" className="space-y-4">
            {auctions
              .filter((auction) => auction.position === "won")
              .map((auction) => (
                <Link key={auction.id} href={`/auctions/${auction.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-md overflow-hidden">
                          <img
                            src={auction.image || "/placeholder.svg"}
                            alt={auction.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{auction.title}</h3>
                            <Badge className="bg-green-500">Won</Badge>
                          </div>
                          <div className="flex justify-between mt-2 text-sm">
                            <div>
                              <p className="text-gray-500">Your bid:</p>
                              <p className="font-medium">${auction.yourBid}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-500">Final price:</p>
                              <p className="font-medium">${auction.currentBid}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </TabsContent>

          <TabsContent value="lost" className="space-y-4">
            {auctions
              .filter((auction) => auction.position === "lost")
              .map((auction) => (
                <Link key={auction.id} href={`/auctions/${auction.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-md overflow-hidden">
                          <img
                            src={auction.image || "/placeholder.svg"}
                            alt={auction.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{auction.title}</h3>
                            <Badge className="bg-gray-500">Lost</Badge>
                          </div>
                          <div className="flex justify-between mt-2 text-sm">
                            <div>
                              <p className="text-gray-500">Your bid:</p>
                              <p className="font-medium">${auction.yourBid}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-500">Final price:</p>
                              <p className="font-medium">${auction.currentBid}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
