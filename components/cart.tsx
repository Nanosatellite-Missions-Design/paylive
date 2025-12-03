"use client";

import { useEffect, useState, useRef } from "react";
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
  Loader2,
} from "lucide-react";
import { setToSubCollection } from "@/functions/add-to-a-sub-collection";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/useTranslations";
import { PaymentDialog } from "@/components/payment-dialog";
import { setToCollection } from "@/functions/add-to-collection";
import type { CatalogProduct } from "@/types/catalog";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/functions/firebase";

interface FloatingCartProps {
  productToBuy?: CatalogProduct | null;
  onBuyNowProcessed?: () => void;
}

export default function FloatingCart({
  productToBuy,
  onBuyNowProcessed,
}: FloatingCartProps) {
  const {
    cart,
    updateQuantity,
    catalog,
    removeFromCart,
    clearCart,
    getCartItemCount,
    getCartTotal,
    isInitialized,
  } = useCart();

  const { userInfo, refreshUserOrders } = useAuth();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentState, setPaymentState] = useState("selecting");
  const [isLoadingCart, setIsLoadingCart] = useState(!isInitialized);

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const t = useTranslations("CatalogPage.Cart");

  // Référence pour suivre si l'ouverture a déjà été tentée
  const hasOpenedRef = useRef(false);

  // Effet pour gérer l'ouverture automatique du checkout pour Buy Now
  useEffect(() => {
    if (productToBuy && !hasOpenedRef.current) {
      console.log("🛒 Buy Now détecté, vérification du panier...");
      hasOpenedRef.current = true;

      const checkProductInCart = () => {
        const isInCart = cart?.items?.some(
          (item) => item.productId === productToBuy.id
        );

        if (isInCart) {
          console.log("✅ Produit trouvé dans le panier immédiatement");
          setIsOpen(true);
          setShowCheckout(true);
          hasOpenedRef.current = false;

          toast({
            title: "Produit ajouté",
            description: "Remplissez vos informations pour finaliser l'achat.",
          });
          return true;
        }
        return false;
      };

      // Premier essai immédiat
      if (checkProductInCart()) {
        return;
      }

      // Si pas trouvé, réessayer plusieurs fois
      let attempts = 0;
      const maxAttempts = 15;
      const interval = 300;

      const retryInterval = setInterval(() => {
        attempts++;
        console.log(
          `🔍 Tentative ${attempts}/${maxAttempts} de trouver le produit dans le panier`
        );

        if (checkProductInCart()) {
          clearInterval(retryInterval);
          return;
        }

        if (attempts >= maxAttempts) {
          console.error("❌ Échec après", maxAttempts, "tentatives");
          clearInterval(retryInterval);
          hasOpenedRef.current = false;

          toast({
            variant: "destructive",
            title: "Problème d'ajout au panier",
            description:
              "Le produit n'a pas pu être ajouté. Essayez de cliquer à nouveau sur 'Buy Now'.",
          });
        }
      }, interval);

      return () => {
        clearInterval(retryInterval);
      };
    }
  }, [productToBuy, cart, toast]);

  // Réinitialiser le flag quand le produit change
  useEffect(() => {
    hasOpenedRef.current = false;
  }, [productToBuy]);

  // Effet pour suivre l'initialisation
  useEffect(() => {
    if (isInitialized) {
      setIsLoadingCart(false);
    }
  }, [isInitialized]);

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

    if (!cart || !cart.items || cart.items.length === 0) {
      toast({
        variant: "destructive",
        title: "Panier vide",
        description: "Votre panier est vide. Veuillez ajouter des produits.",
      });
      return;
    }

    // Vérifier que tous les produits ont les informations nécessaires
    const invalidItems = cart.items.filter(
      (item) => !item.product || !item.product.id || !item.product.name
    );

    if (invalidItems.length > 0) {
      toast({
        variant: "destructive",
        title: "Problème avec le panier",
        description:
          "Certains produits du panier ne sont pas valides. Veuillez réessayer.",
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
      try {
        await createOrder(result);
        setPaymentState("success");
        setIsSubmitting(false);

        toast({
          title: "Commande créée avec succès !",
          description:
            "Votre commande a été enregistrée et le paiement confirmé.",
        });

        setTimeout(() => {
          setShowPaymentDialog(false);
          setShowCheckout(false);
          setIsOpen(false);
          clearCart();
          resetCustomerInfo();

          if (productToBuy && onBuyNowProcessed) {
            console.log("✅ Buy Now terminé, appel du callback");
            onBuyNowProcessed();
          }
        }, 2000);
      } catch (error) {
        console.error("❌ Erreur création commande:", error);
        setPaymentState("failed");
        setIsSubmitting(false);

        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";

        if (errorMessage.includes("Cart missing")) {
          toast({
            variant: "destructive",
            title: "Problème de panier",
            description:
              "Votre panier est vide ou a expiré. Veuillez réessayer.",
          });
        } else if (errorMessage.includes("No items in cart")) {
          toast({
            variant: "destructive",
            title: "Panier vide",
            description: "Votre panier est vide. Veuillez réessayer.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erreur",
            description:
              "Le paiement a été effectué mais nous rencontrons un problème technique. Contactez le support.",
          });
        }
      }
    }
  };

  // Fonction pour créer une transaction propre sans champs inutiles
  const createUserTransaction = async (
    userId: string,
    type: "deposit" | "withdrawal" | "purchase" | "sale",
    depositId: string,
    amount: number,
    customerData: any,
    productName?: string
  ) => {
    const transactionId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Structure SIMPLIFIÉE et PROPRE - pas de champs inutiles
    const transactionData = {
      id: transactionId,
      type: type,
      amount: amount,
      currency: "XAF",
      status: "completed",
      createdAt: new Date().toISOString(),
      product: productName || cart?.items[0]?.product?.name || "Commande",
      phoneNumber: customerData.phone,
      provider: "MTN_MOMO_CMR",
      country: "CM",
      depositId: depositId,
      pawapayStatus: "successful"
    };

    console.log(`📊 Création transaction ${type} pour ${userId}:`, transactionData);

    try {
      await setToSubCollection(
        transactionId,
        transactionData,
        "users",
        userId,
        "transactions"
      );
      
      console.log(`✅ Transaction créée dans users/${userId}/transactions`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur création transaction:`, error);
      throw error;
    }
  };

  // Fonction pour mettre à jour le solde du vendeur
  const updateSellerBalance = async (sellerId: string, amount: number) => {
    try {
      // Récupérer le solde actuel du vendeur
      const sellerRef = doc(db, "users", sellerId);
      const sellerDoc = await getDoc(sellerRef);
      
      if (sellerDoc.exists()) {
        const currentBalance = sellerDoc.data().balance || 0;
        const newBalance = currentBalance + amount;
        
        // Mettre à jour le solde
        await updateDoc(sellerRef, {
          balance: newBalance,
          lastTransaction: new Date().toISOString(),
          lifetimeSales: (sellerDoc.data().lifetimeSales || 0) + amount
        });
        
        console.log(`💰 Solde du vendeur ${sellerId} mis à jour: ${currentBalance} → ${newBalance}`);
      }
    } catch (error) {
      console.error("❌ Erreur mise à jour solde vendeur:", error);
      // Ne pas bloquer la commande si cette mise à jour échoue
    }
  };

  const createOrder = async (depositId: string) => {
    if (!cart) {
      throw new Error("Cart missing");
    }

    // Récupérer les informations du vendeur
    let sellerId = "";
    let sellerName = "";
    let sellerPhone = "";
    let catalogId = "";

    // Si nous avons un catalogue, utilisons-le (page catalogue)
    if (catalog) {
      sellerId = catalog.creatorId;
      sellerName = catalog.creatorName;
      sellerPhone = catalog.creatorPhone || "";
      catalogId = catalog.id;
    } else {
      // Sinon, c'est un produit direct - récupérer depuis le premier produit du panier
      const firstItem = cart.items[0];
      if (!firstItem) {
        throw new Error("No items in cart");
      }

      sellerId = firstItem.product.creatorId || "unknown-seller";
      sellerName = firstItem.product.creatorName || "Vendeur";
      sellerPhone = firstItem.product.creatorPhone || "";
      catalogId = `direct-${sellerId}`;
    }

    const orderData = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      catalogId: catalogId,
      sellerId: sellerId,
      sellerName: sellerName,
      customer: {
        ...customerInfo,
        // Utiliser userInfo si disponible, sinon utiliser les infos du formulaire
        userId: userInfo?.uid || `guest_${Date.now()}`,
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
          creatorId: item.product.creatorId || sellerId,
          creatorName: item.product.creatorName || sellerName,
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
      // Sauvegarder la commande principale
      await setToCollection("orders", orderData.id, orderData);

      const customerUserId = userInfo?.uid;
      
      // Si l'utilisateur est connecté, sauvegarder dans ses commandes ET créer sa transaction
      if (customerUserId) {
        // Sauvegarder la commande dans les commandes de l'utilisateur
        await setToSubCollection(
          orderData.id,
          orderData,
          "users",
          customerUserId,
          "orders"
        );

        // Créer une transaction SIMPLE pour l'acheteur
        console.log(`🔄 Création transaction pour l'acheteur: ${customerUserId}`);
        await createUserTransaction(
          customerUserId,
          "deposit",
          depositId,
          getCartTotal(),
          customerInfo,
          cart.items[0]?.product?.name
        );
      }

      // Sauvegarder dans les commandes du vendeur
      await setToSubCollection(
        orderData.id,
        orderData,
        "users",
        sellerId,
        "orders"
      );

      // Créer une transaction SIMPLE pour le vendeur
      console.log(`🔄 Création transaction pour le vendeur: ${sellerId}`);
      await createUserTransaction(
        sellerId,
        "sale",
        depositId,
        getCartTotal(),
        customerInfo,
        cart.items[0]?.product?.name
      );

      // Mettre à jour le solde du vendeur
      await updateSellerBalance(sellerId, getCartTotal());

      console.log("✅ Commande et transactions créées avec succès");

      // Rafraîchir les commandes de l'utilisateur s'il est connecté
      if (customerUserId && refreshUserOrders) {
        await refreshUserOrders();
      }

      // Envoyer un SMS au vendeur si on a son numéro
      if (sellerPhone) {
        try {
          await fetch("/api/send-sms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: sellerPhone,
              body: `PayLive: Nouvelle commande de ${customerInfo.name} pour ${
                orderData.items.length
              } produit(s). Total: ${getCartTotal()} XAF`,
            }),
          });
          console.log("✅ SMS envoyé au vendeur");
        } catch (error) {
          console.error("❌ Erreur envoi SMS:", error);
        }
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

  const resetCustomerInfo = () => {
    setCustomerInfo({
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
  };

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);

    if (!open) {
      console.log("🛒 Dialogue fermé - nettoyage du panier");
      clearCart();
      resetCustomerInfo();
      setShowCheckout(false);
      hasOpenedRef.current = false;

      if (productToBuy && onBuyNowProcessed) {
        console.log("🛒 Reset de l'état Buy Now");
        onBuyNowProcessed();
      }
    }
  };

  const cartItemCount = getCartItemCount();
  const cartTotal = getCartTotal();

  // Afficher un loader pendant le chargement initial
  if (isLoadingCart && productToBuy) {
    return (
      <Button
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl z-50"
        size="lg"
        disabled
      >
        <div className="relative">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Button>
    );
  }

  if (cartItemCount === 0 && !productToBuy) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
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
                    {productToBuy && (
                      <Badge className="ml-2 bg-green-500 text-white text-xs">
                        Achat direct
                      </Badge>
                    )}
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCheckout(false);
                      if (productToBuy && onBuyNowProcessed) {
                        onBuyNowProcessed();
                      }
                    }}
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
                  {cart && cart.items && cart.items.length > 0 ? (
                    <div className="space-y-2 text-sm">
                      <div className="space-y-1 mb-2">
                        {cart.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center py-1 border-b"
                          >
                            <span className="truncate max-w-[200px]">
                              {item.product.name} × {item.quantity}
                            </span>
                            <span>
                              XAF
                              {(item.product.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>{t("total")}:</span>
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          XAF{cartTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <ShoppingCart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">
                        Aucun produit dans le panier
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {productToBuy
                          ? "Le produit devrait s'afficher ici..."
                          : "Ajoutez des produits pour continuer"}
                      </p>
                    </div>
                  )}
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
                      placeholder="Entrez votre nom complet"
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
                      placeholder="Entrez votre numéro de téléphone"
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
                      <span>Email (Optionnel)</span>
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
                      placeholder="Entrez votre email"
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
                      placeholder="Entrez votre adresse de livraison"
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
                      placeholder="Instructions spéciales..."
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
                    isSubmitting ||
                    !cart ||
                    !cart.items ||
                    cart.items.length === 0
                  }
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-3" />
                      {productToBuy
                        ? "Finaliser l'achat"
                        : "Procéder au paiement"}{" "}
                      - XAF{cartTotal.toFixed(2)}
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-600 text-center mt-3">
                  Vous devrez compléter le paiement avant que votre commande
                  soit confirmée.
                </p>
              </div>
            </div>
          ) : (
            // Cart Items View
            <div className="flex flex-col h-full">
              <DialogHeader className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {t("title")} ({cartItemCount}{" "}
                  {cartItemCount === 1 ? "article" : "articles"})
                </DialogTitle>
                {cart && (
                  <p className="text-sm text-gray-600 mt-1">
                    {cart.catalogTitle} par {cart.sellerName}
                  </p>
                )}
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-6">
                {cart && cart.items && cart.items.length > 0 ? (
                  <div className="space-y-4">
                    {cart.items.map((item: any, index: any) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex items-center space-x-4 p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-colors duration-200"
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
                    <p className="text-gray-500">Votre panier est vide</p>
                  </div>
                )}
              </div>

              {cart && cart.items && cart.items.length > 0 && (
                <div className="p-6 bg-gray-50 border-t space-y-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span className="text-gray-900">{t("title")}:</span>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      XAF{cartTotal.toFixed(2)}
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
        amount={cartTotal.toString()}
        product={`Commande de ${cart?.sellerName || "Vendeur"}`}
        onPaymentComplete={handlePaymentComplete}
        paymentState={paymentState}
        handleCancel={handleCancelPayment}
      />
    </>
  );
}