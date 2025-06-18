"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { getASubDocument } from "@/functions/get-a-document"
import { useAuth } from "@/contexts/auth-context";
import { listenToSubCollection } from "@/functions/get-a-sub-collection";
import { addToSubCollection } from "@/functions/add-to-a-sub-collection"
import { formatDistanceToNow } from "date-fns";

export default function LiveSaleDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { lives, userInfo } = useAuth()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPiP, setIsPiP] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const chatEndRef = useRef(null)
  const videoRef = useRef(null)
  const { toast } = useToast()
  const [liveSale, setLiveSale] = useState<any>({})
  const [liveProducts, setLiveProducts] = useState<any[]>([])
  const [featuredProduct, setFeaturedProduct] = useState<any>(null)

  useEffect(() => {
    const currentLive = lives.find((live: any) => live.id === id)
      setLiveSale(currentLive)
    }, [id, lives])

  useEffect(() => {
    if (!liveSale?.products || !Array.isArray(liveSale?.products)) return;

    const unsubscribes: (() => void)[] = [];
    const productMap = new Map<string, any>(); // To keep track of real-time updates

    const handleProductUpdate = (productId: string, data: any | null) => {
      if (data) {
        productMap.set(productId, data);
      } else {
        productMap.delete(productId); // remove if deleted
      }

      // Update state
      setLiveProducts(Array.from(productMap.values()));
    };

    liveSale?.products.forEach((productId: string) => {
      const unsubscribe = getASubDocument(
        liveSale?.creatorId,
        "products",
        productId,
        (data) => handleProductUpdate(productId, data)
      );

      if (unsubscribe) {
        unsubscribes.push(unsubscribe);
      }
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [liveSale?.products, liveSale?.creatorId]);

  useEffect(() => {
    const currentFeaturedProduct = liveProducts.find((product: any) => product.id === liveSale?.currentFeaturedProduct)
    console.log(currentFeaturedProduct)
    setFeaturedProduct(currentFeaturedProduct)
  }, [liveProducts])

  useEffect(() => {
    const unsubscribeLiveChat =
      listenToSubCollection(
        "lives",
        liveSale?.id,
        "chatMessages",
        setChatMessages
      ) ?? (() => {});

    return () => {
      unsubscribeLiveChat();
    };
  }, [liveSale])


  const handleBuyNow = () => {
    if(!userInfo?.paymentMethods) {
      router.push("/profile/payment-methods")
    }
    toast({
      title: "Added to cart",
      description: `${liveSale?.featuredProduct.name} has been added to your cart.`,
    })
  }

  const handleAddToWishlist = () => {
    toast({
      title: "Added to wishlist",
      description: `${liveSale?.featuredProduct.name} has been added to your wishlist.`,
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

  const handleSendMessage = async (e: any) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    const newMessageDatas = {
      userId: userInfo.uid,
      userName: userInfo.name,
      message: newMessage,
    }

    await addToSubCollection(newMessageDatas, "lives", liveSale.id, "chatMessages")
    
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
                <h1 className="text-xl font-bold">{liveSale?.title}</h1>
              </div>
              <Badge className="bg-red-500">LIVE</Badge>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>by {liveSale?.creatorName}</p>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{liveSale?.viewers} watching</span>
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
                {featuredProduct && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-md overflow-hidden">
                          <img
                            src={featuredProduct.image || "/placeholder.svg"}
                            alt={featuredProduct.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{featuredProduct.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">{featuredProduct.description}</p>
                          <p className="font-bold text-lg">XAF{featuredProduct.price}</p>
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
                )}
              </TabsContent>

              <TabsContent value="chat">
                <Card>
                  <CardContent className="p-4">
                    <div className="h-60 overflow-y-auto mb-4">
                      {chatMessages.map((message) => (
                        <div key={message.id} className="mb-3">
                          <div className="flex items-start">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                              <span className="text-xs font-medium text-primary">{message.userName?.charAt(0)}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <p className="font-medium text-sm">{message.userName}</p>
                                <span className="text-xs text-gray-500 ml-2">
                                  {formatDistanceToNow(
                                    message.createdAt?.toDate
                                      ? message.createdAt.toDate()
                                      : new Date(message.updatedAt),
                                    { addSuffix: true }
                                  )}
                                </span>
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
                  {liveProducts.map((product) => (
                    <div key={product.id} className="text-center">
                      <div className="rounded-md overflow-hidden mb-2 aspect-square">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-sm font-medium truncate">{product.name}</h3>
                      <p className="text-xs text-primary font-medium">XAF{product.price.toFixed(2)}</p>
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
