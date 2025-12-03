"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import type { Cart, CartItem, Catalog, CatalogProduct } from "@/types/catalog";

interface CartContextType {
  cart: Cart | null;
  catalog: Catalog | null;
  products: CatalogProduct[];
  setCatalog: (catalog: any) => void;
  addToCart: (product: CatalogProduct, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCatalogData: React.Dispatch<React.SetStateAction<Catalog | null>>;
  setProducts: React.Dispatch<React.SetStateAction<CatalogProduct[]>>;
  getCartItemCount: () => number;
  getCartTotal: () => number;
  isInitialized: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [catalog, setCatalogData] = useState<Catalog | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
        // Créer un panier vide en cas d'erreur
        const newCart: Cart = {
          catalogId: "default",
          catalogTitle: "Panier d'achat",
          sellerName: "Vendeur",
          items: [],
          total: 0,
        };
        setCart(newCart);
      }
    } else {
      // Initialiser un panier vide si rien dans localStorage
      const newCart: Cart = {
        catalogId: "default",
        catalogTitle: "Panier d'achat",
        sellerName: "Vendeur",
        items: [],
        total: 0,
      };
      setCart(newCart);
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart]);

  const setCatalog = (catalogData: any) => {
    setCatalogData(catalogData);

    if (!cart) {
      const newCart: Cart = {
        catalogId: catalogData.id,
        catalogTitle: catalogData.title || catalogData.name,
        sellerName: catalogData.creatorName,
        items: [],
        total: 0,
      };
      setCart(newCart);
    } else if (cart.catalogId !== catalogData.id) {
      setCart({
        catalogId: catalogData.id,
        catalogTitle: catalogData.title || catalogData.name,
        sellerName: catalogData.creatorName,
        items: [],
        total: 0,
      });
    }
  };

  const addToCart = (product: CatalogProduct, quantity: number) => {
    console.log("🛒 addToCart appelé avec:", product.name, quantity);

    if (!cart) {
      console.log("📦 Création d'un nouveau panier...");
      const newCart: Cart = {
        catalogId: product.creatorId || "default-catalog",
        catalogTitle: "Panier d'achat",
        sellerName: product.creatorName || "Vendeur",
        items: [{ productId: product.id, product, quantity }],
        total: product.price * quantity,
      };
      setCart(newCart);
      console.log("✅ Nouveau panier créé:", newCart);
      return;
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === product.id
    );

    let newItems: CartItem[];
    if (existingItemIndex >= 0) {
      newItems = cart.items.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newItems = [...cart.items, { productId: product.id, product, quantity }];
    }

    const newTotal = newItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );

    const updatedCart = {
      ...cart,
      items: newItems,
      total: newTotal,
    };

    setCart(updatedCart);
    console.log("🛒 Panier mis à jour:", updatedCart);
  };

  const removeFromCart = (productId: string) => {
    if (!cart) return;

    const newItems = cart.items.filter((item) => item.productId !== productId);
    const newTotal = newItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );

    setCart({
      ...cart,
      items: newItems,
      total: newTotal,
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (!cart) return;

    const newItems = cart.items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );
    const newTotal = newItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );

    setCart({
      ...cart,
      items: newItems,
      total: newTotal,
    });
  };

  const clearCart = () => {
    if (cart) {
      setCart({
        ...cart,
        items: [],
        total: 0,
      });
      localStorage.removeItem("cart");
    }
  };

  const getCartItemCount = () => {
    return cart?.items.reduce((count, item) => count + item.quantity, 0) || 0;
  };

  const getCartTotal = () => {
    return cart?.total || 0;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        setCatalog,
        addToCart,
        catalog,
        products,
        setCatalogData,
        setProducts,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartItemCount,
        getCartTotal,
        isInitialized,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}