"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/contexts/cart-context"
import { ShoppingCart, Plus, Minus, Trash2, X, CheckCircle, Phone, Mail, MapPin, MessageSquare } from "lucide-react"
import { addToCollection, setToCollection } from "@/functions/add-to-collection"
import { addToSubCollection } from "@/functions/add-to-a-sub-collection"
import { toast } from "@/hooks/use-toast"
import Loader from "@/components/loader"
import { updateDocument } from "@/functions/update-doc-in-collection"
import { increment } from "firebase/firestore"
interface FloatingCartProps {
  catalogId: string
}

export default function FloatingCart() {
  const { cart, updateQuantity, catalog, removeFromCart, clearCart, getCartItemCount, getCartTotal } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  })
  const [depositId, setDepositId] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const savedDepositId = localStorage.getItem("depositId");
    if (savedDepositId) {
      setDepositId(savedDepositId);
    }
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (depositId && catalog) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/pawapay/deposits?depositId=${depositId}`);
          const data = await response.json();
          const status = data[0]?.status || data.status;
          console.log(status)
          console.log(depositId)
          if (status === "COMPLETED") {
            clearInterval(intervalId);

            // Retrieve form data after payment
            const savedCartDatas = localStorage.getItem("cart");
            const savedCustomerDatas = localStorage.getItem("customer");
            if (savedCartDatas && savedCustomerDatas) {
              const parsedCartDatas = JSON.parse(savedCartDatas);
              const parsedCustomerDatas = JSON.parse(savedCustomerDatas)
              try {
                console.log(parsedCartDatas)
                console.log(parsedCustomerDatas)
                if(!catalog) return
                // Here you would typically send the order to your backend
                const orderData = {
                  catalogId: catalog.id,
                  sellerName: catalog.creatorName,
                  sellerId: catalog.creatorId,
                  items: parsedCartDatas.items,
                  total: parsedCartDatas.total,
                  customer: parsedCustomerDatas,
                  notes: parsedCustomerDatas.notes
                }
                await addToCollection("orders", orderData)
                await addToSubCollection({
                  amount: parsedCartDatas.total,
                  type: "purchase",
                  status: "completed",
                  phoneNumber: parsedCustomerDatas.phone
                }, "users", catalog.creatorId, "transactions")
                await updateDocument("users", catalog.creatorId, {balance: increment(parsedCartDatas.total), lifetimeSales: increment(parsedCartDatas.total)})
                // Retrieve existing orders from localStorage (or start empty)
                const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");

                // Add the new order to the array
                existingOrders.push(orderData);

                // Save back to localStorage
                localStorage.setItem("orders", JSON.stringify(existingOrders));

                toast({
                  title: "Payment Completed",
                  description: "Your order has been has been completed.",
                });

                // Reset form and close dialog
                setCustomerInfo({
                  name: "",
                  phone: "",
                  address: "",
                  notes: "",
                });

              // Clear localStorage
              localStorage.removeItem("depositId");
              localStorage.removeItem("cart");
              localStorage.removeItem("customer");
              setDepositId("")
              clearCart()
              
              setLoading(false)
              } catch (error) {
                toast({
                  title: "Error",
                  description: "An error has occured.",
                });
              }
              // Save the transaction here
              // await saveTransaction(depositId);

            }

            toast({
              title: "Payment Completed",
              description: "Your order has been has been completed.",
            });
          }
          else if(status === undefined){
            toast({
              title: "Payment Error",
              description: "The payment has failed.",
              variant: "destructive"
            });
            localStorage.removeItem("depositId");
            setDepositId("")
            localStorage.removeItem("pendingFormData");
            setLoading(false)
          }
        } catch (error) {
          console.error("Payment verification failed:", error);
          clearInterval(intervalId);
        }
      }, 10000);
    }

    return () => clearInterval(intervalId);
  }, [depositId, catalog]);

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

    const body = JSON.stringify({
      amount: cart.total,
      currentUrl: `${window.location}`,
      product: "PayLive Payment"
    });

    try {
      setLoading(true)
      const res = await fetch("/api/pawapay/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");

      // Save depositId in localStorage
      localStorage.setItem("depositId", data.depositId);
      setDepositId(data.depositId);

      // Optional: Save any form data so you can still create the account after refresh
      localStorage.setItem("customer", JSON.stringify(customerInfo));

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      }


    } catch (error) {

    }


    // Clear cart and show success
    setOrderSubmitted(true)
    setShowCheckout(false)


    setIsSubmitting(false)

  }

  const cartItemCount = getCartItemCount()

  if (cartItemCount === 0) {
    return null
  }

  return (
    <>
    {depositId && <Loader />}
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

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto p-0 bg-gradient-to-br from-white to-gray-50">
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
                      <span>XAF{getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        XAF{getCartTotal().toFixed(2)}
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
                      Submit Order - XAF{getCartTotal().toFixed(2)}
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
                          <p className="text-sm text-gray-600 break-words line-clamp-2">
                            {item.product.description}
                          </p>
                          <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            XAF{item.product.price}
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
                          <p className="font-bold text-gray-900">XAF{(item.product.price * item.quantity).toFixed(2)}</p>
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
                      XAF{getCartTotal().toFixed(2)}
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
function nanoid(arg0: number) {
  throw new Error("Function not implemented.")
}

