"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Clock, ArrowUp, ArrowDown, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AuctionDetailPage({ params }: {params:any}) {
  const { id } = params
  const { toast } = useToast()

  // Mock auction data
  const auction = {
    id: Number.parseInt(id),
    title: "Vintage Camera Collection",
    description:
      "A rare collection of vintage cameras from the 1950s and 1960s. Includes 3 cameras in excellent condition with original cases and manuals.",
    currentBid: 299,
    startingPrice: 199,
    minIncrement: 10,
    endsIn: "2h 15m",
    status: "active",
    seller: "Retro Collector",
    images: [
      "/placeholder.svg?height=400&width=400",
      "/placeholder.svg?height=400&width=400",
      "/placeholder.svg?height=400&width=400",
    ],
    bids: [
      { id: 1, user: "PhotoFan", amount: 299, time: "10 minutes ago", isCurrentUser: false },
      { id: 2, user: "VintageHunter", amount: 280, time: "25 minutes ago", isCurrentUser: false },
      { id: 3, user: "CameraCollector", amount: 250, time: "1 hour ago", isCurrentUser: true },
      { id: 4, user: "RetroLover", amount: 230, time: "2 hours ago", isCurrentUser: false },
      { id: 5, user: "AnalogFan", amount: 210, time: "3 hours ago", isCurrentUser: false },
      { id: 6, user: "FirstBidder", amount: 199, time: "5 hours ago", isCurrentUser: false },
    ],
  }

  const [bidAmount, setBidAmount] = useState(auction.currentBid + auction.minIncrement)
  const [selectedImage, setSelectedImage] = useState(0)
  const [timeLeft, setTimeLeft] = useState(auction.endsIn)

  const handleBidSubmit = (e: any) => {
    e.preventDefault()

    if (bidAmount <= auction.currentBid) {
      toast({
        title: "Bid too low",
        description: `Your bid must be at least $${auction.currentBid + auction.minIncrement}.`,
        variant: "destructive",
      })
      return
    }

    // In a real app, you would submit the bid to an API
    toast({
      title: "Bid placed successfully",
      description: `You are now the highest bidder at $${bidAmount}.`,
    })

    // Update the auction data
    auction.bids.unshift({
      id: auction.bids.length + 1,
      user: "You",
      amount: bidAmount,
      time: "Just now",
      isCurrentUser: true,
    })
    auction.currentBid = bidAmount
    setBidAmount(bidAmount + auction.minIncrement)
  }

  const incrementBid = () => {
    setBidAmount(bidAmount + auction.minIncrement)
  }

  const decrementBid = () => {
    if (bidAmount > auction.currentBid + auction.minIncrement) {
      setBidAmount(bidAmount - auction.minIncrement)
    }
  }

  const isWinning = auction.bids[0]?.isCurrentUser

  return (
    <div>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
        <header className="mb-4">
          <div className="flex items-center mb-2">
            <Link href="/auctions" className="mr-2">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">{auction.title}</h1>
          </div>
        </header>

        <div className="mb-6">
          <div className="relative mb-2">
            <img
              src={auction.images[selectedImage] || "/placeholder.svg"}
              alt={auction.title}
              className="w-full aspect-square object-cover rounded-lg"
            />
            <Badge className="absolute top-2 right-2 bg-primary">
              {auction.status === "active" ? "Active" : "Ended"}
            </Badge>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {auction.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                  selectedImage === index ? "border-primary" : "border-transparent"
                }`}
              >
                <img
                  src={image || "/placeholder.svg"}
                  alt={`${auction.title} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm text-gray-500">Current bid</h3>
                  <p className="text-2xl font-bold text-primary">${auction.currentBid}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm text-gray-500">Auction ends in</h3>
                  <p className="text-lg font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-accent" />
                    <span className="text-accent">{timeLeft}</span>
                  </p>
                </div>
              </div>

              {auction.status === "active" && (
                <form onSubmit={handleBidSubmit} className="space-y-4">
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={decrementBid}
                      className="rounded-r-none"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(Number.parseFloat(e.target.value))}
                      className="rounded-none text-center"
                      min={auction.currentBid + auction.minIncrement}
                      step={auction.minIncrement}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={incrementBid}
                      className="rounded-l-none"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-gray-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Minimum bid increment: ${auction.minIncrement}
                  </div>

                  {isWinning && (
                    <div className="bg-green-50 text-green-700 p-2 rounded-md text-sm flex items-center">
                      <span className="font-medium">You're winning this auction!</span>
                    </div>
                  )}

                  <Button type="submit" className="w-full">
                    Place Bid
                  </Button>
                </form>
              )}

              {auction.status === "ended" && (
                <div className="bg-gray-50 p-4 rounded-md text-center">
                  <p className="text-gray-500">This auction has ended</p>
                  {isWinning ? (
                    <p className="font-medium text-green-600 mt-2">Congratulations! You won this auction.</p>
                  ) : (
                    <p className="font-medium text-gray-600 mt-2">Better luck next time!</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">About this auction</h2>
            <p className="text-gray-600">{auction.description}</p>
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-gray-500">Seller</p>
                <p className="font-medium">{auction.seller}</p>
              </div>
              <div>
                <p className="text-gray-500">Starting price</p>
                <p className="font-medium">${auction.startingPrice}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Bid History</h2>
            <div className="space-y-2">
              {auction.bids.map((bid) => (
                <div
                  key={bid.id}
                  className={`p-3 rounded-md flex justify-between items-center ${
                    bid.isCurrentUser ? "bg-primary/10" : "bg-gray-50"
                  }`}
                >
                  <div>
                    <p className={`font-medium ${bid.isCurrentUser ? "text-primary" : ""}`}>
                      {bid.isCurrentUser ? "You" : bid.user}
                    </p>
                    <p className="text-xs text-gray-500">{bid.time}</p>
                  </div>
                  <p className="font-bold">${bid.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
