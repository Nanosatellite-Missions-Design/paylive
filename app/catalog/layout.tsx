"use client"
import React from "react"
import { CartProvider, useCart } from "@/contexts/cart-context"
import FloatingCart from "@/components/cart"
import { useAuth } from "@/contexts/auth-context"
import { getADocument } from "@/functions/get-a-document"
import { listenToSubCollection } from "@/functions/get-a-sub-collection"
import { useParams } from "next/navigation"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <CatalogLoader>{children}</CatalogLoader>
    </CartProvider>
  );
}

function CatalogLoader({ children }: { children: React.ReactNode }) {
  const { catalog, products, setProducts, setCatalog, setCatalogData } = useCart();
  const params = useParams();
  const catalogId = params.id as string;
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
  const fetchCatalog = async () => {
    setIsLoading(true);

    // Get cart from localStorage
    const savedCart = localStorage.getItem("cart");
    let parsedCart = null;
    if (savedCart) {
      try {
        parsedCart = JSON.parse(savedCart);
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error);
      }
    }

    // Choose the correct callback depending on match
    const callback =
      parsedCart && parsedCart.catalogId === catalogId
        ? (data: any) => setCatalogData(data)
        : (data: any) => setCatalog(data);

    // Always subscribe to Firestore
    const unsubscribeUser = getADocument(catalogId, "catalogs", (data) => {
      callback(data);
      setProducts(data?.selectedProducts || []);
    });

    setIsLoading(false);

    // Always return unsubscribe
    return () => {
      if (unsubscribeUser) unsubscribeUser();
    };
  };

  fetchCatalog();
}, [catalogId]);


  return (
    <>
      {children}
      <FloatingCart />
    </>
  );
}
