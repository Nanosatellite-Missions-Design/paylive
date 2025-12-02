"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShoppingCart, Search, Heart, Zap } from "lucide-react";
import type { Catalog, CatalogProduct } from "@/types/catalog";
import { useCart } from "@/contexts/cart-context";
import { useTranslations } from "@/lib/useTranslations";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import FloatingCart from "@/components/cart";

// Fonction utilitaire pour générer une clé de cache unique pour les images
const generateImageCacheKey = (
  product: CatalogProduct,
  updatedAt?: any
): string => {
  const baseKey = product.id;
  const imageUrl = product.image?.[0] || "";

  // Utiliser l'URL de l'image et la date de mise à jour pour créer une clé unique
  const timestamp = updatedAt
    ? typeof updatedAt === "object" && updatedAt.toDate
      ? updatedAt.toDate().getTime()
      : new Date(updatedAt).getTime()
    : Date.now();

  return `${baseKey}-${imageUrl.split("/").pop()}-${timestamp}`;
};

export default function CatalogPage() {
  const params = useParams();
  const router = useRouter();
  const catalogId = params.id as string;
  const [filteredProducts, setFilteredProducts] = useState<CatalogProduct[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { addToCart, catalog, products, setProducts } = useCart();
  const { userProducts } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("CatalogPage");

  // Références pour éviter les re-rendus inutiles
  const imageCacheRef = useRef<Map<string, string>>(new Map());
  const lastProductUpdateRef = useRef<string>("");

  // État pour gérer le produit à acheter directement via le checkout
  const [productForBuyNow, setProductForBuyNow] =
    useState<CatalogProduct | null>(null);

  // Fonction optimisée pour mettre à jour les produits avec cache d'images
  const getProductsWithUpdatedPrices = (catalogProducts: CatalogProduct[]) => {
    if (!userProducts || userProducts.length === 0) return catalogProducts;

    const updatedProducts = catalogProducts.map((catalogProduct) => {
      const updatedProduct = userProducts.find(
        (up) => up.id === catalogProduct.id
      );

      if (!updatedProduct) return catalogProduct;

      // Vérifier si le produit a changé
      const productChanged =
        updatedProduct.price !== catalogProduct.price ||
        updatedProduct.image?.[0] !== catalogProduct.image?.[0] ||
        updatedProduct.updatedAt !== catalogProduct.updatedAt;

      if (!productChanged) return catalogProduct;

      // Créer un nouveau produit avec les mises à jour
      const newProduct = {
        ...catalogProduct,
        price: updatedProduct.price,
        image: updatedProduct.image || catalogProduct.image,
        updatedAt: updatedProduct.updatedAt || catalogProduct.updatedAt,
      };

      // Générer une clé de cache pour l'image
      if (updatedProduct.image?.[0] !== catalogProduct.image?.[0]) {
        const cacheKey = generateImageCacheKey(
          newProduct,
          updatedProduct.updatedAt
        );
        (newProduct as any)._cacheKey = cacheKey;
        imageCacheRef.current.set(catalogProduct.id, cacheKey);
      }

      return newProduct;
    });

    return updatedProducts;
  };

  // Effet optimisé pour les mises à jour de produits
  useEffect(() => {
    if (!userProducts || !products || products.length === 0) return;

    const updatedProducts = getProductsWithUpdatedPrices(products);

    // Vérifier s'il y a des changements significatifs
    const hasSignificantChanges = updatedProducts.some((newProd, index) => {
      const oldProd = products[index];
      return (
        newProd.price !== oldProd?.price ||
        newProd.image?.[0] !== oldProd?.image?.[0] ||
        (newProd as any)._cacheKey !== (oldProd as any)._cacheKey
      );
    });

    if (hasSignificantChanges) {
      setProducts(updatedProducts);
      // Mettre à jour la référence du dernier update
      lastProductUpdateRef.current = Date.now().toString();
    }
  }, [userProducts, products, setProducts]);

  // Filtrage des produits
  useEffect(() => {
    if (!catalog || !products) return;

    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    setFilteredProducts(filtered);
  }, [catalog, searchQuery, selectedCategory, products]);

  const categories =
    products?.reduce((cats, product) => {
      if (product.category && !cats.includes(product.category)) {
        cats.push(product.category);
      }
      return cats;
    }, [] as string[]) || [];

  const handleAddToCart = (product: CatalogProduct) => {
    addToCart(product, 1);
    toast({
      title: "Produit ajouté au panier",
      description: `${product.name} a été ajouté à votre panier.`,
    });
  };

  const handleBuyNow = (product: CatalogProduct) => {
    addToCart(product, 1);
    setProductForBuyNow(product);
    toast({
      title: "Produit ajouté au panier",
      description: `${product.name} a été ajouté. Remplissez vos informations pour finaliser l'achat.`,
    });
  };

  const handleBuyNowProcessed = () => {
    setProductForBuyNow(null);
  };

  const handleProductClick = (productId: string) => {
    router.push(`/catalog/${catalogId}/product/${productId}`);
  };

  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
  };

  // Fonction optimisée pour obtenir l'URL de l'image
  const getImageUrl = (product: CatalogProduct) => {
    const baseUrl = product?.image?.[0];
    if (!baseUrl) return "/placeholder.jpg";

    // Si nous avons une clé de cache, l'utiliser
    const cacheKey =
      (product as any)._cacheKey || imageCacheRef.current.get(product.id);
    if (cacheKey) {
      // Pour les URLs locales, ajouter la clé de cache
      if (
        baseUrl.includes("localhost") ||
        baseUrl.includes("127.0.0.1") ||
        baseUrl.startsWith("/")
      ) {
        return `${baseUrl}${
          baseUrl.includes("?") ? "&" : "?"
        }cache=${cacheKey}`;
      }
    }

    return baseUrl;
  };

  // Gestion d'erreur simple pour les images
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement>,
    productId: string
  ) => {
    const img = e.target as HTMLImageElement;
    // Essayer de recharger sans cache
    const currentSrc = img.src;
    if (!currentSrc.includes("?")) {
      img.src = `${currentSrc}?retry=${Date.now()}`;
    } else if (!currentSrc.includes("retry=")) {
      img.src = `${currentSrc}&retry=${Date.now()}`;
    } else {
      img.src = "/placeholder.jpg";
    }
  };

  if (!catalog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto animate-spin animation-delay-150"></div>
          </div>
          <p className="text-gray-600 font-medium">
            Chargement du catalogue...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Header */}
      <div className="bg-white shadow-lg border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start space-x-6">
              <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                <AvatarImage
                  src={catalog.userAvatar || "/placeholder.svg"}
                  alt={catalog.title}
                />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {catalog.creatorName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {catalog.title}
                </h1>
                <div className="flex items-center space-x-4 mb-3">
                  <p className="text-lg text-gray-700 font-medium">
                    {catalog.creatorName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder={`${t("search")}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                className={`whitespace-nowrap rounded-xl ${
                  selectedCategory === "all"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "hover:bg-gray-50"
                }`}
              >
                {t("allProducts")}
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap rounded-xl ${
                    selectedCategory === category
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            {t("showing")} {filteredProducts.length} {t("of")}{" "}
            {products?.length || 0} {t("products")}
            {selectedCategory !== "all" && ` in ${selectedCategory}`}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <Card
              key={`${product.id}-${(product as any)._cacheKey || ""}`}
              className="group overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white rounded-2xl border-0 shadow-lg"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="relative">
                <div
                  className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden cursor-pointer"
                  onClick={() => handleProductClick(product.id)}
                >
                  <img
                    src={getImageUrl(product)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => handleImageError(e, product.id)}
                    loading="lazy"
                    // Important: Ajouter un style pour éviter le flash
                    style={{
                      opacity: 1,
                      transition: "opacity 0.2s ease-in-out",
                    }}
                    onLoad={(e) => {
                      // S'assurer que l'image est immédiatement visible
                      (e.target as HTMLImageElement).style.opacity = "1";
                    }}
                  />
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge
                        variant="secondary"
                        className="bg-white/90 text-gray-800 font-semibold"
                      >
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-200 shadow-lg"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors duration-200 ${
                        favorites.has(product.id)
                          ? "fill-red-500 text-red-500"
                          : "text-gray-600 hover:text-red-500"
                      }`}
                    />
                  </button>
                </div>
                <CardContent className="p-6">
                  <div className="mb-3">
                    <Badge
                      variant="outline"
                      className="text-xs font-medium text-blue-600 border-blue-200 bg-blue-50"
                    >
                      {product.category}
                    </Badge>
                  </div>
                  <h3
                    className="font-bold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors duration-200"
                    onClick={() => handleProductClick(product.id)}
                  >
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      XAF{product.price}
                    </span>
                    {product.inStock && (
                      <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                        {product.inStock} {t("instock")}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={!product.inStock}
                      className={`flex-1 rounded-xl font-semibold transition-all duration-200 ${
                        product.inStock
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {product.inStock ? (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {t("addToCart")}
                        </>
                      ) : (
                        "Out of Stock"
                      )}
                    </Button>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyNow(product);
                      }}
                      disabled={!product.inStock}
                      className={`flex-1 rounded-xl font-semibold transition-all duration-200 ${
                        product.inStock
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {product.inStock ? (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Buy Now
                        </>
                      ) : (
                        "Out of Stock"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              We couldn't find any products matching your search criteria. Try
              adjusting your filters or search terms.
            </p>
          </div>
        )}
      </div>

      <FloatingCart
        productToBuy={productForBuyNow}
        onBuyNowProcessed={handleBuyNowProcessed}
      />
    </div>
  );
}
