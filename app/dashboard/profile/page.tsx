"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Settings,
  CreditCard,
  Video,
  History,
  ChevronRight,
  DollarSign,
  TrendingUp,
  BarChart3,
  Package,
  Store,
  Shield, // Ajouté pour l'icône admin
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "@/lib/useTranslations";

export default function ProfilePage() {
  const { userInfo, userTransactions, logout } = useAuth();

  const t = useTranslations("Dashboard.Profile");

  // Supprimer la condition isCreator pour afficher tout à tous
  // const isCreator = userInfo?.role === "user" || false;

  const calculateStats = () => {
    const currentBalance = userInfo?.balance || 0;

    if (!userTransactions || userTransactions.length === 0) {
      return {
        totalSales: 0,
        totalEarnings: 0,
        monthlyEarnings: 0,
        currentBalance,
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 🔥 1. Filtrer les transactions valides
    const validTransactions = userTransactions.filter(
      (t) =>
        (t.type === "deposit" || t.type === "sale") &&
        (t.status === "SUCCESSFUL" || t.status === "COMPLETED")
    );

    // 🔥 2. Calcul des gains totaux
    const totalEarnings = validTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );

    // 🔥 3. Transactions du mois
    const monthlyTransactions = validTransactions.filter((transaction) => {
      if (!transaction.createdAt) return false;
      const transactionDate =
        transaction.createdAt instanceof Date
          ? transaction.createdAt
          : new Date(transaction.createdAt);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    // 🔥 4. Gains du mois
    const monthlyEarnings = monthlyTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );

    // 🔥 5. Nombre de ventes valides
    const totalSales = validTransactions.filter(
      (t) => t.type === "sale"
    ).length;

    return {
      totalSales,
      totalEarnings,
      monthlyEarnings,
      currentBalance,
    };
  };

  const stats = calculateStats();

  if (!userInfo) return null;

  return (
    <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-3 bg-gray-200 flex items-center justify-center">
            {userInfo.photoURL ? (
              <img
                src={userInfo.photoURL}
                alt={userInfo.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-lg font-semibold text-gray-600">
                {userInfo.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">{userInfo.name}</h2>
            <p className="text-sm text-gray-500">{userInfo.phone}</p>
            <p className="text-xs text-gray-400 capitalize">{userInfo.role}</p>
          </div>
          <Link href="/dashboard/profile/edit" className="ml-auto">
            <Button variant="outline" size="sm">
              {t("editProfileButton")}
            </Button>
          </Link>
        </div>
      </header>

      {/* ✅ AFFICHAGE FINANCIER POUR TOUS LES UTILISATEURS */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">
          {t("financialOverview")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {/* ✅ CARTE SOLDE ACTUEL */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-gray-500">
                  {t("currentBalance")}
                </h3>
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
              <p
                className={`text-2xl font-bold ${
                  stats.currentBalance >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                XAF {stats.currentBalance.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.currentBalance >= 0 ? "Solde disponible" : "Découvert"}
              </p>
            </CardContent>
          </Card>

          {/* ✅ CARTE GAINS DU MOIS */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-gray-500">{t("thisMonth")}</h3>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">
                XAF {stats.monthlyEarnings.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Gains ce mois</p>
            </CardContent>
          </Card>

          {/* ✅ CARTE RÉSUMÉ COMPLET */}
          <Card className="col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-gray-500">
                  {t("totalEarnings")}
                </h3>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">
                XAF {stats.totalEarnings.toLocaleString()}
              </p>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-gray-500">
                  Ventes totales: {stats.totalSales}
                </span>
                <Link
                  href="/dashboard/profile/transactions"
                  className="text-blue-600 flex items-center hover:text-blue-700"
                >
                  {t("details")} <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ✅ ACTIONS RAPIDES POUR TOUS */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">{t("quickActions")}</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Boutons visibles pour tous les utilisateurs */}
          <Link href="/dashboard/products">
            <Button
              variant="outline"
              className="w-full h-auto py-6 flex flex-col"
            >
              <Package className="h-6 w-6 mb-2" />
              <span>{t("myProducts")}</span>
            </Button>
          </Link>

          <Link href="/dashboard/profile/catalogs">
            <Button
              variant="outline"
              className="w-full h-auto py-6 flex flex-col bg-transparent"
            >
              <Store className="h-6 w-6 mb-2" />
              <span>{t("myCatalogs")}</span>
            </Button>
          </Link>

          <Link href="/dashboard/lives">
            <Button
              variant="outline"
              className="w-full h-auto py-6 flex flex-col"
            >
              <Video className="h-6 w-6 mb-2" />
              <span>{t("liveSales")}</span>
            </Button>
          </Link>

          <Link href="/dashboard/profile/payment-methods">
            <Button
              variant="outline"
              className="w-full h-auto py-6 flex flex-col"
            >
              <CreditCard className="h-6 w-6 mb-2" />
              <span>{t("paymentMethods")}</span>
            </Button>
          </Link>

          {/* ✅ BOUTON ADMIN DASHBOARD (visible uniquement pour les admins) */}
          {userInfo?.role === "admin" && (
            <Link href="/dashboard/admin" className="col-span-2">
              <Button
                variant="default"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Button>
            </Link>
          )}

          <Link href="/dashboard/profile/transactions" className="col-span-2">
            <Button variant="outline" className="w-full">
              <History className="h-4 w-4 mr-2" />
              Historique des transactions
            </Button>
          </Link>
        </div>
      </section>

      {/* ✅ PARAMÈTRES DU COMPTE */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">{t("accountSettings")}</h2>
        </div>
        <Card>
          <CardContent className="p-0">
            <Link
              href="/dashboard/profile/edit"
              className="flex items-center justify-between p-4 border-b hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Settings className="h-5 w-5 mr-3 text-gray-500" />
                <span>{t("editProfileButton")}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
            <Link
              href="/dashboard/profile/payment-methods"
              className="flex items-center justify-between p-4 border-b hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-3 text-gray-500" />
                <span>{t("paymentMethods")}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Settings className="h-5 w-5 mr-3 text-gray-500" />
                <span>{t("appSettings")}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button
              variant="outline"
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
              onClick={logout}
            >
              {t("logOut")}
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}