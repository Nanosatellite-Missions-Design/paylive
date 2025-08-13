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
  isActive: boolean
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

export type Order = {
  id: string;
  catalogId: string;
  createdAt: Date
  updatedAt: Date
  notes: string;
  customer: {
    address: string;
    name: string;
    notes: string;
    phone: string;
  };
  items: {
    product: {
      id: string;
      name: string;
      description: string;
      category: string;
      price: number;
      image: string[];
      status: string;
      inStock: number;
      creatorId: string;
      creatorName: string;
      createdAt: Date
      updatedAt: Date
    };
    productId: string;
    quantity: number;
  }[];
  sellerId: string;
  sellerName: string;
  status: "pending" | "on_the_way" | "delivered"; // e.g., "pending", "completed", etc.
  total: number;
};