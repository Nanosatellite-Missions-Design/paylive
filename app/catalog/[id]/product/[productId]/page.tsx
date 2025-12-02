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
  Share2,
  Heart,
  Shield,
  Truck,
  ChevronsLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getASubDocument } from "@/functions/get-a-document";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/cart-context";
import { useTranslations } from "@/lib/useTranslations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import FloatingCart from "@/components/cart";
// AJOUT: Import de la fonction utilitaire pour les images
import { getProductImages } from "@/lib/product-utils";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const { catalog, addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  // AJOUT: État pour gérer le cas où le catalogue n'est pas encore chargé
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

  const { toast } = useToast();

  // AJOUT: États pour gérer le produit à acheter directement via le checkout
  const [productForBuyNow, setProductForBuyNow] = useState<any>(null);

  const t = useTranslations("CatalogPage.ProductPage");

  // CORRECTION: Fonctions de navigation utilisant getProductImages
  const goToNextImage = () => {
    if (!product) return;
    const images = getProductImages(product);
    setSelectedImage((prev) => (prev + 1 >= images.length ? 0 : prev + 1));
  };

  const goToPrevImage = () => {
    if (!product) return;
    const images = getProductImages(product);
    setSelectedImage((prev) => (prev - 1 < 0 ? images.length - 1 : prev - 1));
  };

  // MODIFICATION: Attendre que le catalogue soit chargé avant de chercher le produit
  useEffect(() => {
    // Si le catalogue n'est pas encore disponible, on attend
    if (!catalog) {
      // AJOUT: Petit délai pour permettre au contexte de se charger
      const timer = setTimeout(() => {
        setIsCatalogLoading(false);
      }, 1500);

      return () => clearTimeout(timer);
    }

    // Une fois que le catalogue est disponible
    setIsCatalogLoading(false);

    const fetchProduct = async () => {
      setIsLoading(true);
      const unsubscribeProduct = getASubDocument(
        catalog?.creatorId ?? "",
        "products",
        productId,
        (fetchedProduct) => {
          console.log("Product fetched:", fetchedProduct);
          if (fetchedProduct) {
            // Normaliser les données du produit
            const normalizedProduct = {
              ...fetchedProduct,
              // S'assurer que les champs essentiels existent
              price: fetchedProduct.price || 0,
              inStock: fetchedProduct.inStock || 0,
              creatorName: fetchedProduct.creatorName || "Vendeur",
              creatorAvatar: fetchedProduct.creatorAvatar || "/placeholder.svg",
              category: fetchedProduct.category || "other",
              description: fetchedProduct.description || "",
            };
            setProduct(normalizedProduct);
          } else {
            console.log("Product not found");
            setProduct(null);
          }
          setIsLoading(false);
        }
      );

      // Retourner la fonction de nettoyage
      return () => {
        if (unsubscribeProduct && typeof unsubscribeProduct === "function") {
          unsubscribeProduct();
        }
      };
    };

    fetchProduct();
  }, [catalog?.creatorId, productId, catalog]);

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
    if (!product) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
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

  // MODIFICATION COMPLÈTE: Fonction pour acheter directement via le checkout
  const handleBuyNow = () => {
    if (!product) return;

    // Ajouter au panier avec la quantité sélectionnée
    addToCart(product, quantity);

    // Stocker le produit pour l'achat direct
    setProductForBuyNow(product);

    toast({
      title: "Produit ajouté au panier",
      description: `${product.name} a été ajouté. Remplissez vos informations pour finaliser l'achat.`,
    });
  };

  // AJOUT: Fonction pour reset le processus Buy Now
  const handleBuyNowProcessed = () => {
    setProductForBuyNow(null);
  };

  // AJOUT: États de chargement combinés
  const isOverallLoading = isCatalogLoading || isLoading;

  if (isOverallLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto animate-spin animation-delay-150"></div>
          </div>
          <p className="text-gray-600 font-medium">
            {isCatalogLoading
              ? "Chargement du catalogue..."
              : "Chargement des détails du produit..."}
          </p>
        </div>
      </div>
    );
  }

  // if (!product) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
  //       <div className="text-center max-w-md mx-auto px-4">
  //         <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
  //           <ShoppingCart className="h-12 w-12 text-gray-400" />
  //         </div>
  //         <h1 className="text-3xl font-bold text-gray-900 mb-3">
  //           Produit non trouvé
  //         </h1>
  //         <p className="text-gray-600 mb-6 leading-relaxed">
  //           Le produit que vous recherchez n'existe pas ou a été supprimé.
  //         </p>
  //         {catalog?.id ? (
  //           <Button
  //             onClick={() => router.push(`/catalog/${catalog?.id}`)}
  //             className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-3"
  //           >
  //             Retour au catalogue
  //           </Button>
  //         ) : (
  //           <Button
  //             onClick={() => router.push("/")}
  //             className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-3"
  //           >
  //             Retour à l'accueil
  //           </Button>
  //         )}
  //       </div>
  //     </div>
  //   );
  // }

  // CORRECTION: Utiliser getProductImages pour récupérer les images de manière cohérente
  const productImages = getProductImages(product);
  const hasMultipleImages = productImages.length > 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header compact */}
      <div className="bg-white shadow-sm border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  router.push(catalog?.id ? `/catalog/${catalog?.id}` : "/")
                }
                className="hover:bg-blue-50 rounded-xl p-2 h-9 w-9"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <Avatar className="h-7 w-7 ring-1 ring-white shadow-sm">
                  <AvatarImage
                    src={product.creatorAvatar || "/placeholder.svg"}
                    alt={product.creatorName}
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    {product.creatorName?.charAt(0) || "V"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">
                  {product.creatorName}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="rounded-xl hover:bg-blue-50 border-blue-200 relative bg-transparent h-9 px-3"
              >
                <Share2 className="h-4 w-4 mr-1" />
                {t("share") || "Partager"}
                {showShareSuccess && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Copié!
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details - Layout compact */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images - Hauteur réduite */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-white rounded-xl overflow-hidden shadow-lg">
              <div className="relative w-full h-full">
                <img
                  src={productImages[selectedImage] || "/placeholder.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.jpg";
                    console.error(
                      "Image failed to load:",
                      productImages[selectedImage]
                    );
                  }}
                />

                {/* Boutons de navigation */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPrevImage();
                      }}
                      className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-all duration-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToNextImage();
                      }}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-all duration-200"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Indicateurs de position (dots) */}
              {hasMultipleImages && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {productImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
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
                className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white transition-colors duration-200 shadow-md"
              >
                <Heart
                  className={`h-4 w-4 transition-colors duration-200 ${
                    isFavorite
                      ? "fill-red-500 text-red-500"
                      : "text-gray-600 hover:text-red-500"
                  }`}
                />
              </button>
            </div>

            {/* Miniatures - Taille réduite */}
            {hasMultipleImages && (
              <div className="flex space-x-2 overflow-x-auto pb-1">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === index
                        ? "border-blue-500 shadow-md scale-105"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.jpg"}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.jpg";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info - Contenu compact */}
          <div className="space-y-4">
            {/* En-tête produit compact */}
            <div>
              <Badge
                variant="outline"
                className="mb-2 text-blue-600 border-blue-200 bg-blue-50 px-2 py-0.5 rounded-full text-xs"
              >
                {product.category}
              </Badge>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                {product.name}
              </h1>
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {/* Prix et stock sur une ligne */}
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                XAF
                {typeof product.price === "number"
                  ? product.price.toFixed(2)
                  : "0.00"}
              </span>
              {product.inStock ? (
                <Badge className="bg-green-100 text-green-800 border-green-200 px-2 py-0.5 rounded-full text-xs">
                  ✓ Stock ({product.inStock})
                </Badge>
              ) : (
                <Badge
                  variant="destructive"
                  className="px-2 py-0.5 rounded-full text-xs"
                >
                  Rupture de stock
                </Badge>
              )}
            </div>

            {/* Trust Badges compact */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Shield className="h-3 w-3 text-green-500" />
                <span>{t("securePayment") || "Paiement sécurisé"}</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Truck className="h-3 w-3 text-blue-500" />
                <span>{t("fastShipping") || "Livraison rapide"}</span>
              </div>
            </div>

            {/* Section achat - Plus compacte */}
            {product.inStock && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Quantité compacte */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        {t("quantity") || "Quantité"}
                      </label>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                          className="h-8 w-8 rounded-lg border hover:bg-blue-50 hover:border-blue-300 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              Number.parseInt(e.target.value) || 1
                            )
                          }
                          className="w-16 text-center font-semibold h-8 rounded-lg border focus:border-blue-500 text-sm"
                          min="1"
                          max={product.inStock}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= product.inStock}
                          className="h-8 w-8 rounded-lg border hover:bg-blue-50 hover:border-blue-300 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Total compact */}
                    <div className="flex items-center justify-between text-lg font-bold border-t pt-3">
                      <span className="text-gray-700">Total</span>
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        XAF{((product.price || 0) * quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* MODIFICATION: Bouton Buy Now qui utilise maintenant le checkout */}
                    <Button
                      onClick={handleBuyNow}
                      className="w-full h-12 font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {t("buyNow") || "Acheter maintenant"}
                    </Button>

                    {/* AJOUT: Bouton Add to Cart pour cohérence */}
                    <Button
                      onClick={handleAddToCart}
                      variant="outline"
                      className="w-full h-10 font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {t("addToCart") || "Ajouter au panier"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Seller Info compact */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-3 text-gray-900">
                  {t("sellerInformation") || "Informations du vendeur"}
                </h3>
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                    <AvatarImage
                      src={product.creatorAvatar || "/placeholder.svg"}
                      alt={product.creatorName}
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                      {product.creatorName?.charAt(0) || "V"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">
                      {product.creatorName}
                    </p>
                    <div className="mt-1 text-xs bg-blue-50 p-2 rounded-lg">
                      <p className="font-semibold text-blue-900">
                        Temps de réponse
                      </p>
                      <p className="text-blue-700">
                        Habituellement sous 2 heures
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AJOUT: FloatingCart avec support pour Buy Now */}
      <FloatingCart
        productToBuy={productForBuyNow}
        onBuyNowProcessed={handleBuyNowProcessed}
      />

      <style jsx>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
