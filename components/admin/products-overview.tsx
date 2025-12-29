// components/admin/products-overview.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Eye,
  MoreVertical,
} from "lucide-react";

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  totalSales: number;
  totalRevenue: number;
  averagePrice: number;
  byCategory: Record<string, number>;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  status: string;
  salesCount: number;
  creatorName: string;
  createdAt: string;
}

export default function ProductsOverview() {
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    averagePrice: 0,
    byCategory: {},
  });

  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductData();
  }, []);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/products");
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setStats(data.stats);
      setTopProducts(data.topProducts || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des produits...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produits</CardTitle>
        <CardDescription>Vue d'ensemble des produits et ventes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Statistiques produits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Produits totaux</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            {/* <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Actifs</p>
                  <p className="text-2xl font-bold">{stats.activeProducts}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ventes totales</p>
                  <p className="text-2xl font-bold">{stats.totalSales}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Revenus</p>
                  <p className="text-2xl font-bold">
                    {formatAmount(stats.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-500" />
              </div>
            </div> */}
          </div>

          {/* Produits populaires */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Produits les plus vendus</h3>
              <Button variant="ghost" size="sm" onClick={fetchProductData}>
                Rafraîchir
              </Button>
            </div>
            <div className="space-y-3">
              {topProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-gray-100">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium truncate">{product.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Par {product.creatorName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatAmount(product.price)}</p>
                    <p className="text-sm text-gray-500">
                      {product.salesCount} ventes
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Catégories */}
          {Object.keys(stats.byCategory).length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Par catégorie</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(stats.byCategory).map(([category, count]) => (
                  <div key={category} className="border rounded-lg p-3">
                    <p className="text-sm text-gray-500 capitalize">{category}</p>
                    <p className="text-xl font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}