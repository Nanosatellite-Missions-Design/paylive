import type React from "react"
import { CartProvider } from "@/contexts/cart-context"
import FloatingCart from "@/components/cart"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
    return (
        <CartProvider>
            {children}
            <FloatingCart />
        </CartProvider>
    )
}
