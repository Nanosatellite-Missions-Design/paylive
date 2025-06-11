"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  ChevronLeft,
  QrCode,
  Heart,
  ShoppingCart,
  Users,
  Send,
  Maximize,
  Minimize,
  PictureInPicture,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import QRCodeScanner from "@/components/qr-code-scanner"

export default function LiveSaleDetailPage({ params }: {params: any}) {
  const { id } = params
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPiP, setIsPiP] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: "Jane Cooper", message: "Love the new collection!", time: "2 min ago" },
    { id: 2, user: "Alex Johnson", message: "Are these available in blue?", time: "1 min ago" },
    { id: 3, user: "Sarah Williams", message: "Just ordered the t-shirt! Can't wait!", time: "Just now" },
  ])
  const [newMessage, setNewMessage] = useState("")
  const chatEndRef = useRef(null)
  const videoRef = useRef(null)
  const { toast } = useToast()

  // Mock live sale data
  const liveSale = {
    id: Number.parseInt(id),
    title: "Summer Fashion Collection",
    creator: "Style Maven",
    viewers: 1243,
    status: "active",
    featuredProduct: {
      id: 1,
      name: "Premium Cotton T-Shirt",
      price: 29.99,
      image: "/placeholder.svg?height=300&width=300",
      description: "High-quality cotton t-shirt with unique design",
    },
    products: [
      {
        id: 1,
        name: "Premium Cotton T-Shirt",
        price: 29.99,
        image: "/placeholder.svg?height=100&width=100",
      },
      {
        id: 2,
        name: "Slim Fit Jeans",
        price: 59.99,
        image: "/placeholder.svg?height=100&width=100",
      },
      {
        id: 3,
        name: "Summer Hat",
        price: 19.99,
        image: "/placeholder.svg?height=100&width=100",
      },
    ],
  }

  useEffect(() => {
    // Scroll to bottom of chat when new messages arrive
    // chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleBuyNow = () => {
    toast({
      title: "Added to cart",
      description: `${liveSale.featuredProduct.name} has been added to your cart.`,
    })
  }

  const handleAddToWishlist = () => {
    toast({
      title: "Added to wishlist",
      description: `${liveSale.featuredProduct.name} has been added to your wishlist.`,
    })
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    setIsPiP(false)
  }

  const togglePictureInPicture = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPiP(false)
      } else if (videoRef.current) {
        // await videoRef.current.requestPictureInPicture()
        setIsPiP(true)
      }
    } catch (error) {
      console.error("PiP error:", error)
      toast({
        title: "Picture-in-Picture error",
        description: "Your browser may not support this feature.",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = (e: any) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    setChatMessages([
      ...chatMessages,
      {
        id: chatMessages.length + 1,
        user: "You",
        message: newMessage,
        time: "Just now",
      },
    ])

    setNewMessage("")
  }

  const handleQRScan = (data: any) => {
    toast({
      title: "QR Code Scanned",
      description: `Product ID: ${data}`,
    })

    setShowQRScanner(false)
  }

  return (
    <div>
      <div
        className={`${isFullscreen ? "fixed inset-0 z-50 bg-black" : "container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6"}`}
      >
        {!isFullscreen && (
          <header className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Link href="/live" className="mr-2">
                  <Button variant="ghost" size="icon">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <h1 className="text-xl font-bold">{liveSale.title}</h1>
              </div>
              <Badge className="bg-red-500">LIVE</Badge>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>by {liveSale.creator}</p>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{liveSale.viewers} watching</span>
              </div>
            </div>
          </header>
        )}

        <div className={`relative mb-4 ${isFullscreen ? "h-full" : ""}`}>
          <div className={`relative ${isFullscreen ? "h-full" : "aspect-video"}`}>
            <video
              ref={videoRef}
              src="/placeholder.mp4"
              poster="/placeholder.svg?height=400&width=800"
              className={`w-full h-full object-cover ${isFullscreen ? "object-contain" : ""}`}
              controls={false}
              autoPlay
              muted
              loop
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={togglePictureInPicture}
              >
                <PictureInPicture className="h-4 w-4" />
              </Button>
              <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm" className="bg-black/50 hover:bg-black/70 text-white">
                    <QrCode className="h-4 w-4 mr-2" />
                    Scan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Scan Product QR Code</DialogTitle>
                  </DialogHeader>
                  <QRCodeScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {!isFullscreen && (
          <>
            <Tabs defaultValue="product">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="product" className="flex-1">
                  Featured Product
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex-1">
                  Live Chat
                </TabsTrigger>
                <TabsTrigger value="products" className="flex-1">
                  All Products
                </TabsTrigger>
              </TabsList>

              <TabsContent value="product">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-md overflow-hidden">
                        <img
                          src={liveSale.featuredProduct.image || "/placeholder.svg"}
                          alt={liveSale.featuredProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{liveSale.featuredProduct.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{liveSale.featuredProduct.description}</p>
                        <p className="font-bold text-lg">${liveSale.featuredProduct.price.toFixed(2)}</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={handleBuyNow}>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Buy Now
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleAddToWishlist}>
                            <Heart className="h-4 w-4 mr-2" />
                            Wishlist
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat">
                <Card>
                  <CardContent className="p-4">
                    <div className="h-60 overflow-y-auto mb-4">
                      {chatMessages.map((message) => (
                        <div key={message.id} className="mb-3">
                          <div className="flex items-start">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                              <span className="text-xs font-medium text-primary">{message.user.charAt(0)}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <p className="font-medium text-sm">{message.user}</p>
                                <span className="text-xs text-gray-500 ml-2">{message.time}</span>
                              </div>
                              <p className="text-sm">{message.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products">
                <div className="grid grid-cols-3 gap-4">
                  {liveSale.products.map((product) => (
                    <div key={product.id} className="text-center">
                      <div className="rounded-md overflow-hidden mb-2 aspect-square">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-sm font-medium truncate">{product.name}</h3>
                      <p className="text-xs text-primary font-medium">${product.price.toFixed(2)}</p>
                      <Button size="sm" variant="outline" className="mt-2 w-full text-xs">
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Buy
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
