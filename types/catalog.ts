export interface CatalogProduct {
  id: string
  name: string
  description: string
  price: number
  image?: string[]
  images?: string[]
  category: string
  inStock: number
  creatorName: string
  creatorId: string
  createdAt: Date
  updatedAt: Date
}

export interface Catalog {
  uid: string
  name: string
  userAvatar?: string
  title?: string
  phone: number
  description?: string
  createdAt: Date
  updatedAt: Date
  products: CatalogProduct[]
}

export interface CartItem {
  productId: string
  product: CatalogProduct
  quantity: number
}

export interface Cart {
  catalogId: string
  catalogTitle: string
  sellerName: string
  items: CartItem[]
  total: number
}
