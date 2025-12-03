"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Plus,
  Minus,
  X,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import WithdrawDialog from "@/components/withdraw-dialog";
import type { WithdrawRequest } from "@/types/financial";
import { Timestamp } from "firebase/firestore";
import { useTranslations } from "@/lib/useTranslations";

// ✅ INTERFACE SIMPLIFIÉE POUR LES TRANSACTIONS
interface RealTransaction {
  id: string;
  type: "sales" | "withdrawal" | "purchase"; // Types simplifiés
  amount: number;
  currency?: string;
  status: string;
  createdAt: any;
  timestamp?: string;
  product?: string;
  phoneNumber?: string;
  provider?: string;
  country?: string;
  depositId?: string;
}

export default function TransactionsPage() {
  const { userInfo, userTransactions } = useAuth();
  const t = useTranslations("Dashboard.Transactions");

  // ✅ UTILISER LE BALANCE DE USERINFO
  const isCreator = userInfo?.role === "user" || false;
  const currentBalance = userInfo?.balance || 0;

  // ✅ FONCTION POUR OBTENIR LE STATUT RÉEL
  const getTransactionStatus = (transaction: RealTransaction): string => {
    return transaction.status?.toLowerCase() || "pending";
  };

  // ✅ FILTRER LES TRANSACTIONS VALIDES
  const getValidTransactions = () => {
    return (userTransactions || []).filter((transaction) => {
      // Exclure les transactions avec des IDs de test
      if (transaction.id === "idle" || transaction.id === "other") {
        return false;
      }
      if (
        transaction.depositId === "idle" ||
        transaction.depositId === "other"
      ) {
        return false;
      }

      const status = getTransactionStatus(transaction);

      // Exclure uniquement les transactions vraiment échouées
      if (
        status === "failed" ||
        status === "cancelled" ||
        status === "rejected" ||
        status === "declined"
      ) {
        return false;
      }

      return true;
    });
  };

  const validTransactions = getValidTransactions();

  // ✅ FORMATER LES DATES
  const formatTransactionDate = (transaction: RealTransaction) => {
    try {
      let date: Date;

      if (transaction.createdAt instanceof Timestamp) {
        date = transaction.createdAt.toDate();
      } else if (transaction.timestamp) {
        date = new Date(transaction.timestamp);
      } else if (typeof transaction.createdAt === "string") {
        date = new Date(transaction.createdAt);
      } else {
        date = new Date();
      }

      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Erreur format date:", error);
      return "Date inconnue";
    }
  };

  // ✅ GROUPER PAR MOIS
  const getTransactionMonth = (transaction: RealTransaction) => {
    try {
      let date: Date;

      if (transaction.createdAt instanceof Timestamp) {
        date = transaction.createdAt.toDate();
      } else if (transaction.timestamp) {
        date = new Date(transaction.timestamp);
      } else if (typeof transaction.createdAt === "string") {
        date = new Date(transaction.createdAt);
      } else {
        date = new Date();
      }

      return date.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return "Date inconnue";
    }
  };

  // ✅ TRI DES TRANSACTIONS
  const sortedTransactions = validTransactions
    .map((transaction) => ({
      ...transaction,
      // Convertir les anciens types aux nouveaux
      type: convertTransactionType(transaction.type),
      amount:
        typeof transaction.amount === "number"
          ? transaction.amount
          : Number(transaction.amount) || 0,
    }))
    .sort((a, b) => {
      try {
        const getDate = (t: RealTransaction) => {
          if (t.createdAt instanceof Timestamp) return t.createdAt.toDate();
          if (t.timestamp) return new Date(t.timestamp);
          if (typeof t.createdAt === "string") return new Date(t.createdAt);
          return new Date(0);
        };

        const dateA = getDate(a);
        const dateB = getDate(b);
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        return 0;
      }
    });

  // ✅ CONVERTIR LES ANCIENS TYPES AUX NOUVEAUX
  function convertTransactionType(oldType: string): "sales" | "withdrawal" | "purchase" {
    switch (oldType) {
      case "deposit":
      case "sale":
        return "sales"; // Les deux deviennent "sales"
      case "purchase":
        return "purchase";
      case "withdrawal":
        return "withdrawal";
      default:
        return "sales"; // Par défaut
    }
  }

  // ✅ GROUPAGE DES TRANSACTIONS
  const groupedTransactions = sortedTransactions.reduce(
    (groups: Record<string, RealTransaction[]>, transaction) => {
      const month = getTransactionMonth(transaction);
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(transaction);
      return groups;
    },
    {}
  );

  // ✅ ICÔNES SIMPLIFIÉES
  const getTransactionIcon = (type: RealTransaction["type"]) => {
    switch (type) {
      case "purchase":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case "sales":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case "withdrawal":
        return <Minus className="h-4 w-4 text-red-500" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  // ✅ BADGES DE STATUT
  const getStatusBadge = (transaction: RealTransaction) => {
    const status = getTransactionStatus(transaction);

    switch (status) {
      case "successful":
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Complété
          </Badge>
        );
      case "processing":
      case "pending":
      case "initiated":
      case "accepted":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case "failed":
      case "declined":
      case "rejected":
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
            <X className="h-3 w-3 mr-1" />
            Échec
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
            {status}
          </Badge>
        );
    }
  };

  // ✅ RENDU DES TRANSACTIONS
  const renderTransactionList = (transactionList: RealTransaction[]) => (
    <div className="space-y-3">
      {transactionList.map((transaction) => {
        const isCredit = transaction.type === "sales";
        const isDebit = transaction.type === "purchase" || transaction.type === "withdrawal";

        // Ne pas afficher les transactions échouées
        const status = getTransactionStatus(transaction);
        if (
          status === "failed" ||
          status === "cancelled" ||
          status === "rejected" ||
          status === "declined"
        ) {
          return null;
        }

        return (
          <Card
            key={transaction.id || transaction.depositId}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium capitalize text-sm">
                      {transaction.type === "purchase" && "Achat"}
                      {transaction.type === "sales" && "Vente"}
                      {transaction.type === "withdrawal" && "Retrait"}
                    </h3>
                    {getStatusBadge(transaction)}
                  </div>

                  <p className="text-sm text-gray-500 mb-1">
                    {formatTransactionDate(transaction)}
                  </p>

                  <p className="text-xs text-gray-400 truncate">
                    {transaction.type === "sales" && transaction.provider
                      ? `${transaction.product || "Vente"} • ${transaction.provider}`
                      : transaction.type === "sales"
                      ? transaction.product || "Vente"
                      : transaction.type === "purchase"
                      ? `Achat: ${transaction.product || "Produit"}`
                      : `Retrait vers ${transaction.phoneNumber || "compte"}`
                    }
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-medium text-sm ${
                      isCredit
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {isCredit ? "+" : "-"}
                    {transaction.currency || "XAF"}
                    {transaction.amount?.toLocaleString()}
                  </p>

                  {transaction.depositId && (
                    <p className="text-xs text-gray-400 mt-1 truncate max-w-[100px]">
                      ID: {transaction.depositId.slice(0, 8)}...
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // ✅ ÉTAT VIDE
  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <ShoppingCart className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-gray-500">{message}</p>
    </div>
  );

  // ✅ STATISTIQUES SIMPLIFIÉES
  const transactionStats = {
    total: sortedTransactions.length,
    sales: sortedTransactions.filter((t) => t.type === "sales").length,
    withdrawals: sortedTransactions.filter((t) => t.type === "withdrawal").length,
    purchases: sortedTransactions.filter((t) => t.type === "purchase").length,
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
      <header className="mb-6">
        <div className="flex items-center mb-4">
          <Link href="/dashboard/profile" className="mr-2">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
        </div>
        <p className="text-gray-500">{t("descritption")}</p>
      </header>

      {/* ✅ CARTE DE SOLDE POUR CRÉATEURS */}
      {isCreator && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("currentBalance")}</span>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p
                  className={`text-3xl font-bold ${
                    currentBalance >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  XAF {currentBalance.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">{t("available")}</p>
              </div>

              {/* ✅ BOUTON DE RETRAIT */}
              <WithdrawDialog
                currentBalance={currentBalance}
                pendingWithdrawals={0}
                onWithdraw={async (request: WithdrawRequest) => {
                  try {
                    const response = await fetch("/api/pawapay/withdrawals", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(request),
                    });
                    if (!response.ok) throw new Error("Erreur de retrait");
                    return await response.json();
                  } catch (error) {
                    console.error("Withdrawal failed:", error);
                    throw error;
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ ONGLETS SIMPLIFIÉS - 3 SEULEMENT */}
      <Tabs defaultValue="all">
        <TabsList className="w-full mb-6 grid grid-cols-3">
          <TabsTrigger value="all" className="flex-1 text-xs">
            Tous ({transactionStats.total})
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex-1 text-xs">
            Ventes ({transactionStats.sales})
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex-1 text-xs">
            Retraits ({transactionStats.withdrawals})
          </TabsTrigger>
        </TabsList>

        {/* ✅ TOUTES LES TRANSACTIONS */}
        <TabsContent value="all">
          {sortedTransactions.length === 0 ? (
            <EmptyState message="Aucune transaction trouvée" />
          ) : (
            Object.entries(groupedTransactions).map(([month, transactions]) => (
              <div key={month} className="mb-6">
                <h2 className="text-lg font-semibold mb-3 text-gray-800">
                  {month}
                </h2>
                {renderTransactionList(transactions)}
              </div>
            ))
          )}
        </TabsContent>

        {/* ✅ VENTES SEULEMENT (anciens dépôts + ventes) */}
        <TabsContent value="sales">
          {transactionStats.sales === 0 ? (
            <EmptyState message="Aucune vente trouvée" />
          ) : (
            Object.entries(groupedTransactions).map(([month, transactions]) => {
              const sales = transactions.filter(
                (t: RealTransaction) => t.type === "sales"
              );
              if (sales.length === 0) return null;

              return (
                <div key={month} className="mb-6">
                  <h2 className="text-lg font-semibold mb-3 text-gray-800">
                    {month}
                  </h2>
                  {renderTransactionList(sales)}
                </div>
              );
            })
          )}
        </TabsContent>

        {/* ✅ RETRAITS SEULEMENT */}
        <TabsContent value="withdrawals">
          {transactionStats.withdrawals === 0 ? (
            <EmptyState message="Aucun retrait trouvé" />
          ) : (
            Object.entries(groupedTransactions).map(([month, transactions]) => {
              const withdrawals = transactions.filter(
                (t: RealTransaction) => t.type === "withdrawal"
              );
              if (withdrawals.length === 0) return null;

              return (
                <div key={month} className="mb-6">
                  <h2 className="text-lg font-semibold mb-3 text-gray-800">
                    {month}
                  </h2>
                  {renderTransactionList(withdrawals)}
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}