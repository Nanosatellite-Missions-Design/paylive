"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, Calendar, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context";

export default function LiveSalesPage() {
  const { lives } = useAuth()
  const [liveSales, setLiveSales] = useState([
    {
      id: 1,
      title: "Summer Fashion Collection",
      status: "active",
      scheduledFor: "Now",
      viewers: 1243,
      products: 8,
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: 2,
      title: "Tech Gadgets Flash Sale",
      status: "scheduled",
      scheduledFor: "Apr 30, 2023 - 7:00 PM",
      viewers: 0,
      products: 12,
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: 3,
      title: "Home Decor Showcase",
      status: "ended",
      scheduledFor: "Apr 15, 2023 - 6:00 PM",
      viewers: 876,
      products: 15,
      image: "/placeholder.svg?height=200&width=400",
    },
  ])

  const [isCreatingLiveSale, setIsCreatingLiveSale] = useState(false)
  const { toast } = useToast()

  const handleCreateLiveSale = (e: any) => {
    e.preventDefault()

    // In a real app, you would validate and process the form data
    const newLiveSale = {
      id: liveSales.length + 1,
      title: "New Live Sale",
      status: "scheduled",
      scheduledFor: "May 5, 2023 - 8:00 PM",
      viewers: 0,
      products: 5,
      image: "/placeholder.svg?height=200&width=400",
    }

    setLiveSales([newLiveSale, ...liveSales])
    setIsCreatingLiveSale(false)

    toast({
      title: "Live sale created",
      description: "Your new live sale has been scheduled successfully.",
    })
  }

  const getStatusBadge = (status: any) => {
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
    <div>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Live Sales</h1>
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
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" placeholder="Enter description" />
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
          <p className="text-gray-500">Browse and join live sales from your favorite creators</p>
        </header>

        <Tabs defaultValue="all">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="live" className="flex-1">
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
            {lives.map((sale) => (
              <Link key={sale.id} href={`/live/${sale.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
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
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
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
                  </CardContent>
                </Card>
              </Link>
            ))}
          </TabsContent>
          <TabsContent value="live" className="space-y-4">
            {lives
              .filter((sale) => sale.status === "active")
              .map((sale) => (
                <Link key={sale.id} href={`/live/${sale.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
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
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{sale.scheduledFor}</span>
                        </div>
                        <span>{sale.products.length} products</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </TabsContent>
          <TabsContent value="scheduled" className="space-y-4">
            {lives
              .filter((sale) => sale.status === "scheduled")
              .map((sale) => (
                <Link key={sale.id} href={`/live/${sale.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img src={sale.image || "/placeholder.svg"} alt={sale.title} className="w-full h-48 object-cover" />
                      <Badge className="absolute top-2 right-2 bg-amber-500">Scheduled</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{sale.title}</h3>
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{sale.scheduledFor}</span>
                        </div>
                        <span>{sale.products.length} products</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </TabsContent>
          <TabsContent value="ended" className="space-y-4">
            {lives
              .filter((sale) => sale.status === "ended")
              .map((sale) => (
                <Link key={sale.id} href={`/live/${sale.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img src={sale.image || "/placeholder.svg"} alt={sale.title} className="w-full h-48 object-cover" />
                      <Badge className="absolute top-2 right-2 bg-gray-500">Ended</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{sale.title}</h3>
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{sale.scheduledFor}</span>
                        </div>
                        <span>{sale.products.length} products</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
