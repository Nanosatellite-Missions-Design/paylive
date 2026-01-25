// app/dashboard/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Package,
  MessageSquare,
  BarChart3,
  Calendar,
  DollarSign,
  Loader2,
  RefreshCw,
} from "lucide-react";
import AdminStats from "@/components/admin/admin-stats";
import UsersTable from "@/components/admin/users-table";
import TransactionsOverview from "@/components/admin/transactions-overview";
import ProductsOverview from "@/components/admin/products-overview";
import TelegramOverview from "@/components/admin/telegram-overview";

export default function AdminDashboardPage() {
  const { userInfo, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalTelegramGroups: 0,
    totalTelegramSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeCreators: 0,
    pendingWithdrawals: 0,
  });

  useEffect(() => {
    // if (userInfo?.role !== "admin") {
    //   router.push("/dashboard/profile");
    //   return;
    // }
    fetchStats();
  }, [userInfo]);
  const handlevoucherclick = () => {
    router.push("/dashboard/admin/vouchers");
  };
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord Administrateur</h1>
          <p className="text-gray-600">Vue d'ensemble de l'application</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
          <Button variant="outline" onClick={logout}>
            Déconnexion
          </Button>
          <Button variant="outline" onClick={handlevoucherclick}>
            Vouhcers
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <AdminStats stats={stats} />

      {/* Onglets */}
      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <CreditCard className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Produits
          </TabsTrigger>
          <TabsTrigger value="telegram">
            <MessageSquare className="h-4 w-4 mr-2" />
            Telegram
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TransactionsOverview />
            <TelegramOverview />
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UsersTable />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionsOverview detailed />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductsOverview />
        </TabsContent>

        <TabsContent value="telegram" className="mt-6">
          <TelegramOverview detailed />
        </TabsContent>
      </Tabs>
    </div>
  );
}
