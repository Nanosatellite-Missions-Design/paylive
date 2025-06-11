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
import { ChevronLeft, Plus, Edit, Trash2, QrCode } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import QRCodeGenerator from "@/components/qr-code-generator"

export default function ProductsPage() {
  const [products, setProducts] = useState<any>([
    {
      id: 1,
      name: "Wireless Earbuds",
      price: 89.99,
      description: "High-quality wireless earbuds with noise cancellation",
      image: "/placeholder.svg?height=100&width=100",
      category: "Electronics",
      status: "available",
    },
    {
      id: 2,
      name: "Smart Watch",
      price: 129.99,
      description: "Fitness tracker with heart rate monitor and sleep tracking",
      image: "/placeholder.svg?height=100&width=100",
      category: "Electronics",
      status: "available",
    },
    {
      id: 3,
      name: "Designer Handbag",
      price: 199.99,
      description: "Luxury designer handbag with genuine leather",
      image: "/placeholder.svg?height=100&width=100",
      category: "Fashion",
      status: "sold",
    },
  ])

  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const { toast } = useToast()

  const handleAddProduct = (e: any) => {
    e.preventDefault()

    // In a real app, you would validate and process the form data
    const newProduct = {
      id: products.length + 1,
      name: "New Product",
      price: 49.99,
      description: "Product description goes here",
      image: "/placeholder.svg?height=100&width=100",
      category: "Other",
      status: "available",
    }

    setProducts([...products, newProduct])
    setIsAddingProduct(false)

    toast({
      title: "Product added",
      description: "Your new product has been added successfully.",
    })
  }

  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setIsEditing(true)
  }

  const handleSaveEdit = (e: any) => {
    e.preventDefault()

    // In a real app, you would validate and process the form data
    setProducts(products.map((product: any) => (product.id === editingProduct.id ? editingProduct : product)))

    setIsEditing(false)
    setEditingProduct(null)

    toast({
      title: "Product updated",
      description: "Your product has been updated successfully.",
    })
  }

  const handleDeleteProduct = (id: any) => {
    setProducts(products.filter((product: any) => product.id !== id))

    toast({
      title: "Product deleted",
      description: "Your product has been deleted successfully.",
    })
  }

  const handleShowQRCode = (product: any) => {
    setSelectedProduct(product)
    setShowQRCode(true)
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
            <h1 className="text-2xl font-bold">My Products</h1>
          </div>
          <p className="text-gray-500">Manage your products for live sales and auctions</p>
        </header>

        <div className="space-y-4 mb-6">
          {products.map((product: any) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-md overflow-hidden mr-3">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{product.name}</h3>
                      <Badge className={product.status === "available" ? "bg-green-500" : "bg-gray-500"}>
                        {product.status === "available" ? "Available" : "Sold"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-medium">${product.price.toFixed(2)}</p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleShowQRCode(product)}
                          className="h-8 w-8"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" placeholder="Enter product name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input id="price" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Enter product description" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select defaultValue="electronics">
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="home">Home & Kitchen</SelectItem>
                    <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Product Images</Label>
                <div className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50">
                  <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsAddingProduct(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Product</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Product Name</Label>
                  <Input
                    id="edit-name"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price ($)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number.parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingProduct.category}
                    onValueChange={(value) => setEditingProduct({ ...editingProduct, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="home">Home & Kitchen</SelectItem>
                      <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingProduct.status}
                    onValueChange={(value) => setEditingProduct({ ...editingProduct, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Product QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-4">
              <div className="bg-white p-4 rounded-md">
                {selectedProduct && (
                  <QRCodeGenerator value={`https://paylive.app/product/${selectedProduct.id}`} size={200} />
                )}
              </div>
              <p className="mt-4 text-center text-sm">{selectedProduct?.name}</p>
              <p className="text-center text-xs text-gray-500">Scan to view product details</p>
              <Button className="mt-4" onClick={() => window.print()}>
                Print QR Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
