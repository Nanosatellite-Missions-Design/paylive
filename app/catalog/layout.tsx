"use client"
import React from "react"
import { CartProvider, useCart } from "@/contexts/cart-context"
import FloatingCart from "@/components/cart"
import { useAuth } from "@/contexts/auth-context"
import { getADocument } from "@/functions/get-a-document"
import { listenToSubCollection } from "@/functions/get-a-sub-collection"
import { useParams } from "next/navigation"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const { addToCart, catalog, products, setProducts, setCatalog } = useCart()
    const [isLoading, setIsLoading] = React.useState(true)
    const params = useParams()
    const catalogId = params.id as string
    
    React.useEffect(() => {
      const fetchCatalog = async () => {
        setIsLoading(true);

        // Listen to catalog doc changes
        const unsubscribeUser = getADocument(catalogId, "catalogs", (data) => {
          setCatalog(data);

          // Extract products field if present
          if (data?.products) {
            setProducts(data.products);
          } else {
            setProducts([]); // fallback if no products field
          }
        });

        setIsLoading(false);

        // Cleanup function
        return () => {
          if (unsubscribeUser) unsubscribeUser();
        };
      };

      fetchCatalog();
    }, [catalogId]);

    return (
        <CartProvider>
            {children}
            <FloatingCart />
        </CartProvider>
    )
}
