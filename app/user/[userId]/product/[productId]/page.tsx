"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ShoppingCart,
  Plus,
  Minus,
  Share2,
  Heart,
  Shield,
  Truck,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getASubDocument } from "@/functions/get-a-document";
import { PaymentDialog } from "@/components/payment-dialog";
import { useToast } from "@/hooks/use-toast";
import { setToSubCollection } from "@/functions/add-to-a-sub-collection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function DirectProductPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const productId = params.productId as string;

  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [showSelectPaymentNumber, setShowSelectPaymentNumber] = useState(false);
  const [productToBuy, setProductToBuy] = useState<any>({});
  const [paymentState, setPaymentState] = useState("selecting");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [depositId, setDepositId] = useState("");
  const { toast } = useToast();

  // Fonctions de navigation des images
  const goToNextImage = () => {
    if (!product) return;
    const images = product.images || product.image || [];
    setSelectedImage((prev) => (prev + 1 >= images.length ? 0 : prev + 1));
  };

  const goToPrevImage = () => {
    if (!product) return;
    const images = product.images || product.image || [];
    setSelectedImage((prev) => (prev - 1 < 0 ? images.length - 1 : prev - 1));
  };

  // Récupérer le produit directement
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      const unsubscribeProduct = getASubDocument(
        userId,
        "products",
        productId,
        setProduct
      );
      setIsLoading(false);
      return () => {
        if (unsubscribeProduct) unsubscribeProduct();
      };
    };

    if (userId && productId) {
      fetchProduct();
    }
  }, [userId, productId]);

  // Réinitialiser l'état de paiement
  useEffect(() => {
    if (!showSelectPaymentNumber) {
      const timer = setTimeout(() => {
        setPaymentState("selecting");
        setIsPaymentProcessing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showSelectPaymentNumber]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.inStock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;

    setProductToBuy({
      ...product,
      totalPrice: (product.price * quantity).toString(),
    });
    setShowSelectPaymentNumber(true);
    setPaymentState("selecting");
    setIsPaymentProcessing(false);
  };

  const handlePaymentComplete = (result: string) => {
    console.log("Payment complete:", result);

    if (result === "pending") {
      setPaymentState("pending");
      setIsPaymentProcessing(true);
      toast({
        title: "Paiement en cours",
        description: "Veuillez confirmer le paiement sur votre téléphone.",
      });
    } else if (result === "failed") {
      setPaymentState("failed");
      setIsPaymentProcessing(false);
      toast({
        variant: "destructive",
        title: "Paiement échoué",
        description: "Le paiement n'a pas pu être traité. Veuillez réessayer.",
      });
    } else {
      setPaymentState("success");
      setDepositId(result);
      setIsPaymentProcessing(false);

      // Enregistrer la transaction
      if (product && product.creatorId) {
        const newTransaction = {
          type: "purchase",
          buyerId: "userInfo.uid", // À remplacer par l'ID réel de l'utilisateur connecté
          sellerId: product.creatorId,
          productId: product.id,
          productName: product.name,
          counterpartyId: product.creatorId,
          amount: product.price * quantity,
          quantity: quantity,
          paymentMethod: "mobile_money",
          status: "completed",
          depositId: result,
          timestamp: new Date().toISOString(),
        };

        setToSubCollection(
          result,
          newTransaction,
          "users",
          product.creatorId,
          "transactions"
        )
          .then(() => {
            console.log("✅ Transaction enregistrée");
          })
          .catch((error) => {
            console.error("❌ Erreur enregistrement:", error);
          });
      }

      toast({
        title: "Paiement réussi !",
        description: `Votre achat de ${product?.name} a été confirmé.`,
      });

      setTimeout(() => {
        setShowSelectPaymentNumber(false);
      }, 3000);
    }
  };

  const handleCancelPaymentDialog = () => {
    setShowSelectPaymentNumber(false);
    setPaymentState("selecting");
    setIsPaymentProcessing(false);

    if (isPaymentProcessing) {
      toast({
        title: "Paiement annulé",
        description: "Le processus de paiement a été interrompu.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading product details...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Product Not Found
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-3"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const productImages = product.images || product.image || [];
  const hasMultipleImages = productImages.length > 1;

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
                onClick={() => router.back()}
                className="hover:bg-blue-50 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8 ring-2 ring-white shadow-md">
                  <AvatarImage
                    src={product.creatorName || "/placeholder.svg"}
                    alt={product.creatorName}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                    {product.creatorName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600 font-medium">
                  {product.creatorName}
                </span>
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
              <div className="relative w-full h-full">
                <img
                  src={productImages[selectedImage] || "/placeholder.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />

                {hasMultipleImages && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPrevImage();
                      }}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-all duration-200"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToNextImage();
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-all duration-200"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {hasMultipleImages && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {productImages.map((_: any, index: number) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(index);
                      }}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === selectedImage
                          ? "bg-white scale-125"
                          : "bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="absolute top-4 right-4 p-3 rounded-full bg-white/90 hover:bg-white transition-colors duration-200 shadow-lg"
              >
                <Heart
                  className={`h-5 w-5 transition-colors duration-200 ${
                    isFavorite
                      ? "fill-red-500 text-red-500"
                      : "text-gray-600 hover:text-red-500"
                  }`}
                />
              </button>
            </div>

            {hasMultipleImages && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {productImages.map((image: string, index: number) => (
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
              <Badge
                variant="outline"
                className="mb-4 text-blue-600 border-blue-200 bg-blue-50 px-3 py-1 rounded-full"
              >
                {product.category}
              </Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="flex items-center space-x-6">
              <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                XAF{product.price}
              </span>
              {product.inStock ? (
                <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 rounded-full">
                  ✓ In Stock ({product.inStock} available)
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
            </div>

            {product.inStock && (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Quantity
                      </label>
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
                          onChange={(e) =>
                            handleQuantityChange(
                              Number.parseInt(e.target.value) || 1
                            )
                          }
                          className="w-24 text-center text-lg font-semibold h-12 rounded-xl border-2 focus:border-blue-500"
                          min="1"
                          max={product.inStock}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= product.inStock}
                          className="h-12 w-12 rounded-xl border-2 hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-2xl font-bold border-t pt-6">
                      <span className="text-gray-700">Total:</span>
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        XAF{(product.price * quantity).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        onClick={handleBuyNow}
                        disabled={isPaymentProcessing}
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPaymentProcessing ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          "Buy Now"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Seller Info */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-8">
                <h3 className="font-bold text-xl mb-6 text-gray-900">
                  Seller Information
                </h3>
                <div className="flex items-start space-x-4 mb-6">
                  <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                    <AvatarImage
                      src={product.creatorName || "/placeholder.svg"}
                      alt={product.creatorName}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                      {product.creatorName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-900">
                      {product.creatorName}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <p className="font-semibold text-blue-900">Response Time</p>
                    <p className="text-blue-700">Usually within 2 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PaymentDialog
        open={showSelectPaymentNumber}
        onOpenChange={setShowSelectPaymentNumber}
        amount={productToBuy.totalPrice || productToBuy.price || "0"}
        product={productToBuy.name || ""}
        onPaymentComplete={handlePaymentComplete}
        paymentState={paymentState}
        handleCancel={handleCancelPaymentDialog}
      />
    </div>
  );
}
