"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Share2,
  Heart,
  Shield,
  Truck,
  RotateCcw,
  ChevronsLeft,
  Loader2,
} from "lucide-react";
import type { Catalog, CatalogProduct } from "@/types/catalog";
import { getASubDocument } from "@/functions/get-a-document";
import { PaymentDialog } from "@/components/payment-dialog";
import { useToast } from "@/hooks/use-toast";
import { setToSubCollection } from "@/functions/add-to-a-sub-collection";
import { useCart } from "@/contexts/cart-context";
import { useTranslations } from "@/lib/useTranslations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CountryProvider,
  getCountryByCode,
  PAWAPAY_COUNTRIES,
  getAllCountries,
} from "@/lib/countries";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const { catalog, addToCart } = useCart();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [showSelectPaymentNumber, setShowSelectPaymentNumber] = useState(false);
  const [productToBuy, setProductToBuy] = useState<any>({});
  const [paymentState, setPaymentState] = useState("selecting");
  const { toast } = useToast();
  const [depositId, setDepositId] = useState("");

  // ✅ CORRECTION : États pour gérer correctement le flux de paiement
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [lastTransactionStatus, setLastTransactionStatus] = useState<
    string | null
  >(null);

  // new states - conservés pour référence mais maintenant gérés dans PaymentDialog
  const [paymentMethod, setPaymentMethod] = useState<"pawapay" | "paypal">(
    "pawapay"
  );
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(
    undefined
  );
  const [mobileProvider, setMobileProvider] = useState<string | undefined>(
    undefined
  );
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  // Pour déterminer les fournisseurs disponibles
  const currentCountry = PAWAPAY_COUNTRIES.find(
    (c) => c.code === selectedCountry
  );
  const availableProviders = currentCountry?.providers || [];
  const t = useTranslations("CatalogPage.ProductPage");

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      // const unsubscribeUser = getADocument(catalogId, "users", (data) => {
      //     setCatalogData(data);
      // });
      const unsubscribeProduct = getASubDocument(
        catalog?.creatorId ?? "",
        "products",
        productId,
        setProduct
      );
      setIsLoading(false);
      return () => {
        // Safe to call even if undefined due to nullish coalescing
        // if (unsubscribeUser) unsubscribeUser();
        if (unsubscribeProduct) unsubscribeProduct();
      };
    };

    fetchProduct();
  }, [catalog?.creatorId, productId]);

  // ✅ CORRECTION : Effet pour réinitialiser l'état de paiement quand le dialogue se ferme
  useEffect(() => {
    if (!showSelectPaymentNumber) {
      // Réinitialiser l'état après un délai pour permettre les animations
      const timer = setTimeout(() => {
        setPaymentState("selecting");
        setIsPaymentProcessing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showSelectPaymentNumber]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      toast({
        title: "Produit ajouté au panier",
        description: `${product.name} a été ajouté à votre panier.`,
      });
    }
  };

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
      // Fallback: copy to clipboard
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
    setPaymentState("selecting"); // ✅ CORRECTION : Réinitialiser l'état à chaque ouverture
    setIsPaymentProcessing(false);
  };

  // ✅ CORRECTION COMPLÈTE : Nouvelle gestion du callback de paiement
  const handlePaymentComplete = (result: string) => {
    console.log("🔄 Parent: handlePaymentComplete appelé avec:", result);

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
      // C'est un depositId - transaction réussie
      setPaymentState("success");
      setDepositId(result);
      setIsPaymentProcessing(false);

      // ✅ CORRECTION : Enregistrer la transaction dans Firebase du côté vendeur
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
          result, // Utiliser le depositId comme ID de document
          newTransaction,
          "users",
          product.creatorId,
          "transactions"
        )
          .then(() => {
            console.log("✅ Transaction enregistrée chez le vendeur");
          })
          .catch((error) => {
            console.error("❌ Erreur enregistrement vendeur:", error);
          });
      }

      toast({
        title: "Paiement réussi !",
        description: `Votre achat de ${product?.name} a été confirmé.`,
      });

      // ✅ CORRECTION : Fermer automatiquement après un délai en cas de succès
      setTimeout(() => {
        setShowSelectPaymentNumber(false);
        // Optionnel : Rediriger ou recharger les données
      }, 3000);
    }
  };

  const handleCancelPaymentDialog = () => {
    console.log("❌ Parent: Annulation du paiement");
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

  // ✅ CORRECTION : Fonction pour réessayer le paiement
  const handleRetryPayment = () => {
    setPaymentState("selecting");
    setIsPaymentProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto animate-spin animation-delay-150"></div>
          </div>
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
            onClick={() => router.push(`/catalog/${catalog?.id}`)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-3"
          >
            Back to Catalog
          </Button>
        </div>
      </div>
    );
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
                onClick={() => router.push(`/catalog/${catalog?.id}`)}
                className="hover:bg-blue-50 rounded-xl"
              >
                <ChevronsLeft className="h-4 w-4 mr-2" />
                {/* Back to Catalog */}
              </Button>
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8 ring-2 ring-white shadow-md">
                  <AvatarImage
                    src={product.creatorName || "/placeholder.svg"}
                    alt={product.creatorName}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                    {product.creatorName.charAt(0)}
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
                {t("share")}
                {showShareSuccess && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Copied!
                  </div>
                )}
              </Button>
              {/* <Button
                onClick={() => router.push(`/catalog/${catalogId}/cart`)}
                className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {2 > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-500 animate-pulse">
                    2
                  </Badge>
                )}
              </Button> */}
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
                src={product?.image?.[selectedImage] || "/placeholder.jpg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
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
            {Array.isArray(product?.images) && product.images.length > 1 && (
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
                <span>{t("securePayment")}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Truck className="h-5 w-5 text-blue-500" />
                <span>{t("fastShipping")}</span>
              </div>
              {/* <div className="flex items-center space-x-2 text-sm text-gray-600">
                <RotateCcw className="h-5 w-5 text-purple-500" />
                <span>Easy Returns</span>
              </div> */}
            </div>

            {product.inStock && (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        {t("quantity")}
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
                          t("buyNow")
                        )}
                      </Button>

                      <Button
                        onClick={handleAddToCart}
                        disabled={isPaymentProcessing}
                        className="w-full h-14 text-lg font-semibold bg-white text-gray-900 border border-gray-300 rounded-xl shadow hover:shadow-md transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="h-5 w-5 mr-3" />
                        {t("addToCart")}
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
                  {t("sellerInformation")}
                </h3>
                <div className="flex items-start space-x-4 mb-6">
                  <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                    <AvatarImage
                      src={product.creatorName || "/placeholder.svg"}
                      alt={product.creatorName}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                      {product.creatorName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-900">
                      {product.creatorName}
                    </p>
                    {/* <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        4.8 (124 reviews)
                      </span>
                    </div> */}
                    {/* <p className="text-gray-600 leading-relaxed">{catalog.description}</p> */}
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

      {/* ✅ CORRECTION : PaymentDialog avec la bonne gestion des états */}
      <PaymentDialog
        open={showSelectPaymentNumber}
        onOpenChange={setShowSelectPaymentNumber}
        amount={productToBuy.totalPrice || productToBuy.price || "0"}
        product={productToBuy.name || ""}
        onPaymentComplete={handlePaymentComplete}
        paymentState={paymentState}
        handleCancel={handleCancelPaymentDialog}
      />

      <style jsx>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  );
}
