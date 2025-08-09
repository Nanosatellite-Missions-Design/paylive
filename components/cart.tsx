"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/contexts/cart-context"
import { ShoppingCart, Plus, Minus, Trash2, X, CheckCircle, Phone, Mail, MapPin, MessageSquare } from "lucide-react"

interface FloatingCartProps {
  catalogId: string
}

export default function FloatingCart() {
  const { cart, updateQuantity, removeFromCart, clearCart, getCartItemCount, getCartTotal } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  })

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
    } else {
      updateQuantity(productId, newQuantity)
    }
  }

  const handleSubmitOrder = async () => {
    if (!cart || cart.items.length === 0) return

    setIsSubmitting(true)

    // Simulate order submission
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Here you would typically send the order to your backend
    const orderData = {
      catalogId: "id",
      items: cart.items,
      total: cart.total,
      customer: customerInfo,
      timestamp: new Date(),
    }

    console.log("Order submitted:", orderData)

    // Clear cart and show success
    clearCart()
    setOrderSubmitted(true)
    setShowCheckout(false)

    // Reset form
    setCustomerInfo({
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    })

    setIsSubmitting(false)

    // Auto close success dialog after 3 seconds
    setTimeout(() => {
      setOrderSubmitted(false)
      setIsOpen(false)
    }, 3000)
  }

  const cartItemCount = getCartItemCount()

  if (cartItemCount === 0) {
    return null
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 z-50"
            size="lg"
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              <Badge className="absolute -top-3 -right-3 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-500 animate-pulse border-2 border-white">
                {cartItemCount}
              </Badge>
            </div>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-white to-gray-50">
          {orderSubmitted ? (
            // Success State
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Submitted Successfully!</h2>
              <p className="text-gray-600 leading-relaxed">
                Thank you for your order! The seller will contact you soon to confirm details and arrange payment &
                delivery.
              </p>
            </div>
          ) : showCheckout ? (
            // Checkout Form
            <div className="flex flex-col h-full">
              <DialogHeader className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-bold text-gray-900">Checkout</DialogTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCheckout(false)}
                    className="rounded-full hover:bg-white/50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Order Summary */}
                <div className="bg-white p-4 rounded-xl border-2 border-gray-100">
                  <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Items ({cartItemCount}):</span>
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ${getCartTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Information Form */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Customer Information</h3>

                  <div>
                    <Label htmlFor="checkout-name" className="text-sm font-medium text-gray-700 mb-2 block">
                      Full Name *
                    </Label>
                    <Input
                      id="checkout-name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="checkout-phone"
                      className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2"
                    >
                      <Phone className="h-4 w-4" />
                      <span>Phone Number *</span>
                    </Label>
                    <Input
                      id="checkout-phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      placeholder="Enter your phone number"
                      required
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="checkout-email"
                      className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Email (Optional)</span>
                    </Label>
                    <Input
                      id="checkout-email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      placeholder="Enter your email"
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="checkout-address"
                      className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>Delivery Address *</span>
                    </Label>
                    <Textarea
                      id="checkout-address"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      placeholder="Enter your delivery address"
                      required
                      className="min-h-[80px] rounded-xl border-2 focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="checkout-notes"
                      className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Order Notes (Optional)</span>
                    </Label>
                    <Textarea
                      id="checkout-notes"
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                      placeholder="Any special instructions..."
                      className="min-h-[60px] rounded-xl border-2 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t">
                <Button
                  onClick={handleSubmitOrder}
                  disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.address || isSubmitting}
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Submitting Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-3" />
                      Submit Order - ${getCartTotal().toFixed(2)}
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-600 text-center mt-3">
                  The seller will contact you to confirm and arrange payment & delivery.
                </p>
              </div>
            </div>
          ) : (
            // Cart Items View
            <div className="flex flex-col h-full">
              <DialogHeader className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Shopping Cart ({cartItemCount} {cartItemCount === 1 ? "item" : "items"})
                </DialogTitle>
                {cart && (
                  <p className="text-sm text-gray-600 mt-1">
                    {cart.catalogTitle} by {cart.sellerName}
                  </p>
                )}
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-6">
                {cart && cart.items.length > 0 ? (
                  <div className="space-y-4">
                    {cart?.items?.map((item: any, index: any) => (
                      <div
                        key={item.productId}
                        className="flex items-center space-x-4 p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-colors duration-200"
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animation: "fadeInUp 0.6s ease-out forwards",
                        }}
                      >
                        <img
                          src={item.product.image?.[0] || "/placeholder.jpg"}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{item.product.name}</h3>
                          <p className="text-sm text-gray-600 truncate">{item.product.description}</p>
                          <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ${item.product.price}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                            className="h-8 w-8 rounded-lg border-2 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                            className="h-8 w-8 rounded-lg border-2 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${(item.product.price * item.quantity).toFixed(2)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg mt-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                )}
              </div>

              {cart && cart.items.length > 0 && (
                <div className="p-6 bg-gray-50 border-t space-y-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span className="text-gray-900">Total:</span>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ${getCartTotal().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => clearCart()}
                      className="flex-1 h-12 rounded-xl border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                    >
                      Clear Cart
                    </Button>
                    <Button
                      onClick={() => setShowCheckout(true)}
                      className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Checkout
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
