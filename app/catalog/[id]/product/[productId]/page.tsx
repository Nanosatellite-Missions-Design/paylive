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

  // new states
  // Assurez-vous d'importer useState de React
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
  }, [catalog?.creatorId]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
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
    setProductToBuy(product);
    setShowSelectPaymentNumber(true);
  };

  const handleOnPay = async (paymentMethod: string) => {
    if (product && product.creatorId) return;
    const bodyWithoutNumber = JSON.stringify({
      amount: 1,
      currentUrl:
        "https://cautious-carnival-jj4px75jqq5w3qpj-3000.app.github.dev/live/1uL8tk9Y6SZh0jPhIG04",
      product: productToBuy.name,
    });
    try {
      const res = await fetch("/api/pawapay/deposits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: bodyWithoutNumber,
      });

      const data = await res.json();
      setDepositId(data.depositId);
      const newTransaction = {
        type: "purchase",
        buyerId: "userInfo.uid",
        sellerId: productToBuy.creatorId,
        productId: productToBuy.id,
        productName: productToBuy.name,
        counterpartyId: productToBuy.creatorId,
        amount: productToBuy.price,
        paymentMethod: "mobile money",
        status: "pending",
      };
      await setToSubCollection(
        data.depositId,
        newTransaction,
        "users",
        productToBuy.creatorId,
        "transactions"
      );
      if (!res.ok) throw new Error(data.error || "Unknown error");
      if (paymentMethod === "other" && data?.redirectUrl) {
        window.location.href = data.redirectUrl; // ✅ works for external links
      }
      // setDepositId(data.depositId);
      // await updateDocument("deliveries", deliveryId, {
      //   transactionId: data.depositId,
      // });
      // console.log(data.depositId)
      toast({
        title: "Payment initiated",
        description: "Please complete the payment on your mobile device.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: (error as Error).message,
      });
    }
  };

  const handleCancelPaymentDialog = () => {
    setPaymentState("selecting");
    setShowSelectPaymentNumber(false);
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
                {product?.images?.map((image, index) => (
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
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        {t("buyNow")}
                      </Button>

                      <Button
                        onClick={handleAddToCart}
                        className="w-full h-14 text-lg font-semibold bg-white text-gray-900 border border-gray-300 rounded-xl shadow hover:shadow-md transition-all duration-200 transform hover:scale-105"
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
      <PaymentDialog
        open={showSelectPaymentNumber}
        handleCancel={handleCancelPaymentDialog}
        paymentState={paymentState}
        onOpenChange={setShowSelectPaymentNumber}
        amount={productToBuy.price}
        product={productToBuy.name}
        onPaymentComplete={handleOnPay}
      />
      <style jsx>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  );
}
