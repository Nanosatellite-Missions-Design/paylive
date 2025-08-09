"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Cart, CartItem, Catalog, CatalogProduct } from "@/types/catalog"

interface CartContextType {
  cart: Cart | null
  catalog: Catalog | null
  products: CatalogProduct[]
  setCatalog: (catalog: any) => void
  addToCart: (product: CatalogProduct, quantity: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setCatalogData: React.Dispatch<React.SetStateAction<Catalog | null>>
  setProducts: React.Dispatch<React.SetStateAction<CatalogProduct[]>>
  getCartItemCount: () => number
  getCartTotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [catalog, setCatalogData] = useState<Catalog | null>(null)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("catalog-cart")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error("Error loading cart from localStorage:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart) {
      localStorage.setItem("catalog-cart", JSON.stringify(cart))
    }
  }, [cart])
  

  const setCatalog = (catalog: any) => {
    console.log(catalog)
    // If switching to a different catalog, clear the cart
    setCatalogData(catalog)
    if (cart && cart.catalogId !== catalog.id) {
      setCart({
        catalogId: catalog.id,
        catalogTitle: catalog.name,
        sellerName: catalog.name,
        items: [],
        total: 0,
      })
    } else if (!cart) {
      setCart({
        catalogId: catalog.id,
        catalogTitle: catalog.name,
        sellerName: catalog.name,
        items: [],
        total: 0,
      })
    }
  }

  const addToCart = (product: CatalogProduct, quantity: number) => {
    console.log("testing")

    if (!cart) return
    console.log("testing")

    const existingItemIndex = cart.items.findIndex((item) => item.productId === product.id)

    let newItems: CartItem[]
    if (existingItemIndex >= 0) {
      // Update existing item
      newItems = cart.items.map((item, index) =>
        index === existingItemIndex ? { ...item, quantity: item.quantity + quantity } : item,
      )
    } else {
      // Add new item
      newItems = [...cart.items, { productId: product.id, product, quantity }]
    }

    const newTotal = newItems.reduce((total, item) => total + item.product.price * item.quantity, 0)
    console.log(newTotal)
    console.log(newItems)
    setCart({
      ...cart,
      items: newItems,
      total: newTotal,
    })
  }

  const removeFromCart = (productId: string) => {
    if (!cart) return

    const newItems = cart.items.filter((item) => item.productId !== productId)
    const newTotal = newItems.reduce((total, item) => total + item.product.price * item.quantity, 0)

    setCart({
      ...cart,
      items: newItems,
      total: newTotal,
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (!cart) return

    const newItems = cart.items.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    const newTotal = newItems.reduce((total, item) => total + item.product.price * item.quantity, 0)

    setCart({
      ...cart,
      items: newItems,
      total: newTotal,
    })
  }

  const clearCart = () => {
    if (cart) {
      setCart({
        ...cart,
        items: [],
        total: 0,
      })
      localStorage.removeItem("catalog-cart")
    }
  }

  const getCartItemCount = () => {
    return cart?.items.reduce((count, item) => count + item.quantity, 0) || 0
  }

  const getCartTotal = () => {
    return cart?.total || 0
  }

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
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
