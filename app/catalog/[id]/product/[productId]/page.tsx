"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCart } from "@/contexts/cart-context"
import { ArrowLeft, ShoppingCart, Plus, Minus, Star, Share2, Heart, Shield, Truck, RotateCcw } from "lucide-react"
import type { Catalog, CatalogProduct } from "@/types/catalog"

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const catalogId = params.id as string
  const productId = params.productId as string
  const { addToCart, getCartItemCount } = useCart()

  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [product, setProduct] = useState<CatalogProduct | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showShareSuccess, setShowShareSuccess] = useState(false)

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockCatalog: Catalog = {
        id: catalogId,
        userId: "user123",
        userName: "John's Electronics Store",
        userAvatar: "/placeholder-user.jpg",
        title: "Premium Electronics & Gadgets",
        description: "Your one-stop shop for the latest electronics, gadgets, and accessories.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        products: [
          {
            id: "1",
            name: "iPhone 15 Pro",
            description:
              "The iPhone 15 Pro features a titanium design, advanced camera system with 5x telephoto zoom, and the powerful A17 Pro chip. Perfect for photography enthusiasts and professionals who demand the best mobile technology. Includes 128GB storage, Face ID, and wireless charging capabilities.",
            price: 999,
            images: ["/placeholder.jpg", "/placeholder.jpg", "/placeholder.jpg"],
            category: "Smartphones",
            inStock: true,
            quantity: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      }

      const foundProduct = mockCatalog.products.find((p) => p.id === productId)
      setCatalog(mockCatalog)
      setProduct(foundProduct || null)
      setIsLoading(false)
    }

    fetchProduct()
  }, [catalogId, productId])

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity)
      // Show success animation or toast
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.quantity || 1)) {
      setQuantity(newQuantity)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      setShowShareSuccess(true)
      setTimeout(() => setShowShareSuccess(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto animate-spin animation-delay-150"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!product || !catalog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Product Not Found</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={() => router.push(`/catalog/${catalogId}`)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-3"
          >
            Back to Catalog
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/catalog/${catalogId}`)}
                className="hover:bg-blue-50 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Catalog
              </Button>
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8 ring-2 ring-white shadow-md">
                  <AvatarImage src={catalog.userAvatar || "/placeholder.svg"} alt={catalog.userName} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                    {catalog.userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600 font-medium">{catalog.userName}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="rounded-xl hover:bg-blue-50 border-blue-200 relative bg-transparent"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
                {showShareSuccess && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Copied!
                  </div>
                )}
              </Button>
              <Button
                onClick={() => router.push(`/catalog/${catalogId}/cart`)}
                className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {getCartItemCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-500 animate-pulse">
                    {getCartItemCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-6">
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-xl">
              <img
                src={product.images[selectedImage] || "/placeholder.jpg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="absolute top-4 right-4 p-3 rounded-full bg-white/90 hover:bg-white transition-colors duration-200 shadow-lg"
              >
                <Heart
                  className={`h-5 w-5 transition-colors duration-200 ${
                    isFavorite ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500"
                  }`}
                />
              </button>
            </div>
            {product.images.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-3 transition-all duration-200 ${
                      selectedImage === index
                        ? "border-blue-500 shadow-lg scale-105"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.jpg"}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              <Badge variant="outline" className="mb-4 text-blue-600 border-blue-200 bg-blue-50 px-3 py-1 rounded-full">
                {product.category}
              </Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>
              <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>
            </div>

            <div className="flex items-center space-x-6">
              <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ${product.price}
              </span>
              {product.inStock ? (
                <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 rounded-full">
                  ✓ In Stock ({product.quantity} available)
                </Badge>
              ) : (
                <Badge variant="destructive" className="px-3 py-1 rounded-full">
                  Out of Stock
                </Badge>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Truck className="h-5 w-5 text-blue-500" />
                <span>Fast Shipping</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <RotateCcw className="h-5 w-5 text-purple-500" />
                <span>Easy Returns</span>
              </div>
            </div>

            {product.inStock && (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Quantity</label>
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                          className="h-12 w-12 rounded-xl border-2 hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value) || 1)}
                          className="w-24 text-center text-lg font-semibold h-12 rounded-xl border-2 focus:border-blue-500"
                          min="1"
                          max={product.quantity}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= product.quantity}
                          className="h-12 w-12 rounded-xl border-2 hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-2xl font-bold border-t pt-6">
                      <span className="text-gray-700">Total:</span>
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ${(product.price * quantity).toFixed(2)}
                      </span>
                    </div>

                    <Button
                      onClick={handleAddToCart}
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <ShoppingCart className="h-5 w-5 mr-3" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Seller Info */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-8">
                <h3 className="font-bold text-xl mb-6 text-gray-900">Seller Information</h3>
                <div className="flex items-start space-x-4 mb-6">
                  <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                    <AvatarImage src={catalog.userAvatar || "/placeholder.svg"} alt={catalog.userName} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                      {catalog.userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-900">{catalog.userName}</p>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">4.8 (124 reviews)</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{catalog.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <p className="font-semibold text-blue-900">Response Time</p>
                    <p className="text-blue-700">Usually within 2 hours</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl">
                    <p className="font-semibold text-green-900">Satisfaction Rate</p>
                    <p className="text-green-700">98% positive feedback</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  )
}
