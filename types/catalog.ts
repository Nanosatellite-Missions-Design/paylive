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
  id: string
  uid: string
  name: string
  isActive: string
  productCount: number
  views: number
  creatorName: string
  creatorId: string
  creatorPhone: number
  userAvatar?: string
  title: string
  phone: number
  description: string
  createdAt: Date
  updatedAt: Date
  products: CatalogProduct[]
  selectedProducts: CatalogProduct[]
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
