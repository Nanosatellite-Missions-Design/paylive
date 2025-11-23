"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { setToSubCollection } from "@/functions/add-to-a-sub-collection";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/useTranslations";
import { PaymentDialog } from "@/components/payment-dialog";
import { setToCollection } from "@/functions/add-to-collection";

interface FloatingCartProps {
  catalogId: string;
}

export default function FloatingCart() {
  const {
    cart,
    updateQuantity,
    catalog,
    removeFromCart,
    clearCart,
    getCartItemCount,
    getCartTotal,
  } = useCart();

  const { userInfo, refreshUserOrders } = useAuth();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentState, setPaymentState] = useState("selecting");

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const t = useTranslations("CatalogPage.Cart");

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleProceedToPayment = () => {
    // Validation des champs obligatoires
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description:
          "Veuillez remplir tous les champs obligatoires (Nom, Téléphone, Adresse)",
      });
      return;
    }

    if (!cart || cart.items.length === 0) {
      toast({
        variant: "destructive",
        title: "Panier vide",
        description: "Votre panier est vide",
      });
      return;
    }

    setShowPaymentDialog(true);
  };

  const handlePaymentComplete = async (result: string) => {
    console.log("🔄 FloatingCart: handlePaymentComplete appelé avec:", result);

    if (result === "pending") {
      setPaymentState("pending");
      setIsSubmitting(true);
      toast({
        title: "Paiement en cours",
        description: "Veuillez confirmer le paiement sur votre téléphone.",
      });
    } else if (result === "failed") {
      setPaymentState("failed");
      setIsSubmitting(false);
      toast({
        variant: "destructive",
        title: "Paiement échoué",
        description: "Le paiement n'a pas pu être traité. Veuillez réessayer.",
      });
    } else {
      // Paiement réussi - créer la commande
      try {
        await createOrder(result);
        setPaymentState("success");
        setIsSubmitting(false);

        toast({
          title: "Commande créée !",
          description: "Votre commande a été créée avec succès.",
        });

        // Fermer les dialogues après un délai
        setTimeout(() => {
          setShowPaymentDialog(false);
          setShowCheckout(false);
          setIsOpen(false);
          clearCart();
        }, 2000);
      } catch (error) {
        console.error("❌ Erreur création commande:", error);
        setPaymentState("failed");
        setIsSubmitting(false);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Erreur lors de la création de la commande",
        });
      }
    }
  };

  const createOrder = async (depositId: string) => {
    if (!cart || !userInfo || !catalog) {
      throw new Error("Cart, user info or catalog missing");
    }

    const orderData = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      catalogId: catalog.id,
      sellerId: catalog.creatorId,
      sellerName: catalog.creatorName,
      customer: {
        ...customerInfo,
        userId: userInfo.uid,
      },
      items: cart.items.map((item) => ({
        productId: item.productId,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.images || item.product.image || [],
          description: item.product.description,
          category: item.product.category,
        },
        quantity: item.quantity,
        price: item.product.price,
      })),
      total: getCartTotal(),
      status: "pending" as const,
      payment: {
        method: "mobile_money",
        depositId: depositId,
        amount: getCartTotal(),
        status: "completed",
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("📦 Création commande:", orderData);

    try {
      // ✅ CORRECTION : Utilisez setToCollection pour la collection principale
      await setToCollection("orders", orderData.id, orderData);

      // ✅ SAUVEGARDE DANS LA SOUS-COLLECTION DE L'UTILISATEUR (acheteur)
      await setToSubCollection(
        orderData.id, // ID du document
        orderData,
        "users",
        userInfo.uid,
        "orders"
      );

      // ✅ SAUVEGARDE DANS LA SOUS-COLLECTION DU VENDEUR
      await setToSubCollection(
        orderData.id, // ID du document
        orderData,
        "users",
        catalog.creatorId,
        "orders"
      );

      console.log("✅ Commande créée avec succès dans Firebase");

      // Rafraîchir les commandes de l'utilisateur
      if (refreshUserOrders) {
        await refreshUserOrders();
      }

      // Envoyer un SMS au vendeur
      try {
        const res = await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: catalog.creatorPhone,
            body: "PayLive: Vous avez reçu une nouvelle commande paylive, veuillez vous connecter et voir les détails de la commande",
          }),
        });
        console.log("✅ SMS envoyé au vendeur");
      } catch (error) {
        console.error("❌ Erreur envoi SMS:", error);
      }
    } catch (error) {
      console.error("❌ Erreur sauvegarde commande:", error);
      throw error;
    }
  };

  const handleCancelPayment = () => {
    setShowPaymentDialog(false);
    setPaymentState("selecting");
    setIsSubmitting(false);
  };

  const cartItemCount = getCartItemCount();

  if (cartItemCount === 0) {
    return null;
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

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto p-0 bg-gradient-to-br from-white to-gray-50">
          {showCheckout ? (
            // Checkout Form
            <div className="flex flex-col h-full">
              <DialogHeader className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {t("checkout")}
                  </DialogTitle>
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
                  <h3 className="font-semibold text-lg mb-3">
                    {t("orderSummary")}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>
                        {t("items")} ({cartItemCount}):
                      </span>
                      <span>XAF{getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>{t("total")}:</span>
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        XAF{getCartTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Information Form */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">
                    {t("customerInformation")}
                  </h3>

                  <div>
                    <Label
                      htmlFor="checkout-name"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      {t("fullName")} *
                    </Label>
                    <Input
                      id="checkout-name"
                      value={customerInfo.name}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          name: e.target.value,
                        })
                      }
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
                      <span>{t("phoneNumber")} *</span>
                    </Label>
                    <Input
                      id="checkout-phone"
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
                      htmlFor="checkout-address"
                      className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>{t("deliveryAddress")} *</span>
                    </Label>
                    <Textarea
                      id="checkout-address"
                      value={customerInfo.address}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          address: e.target.value,
                        })
                      }
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
                      <span>{t("orderNote")}</span>
                    </Label>
                    <Textarea
                      id="checkout-notes"
                      value={customerInfo.notes}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Any special instructions..."
                      className="min-h-[60px] rounded-xl border-2 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t">
                <Button
                  onClick={handleProceedToPayment}
                  disabled={
                    !customerInfo.name ||
                    !customerInfo.phone ||
                    !customerInfo.address ||
                    isSubmitting
                  }
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-3" />
                      Proceed to Payment - XAF{getCartTotal().toFixed(2)}
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-600 text-center mt-3">
                  You will need to complete the payment before your order is
                  confirmed.
                </p>
              </div>
            </div>
          ) : (
            // Cart Items View
            <div className="flex flex-col h-full">
              <DialogHeader className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {t("title")} ({cartItemCount}{" "}
                  {cartItemCount === 1 ? "item" : "items"})
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
                          src={
                            item.product.images?.[0] ||
                            item.product.image?.[0] ||
                            "/placeholder.jpg"
                          }
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {item.product.name}
                          </h3>
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
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                item.quantity - 1
                              )
                            }
                            className="h-8 w-8 rounded-lg border-2 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-semibold">
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
                            className="h-8 w-8 rounded-lg border-2 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            XAF{(item.product.price * item.quantity).toFixed(2)}
                          </p>
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
                    <span className="text-gray-900">{t("title")}:</span>
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
                      {t("clearCart")}
                    </Button>
                    <Button
                      onClick={() => setShowCheckout(true)}
                      className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {t("checkout")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        amount={getCartTotal().toString()}
        product={`Order from ${cart?.sellerName || "Seller"}`}
        onPaymentComplete={handlePaymentComplete}
        paymentState={paymentState}
        handleCancel={handleCancelPayment}
      />

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
  );
}
