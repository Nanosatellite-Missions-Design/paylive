"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/cart-context";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
} from "lucide-react";

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const catalogId = params.id as string;
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal } =
    useCart();

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleSubmitOrder = async () => {
    if (!cart || cart.items.length === 0) return;

    setIsSubmitting(true);

    // Simulate order submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Here you would typically send the order to your backend
    const orderData = {
      catalogId,
      items: cart.items,
      total: cart.total,
      customer: customerInfo,
      timestamp: new Date(),
    };

    console.log("Order submitted:", orderData);

    // Clear cart and show success
    clearCart();
    setOrderSubmitted(true);

    setIsSubmitting(false);
  };

  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto shadow-2xl border-0 bg-white">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Order Submitted Successfully!
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Thank you for your order! The seller will contact you soon to
              confirm details and arrange payment & delivery.
            </p>
            <Button
              onClick={() => router.push(`/catalog/${catalogId}`)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl py-3"
            >
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white shadow-lg border-b relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              <h1 className="text-3xl font-bold text-gray-900">
                Shopping Cart
              </h1>
            </div>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed max-w-md mx-auto">
              Looks like you haven't added any products to your cart yet. Start
              shopping to fill it up!
            </p>
            <Button
              onClick={() => router.push(`/catalog/${catalogId}`)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              <h1 className="text-3xl font-bold text-gray-900">
                Shopping Cart
              </h1>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">
                {cart.catalogTitle}
              </p>
              <p className="text-sm text-gray-600">by {cart.sellerName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
                <CardTitle className="text-2xl text-gray-900">
                  Cart Items ({cart.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {cart.items.map((item, index) => (
                  <div
                    key={item.productId}
                    className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 p-6 border-2 border-gray-100 rounded-2xl hover:border-blue-200 transition-colors duration-200"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: "fadeInUp 0.6s ease-out forwards",
                    }}
                  >
                    <img
                      src={item?.product?.images?.[0] || "/placeholder.jpg"}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-xl shadow-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        {item.product.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {item.product.description}
                      </p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ${item.product.price}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleQuantityChange(
                            item.productId,
                            item.quantity - 1
                          )
                        }
                        className="h-10 w-10 rounded-xl border-2 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-bold text-lg">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleQuantityChange(
                            item.productId,
                            item.quantity + 1
                          )
                        }
                        className="h-10 w-10 rounded-xl border-2 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-gray-900 mb-2">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Customer Info */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
                <CardTitle className="text-xl text-gray-900">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping:</span>
                  <span>Calculated by seller</span>
                </div>
                <div className="flex justify-between text-2xl font-bold border-t-2 pt-4">
                  <span className="text-gray-900">Total:</span>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
                <CardTitle className="text-xl text-gray-900">
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label
                    htmlFor="name"
                    className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2"
                  >
                    <span>Full Name *</span>
                  </Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    required
                    className="h-12 rounded-xl border-2 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="phone"
                    className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Phone Number *</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                    placeholder="Enter your phone number"
                    required
                    className="h-12 rounded-xl border-2 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="email"
                    className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email (Optional)</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        email: e.target.value,
                      })
                    }
                    placeholder="Enter your email"
                    className="h-12 rounded-xl border-2 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="address"
                    className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Delivery Address *</span>
                  </Label>
                  <Textarea
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        address: e.target.value,
                      })
                    }
                    placeholder="Enter your delivery address"
                    required
                    className="min-h-[100px] rounded-xl border-2 focus:border-blue-500 resize-none"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="notes"
                    className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Order Notes (Optional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    value={customerInfo.notes}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Any special instructions or preferences..."
                    className="min-h-[80px] rounded-xl border-2 focus:border-blue-500 resize-none"
                  />
                </div>
                <Button
                  onClick={handleSubmitOrder}
                  disabled={
                    !customerInfo.name ||
                    !customerInfo.phone ||
                    !customerInfo.address ||
                    isSubmitting
                  }
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Submitting Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-3" />
                      Submit Order
                    </>
                  )}
                </Button>
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-xs text-blue-800 text-center leading-relaxed">
                    <strong>Note:</strong> The seller will contact you directly
                    to confirm your order, discuss payment options, and arrange
                    delivery details.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
