"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Plus, Video, Calendar, Clock, Users, Play, Pause, Package } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import AuthLayout from "@/components/auth-layout"

export default function LiveSalesManagementPage() {
  const [liveSales, setLiveSales] = useState([
    {
      id: 1,
      title: "Summer Fashion Collection",
      status: "active",
      scheduledFor: "Now",
      startedAt: "2 hours ago",
      viewers: 1243,
      products: [
        { id: 1, name: "Premium Cotton T-Shirt", price: 29.99, featured: true },
        { id: 2, name: "Slim Fit Jeans", price: 59.99, featured: false },
        { id: 3, name: "Summer Hat", price: 19.99, featured: false },
      ],
      description: "Showcasing our latest summer fashion collection with exclusive discounts!",
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: 2,
      title: "Tech Gadgets Flash Sale",
      status: "scheduled",
      scheduledFor: "Apr 30, 2023 - 7:00 PM",
      startedAt: "",
      viewers: 0,
      products: [
        { id: 4, name: "Wireless Earbuds", price: 89.99, featured: false },
        { id: 5, name: "Smart Watch", price: 129.99, featured: false },
        { id: 6, name: "Bluetooth Speaker", price: 79.99, featured: false },
      ],
      description: "Flash sale on the latest tech gadgets with up to 30% off!",
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: 3,
      title: "Home Decor Showcase",
      status: "ended",
      scheduledFor: "Apr 15, 2023 - 6:00 PM",
      startedAt: "Apr 15, 2023",
      viewers: 876,
      products: [
        { id: 7, name: "Decorative Pillows", price: 24.99, featured: false },
        { id: 8, name: "Wall Art Print", price: 39.99, featured: false },
        { id: 9, name: "Table Lamp", price: 49.99, featured: false },
      ],
      description: "Discover our new home decor collection for spring!",
      image: "/placeholder.svg?height=200&width=400",
    },
  ])

  const [isCreatingLiveSale, setIsCreatingLiveSale] = useState(false)
  const [selectedLiveSale, setSelectedLiveSale] = useState(null)
  const [showProductsDialog, setShowProductsDialog] = useState(false)
  const { toast } = useToast()

  const handleCreateLiveSale = (e) => {
    e.preventDefault()

    // In a real app, you would validate and process the form data
    const newLiveSale = {
      id: liveSales.length + 1,
      title: "New Live Sale",
      status: "scheduled",
      scheduledFor: "May 5, 2023 - 8:00 PM",
      startedAt: "",
      viewers: 0,
      products: [],
      description: "Description for the new live sale",
      image: "/placeholder.svg?height=200&width=400",
    }

    setLiveSales([newLiveSale, ...liveSales])
    setIsCreatingLiveSale(false)

    toast({
      title: "Live sale created",
      description: "Your new live sale has been scheduled successfully.",
    })
  }

  const handleStartLiveSale = (id) => {
    setLiveSales(
      liveSales.map((sale) => {
        if (sale.id === id) {
          return {
            ...sale,
            status: "active",
            scheduledFor: "Now",
            startedAt: "Just now",
          }
        }
        return sale
      }),
    )

    toast({
      title: "Live sale started",
      description: "Your live sale has started successfully.",
    })
  }

  const handleEndLiveSale = (id) => {
    setLiveSales(
      liveSales.map((sale) => {
        if (sale.id === id) {
          return {
            ...sale,
            status: "ended",
            scheduledFor: sale.scheduledFor,
          }
        }
        return sale
      }),
    )

    toast({
      title: "Live sale ended",
      description: "Your live sale has ended successfully.",
    })
  }

  const handleSetFeaturedProduct = (saleId, productId) => {
    setLiveSales(
      liveSales.map((sale) => {
        if (sale.id === saleId) {
          return {
            ...sale,
            products: sale.products.map((product) => ({
              ...product,
              featured: product.id === productId,
            })),
          }
        }
        return sale
      }),
    )

    toast({
      title: "Featured product updated",
      description: "The featured product has been updated successfully.",
    })

    setShowProductsDialog(false)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge className="bg-red-500">Live Now</Badge>
      case "scheduled":
        return <Badge className="bg-amber-500">Scheduled</Badge>
      case "ended":
        return <Badge className="bg-gray-500">Ended</Badge>
      default:
        return null
    }
  }

  return (
    <AuthLayout>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
        <header className="mb-6">
          <div className="flex items-center mb-4">
            <Link href="/profile" className="mr-2">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">My Live Sales</h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-500">Manage your live sales and products</p>
            <Dialog open={isCreatingLiveSale} onOpenChange={setIsCreatingLiveSale}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Live Sale</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateLiveSale} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" placeholder="Enter live sale title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Enter description" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" type="time" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="products">Select Products</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select products" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product1">Wireless Earbuds</SelectItem>
                        <SelectItem value="product2">Smart Watch</SelectItem>
                        <SelectItem value="product3">Designer Handbag</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">You can select multiple products during the live sale</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">Thumbnail Image</Label>
                    <div className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50">
                      <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={() => setIsCreatingLiveSale(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Live Sale</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <Tabs defaultValue="all">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1">
              Live Now
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex-1">
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="ended" className="flex-1">
              Ended
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {liveSales.map((sale) => (
              <Card key={sale.id} className="overflow-hidden">
                <div className="relative">
                  <img src={sale.image || "/placeholder.svg"} alt={sale.title} className="w-full h-48 object-cover" />
                  <div className="absolute top-2 right-2">{getStatusBadge(sale.status)}</div>
                  {sale.status === "active" && (
                    <Badge className="absolute bottom-2 left-2 bg-black/70">
                      <Users className="h-3 w-3 mr-1" />
                      {sale.viewers} watching
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{sale.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{sale.description}</p>

                  <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      {sale.status === "scheduled" ? (
                        <Calendar className="h-4 w-4 mr-1" />
                      ) : (
                        <Clock className="h-4 w-4 mr-1" />
                      )}
                      <span>{sale.scheduledFor}</span>
                    </div>
                    <span>{sale.products.length} products</span>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {sale.status === "scheduled" && (
                      <Button onClick={() => handleStartLiveSale(sale.id)}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Live Sale
                      </Button>
                    )}

                    {sale.status === "active" && (
                      <>
                        <Button onClick={() => handleEndLiveSale(sale.id)} variant="destructive">
                          <Pause className="h-4 w-4 mr-2" />
                          End Live Sale
                        </Button>

                        <Dialog
                          open={showProductsDialog && selectedLiveSale === sale.id}
                          onOpenChange={(open) => {
                            setShowProductsDialog(open)
                            if (open) setSelectedLiveSale(sale.id)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <Package className="h-4 w-4 mr-2" />
                              Manage Products
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Featured Products</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <p className="text-sm text-gray-500">
                                Select a product to feature in your live sale. The featured product will be prominently
                                displayed to viewers.
                              </p>

                              <div className="space-y-2">
                                {sale.products.map((product) => (
                                  <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 border rounded-md"
                                  >
                                    <div>
                                      <p className="font-medium">{product.name}</p>
                                      <p className="text-sm text-gray-500">${product.price.toFixed(2)}</p>
                                    </div>
                                    {product.featured ? (
                                      <Badge className="bg-primary">Featured</Badge>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSetFeaturedProduct(sale.id, product.id)}
                                      >
                                        Set as Featured
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <div className="flex justify-end">
                                <Button variant="outline" onClick={() => setShowProductsDialog(false)}>
                                  Close
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Link href={`/live/${sale.id}`}>
                          <Button variant="outline" className="w-full">
                            <Video className="h-4 w-4 mr-2" />
                            View Live Stream
                          </Button>
                        </Link>
                      </>
                    )}

                    {sale.status === "ended" && (
                      <div className="text-sm text-gray-500">
                        <p>Started: {sale.startedAt}</p>
                        <p>Total viewers: {sale.viewers}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {liveSales
              .filter((sale) => sale.status === "active")
              .map((sale) => (
                <Card key={sale.id} className="overflow-hidden">
                  <div className="relative">
                    <img src={sale.image || "/placeholder.svg"} alt={sale.title} className="w-full h-48 object-cover" />
                    <Badge className="absolute top-2 right-2 bg-red-500">Live Now</Badge>
                    <Badge className="absolute bottom-2 left-2 bg-black/70">
                      <Users className="h-3 w-3 mr-1" />
                      {sale.viewers} watching
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{sale.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{sale.description}</p>

                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Started {sale.startedAt}</span>
                      </div>
                      <span>{sale.products.length} products</span>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button onClick={() => handleEndLiveSale(sale.id)} variant="destructive">
                        <Pause className="h-4 w-4 mr-2" />
                        End Live Sale
                      </Button>

                      <Dialog
                        open={showProductsDialog && selectedLiveSale === sale.id}
                        onOpenChange={(open) => {
                          setShowProductsDialog(open)
                          if (open) setSelectedLiveSale(sale.id)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Package className="h-4 w-4 mr-2" />
                            Manage Products
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage Featured Products</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <p className="text-sm text-gray-500">
                              Select a product to feature in your live sale. The featured product will be prominently
                              displayed to viewers.
                            </p>

                            <div className="space-y-2">
                              {sale.products.map((product) => (
                                <div
                                  key={product.id}
                                  className="flex items-center justify-between p-3 border rounded-md"
                                >
                                  <div>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-sm text-gray-500">${product.price.toFixed(2)}</p>
                                  </div>
                                  {product.featured ? (
                                    <Badge className="bg-primary">Featured</Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSetFeaturedProduct(sale.id, product.id)}
                                    >
                                      Set as Featured
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-end">
                              <Button variant="outline" onClick={() => setShowProductsDialog(false)}>
                                Close
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Link href={`/live/${sale.id}`}>
                        <Button variant="outline" className="w-full">
                          <Video className="h-4 w-4 mr-2" />
                          View Live Stream
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            {liveSales
              .filter((sale) => sale.status === "scheduled")
              .map((sale) => (
                <Card key={sale.id} className="overflow-hidden">
                  <div className="relative">
                    <img src={sale.image || "/placeholder.svg"} alt={sale.title} className="w-full h-48 object-cover" />
                    <Badge className="absolute top-2 right-2 bg-amber-500">Scheduled</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{sale.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{sale.description}</p>

                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{sale.scheduledFor}</span>
                      </div>
                      <span>{sale.products.length} products</span>
                    </div>

                    <div className="mt-4">
                      <Button onClick={() => handleStartLiveSale(sale.id)}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Live Sale
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="ended" className="space-y-4">
            {liveSales
              .filter((sale) => sale.status === "ended")
              .map((sale) => (
                <Card key={sale.id} className="overflow-hidden">
                  <div className="relative">
                    <img src={sale.image || "/placeholder.svg"} alt={sale.title} className="w-full h-48 object-cover" />
                    <Badge className="absolute top-2 right-2 bg-gray-500">Ended</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{sale.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{sale.description}</p>

                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{sale.scheduledFor}</span>
                      </div>
                      <span>{sale.products.length} products</span>
                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                      <p>Started: {sale.startedAt}</p>
                      <p>Total viewers: {sale.viewers}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </AuthLayout>
  )
}
