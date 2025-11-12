"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ShoppingCart,
  Gavel,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Download,
  Plus,
  Minus,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import WithdrawDialog from "@/components/withdraw-dialog";
import type {
  Transaction,
  FinancialStats,
  WithdrawRequest,
} from "@/types/financial";
import { Timestamp } from "firebase/firestore";
import { useTranslations } from "@/lib/useTranslations";

// ✅ Interface pour vos transactions réelles
interface RealTransaction {
  id: string;
  type: "deposit" | "withdrawal" | "purchase" | "sale";
  amount: number;
  currency?: string;
  status: string;
  createdAt: any; // Timestamp ou string
  timestamp?: string;
  product?: string;
  phoneNumber?: string;
  provider?: string;
  country?: string;
  depositId?: string;
  netAmount?: number;
  fees?: number;
}

export default function TransactionsPage() {
  const { userInfo, userTransactions } = useAuth();
  const t = useTranslations("Dashboard.Transactions");

  // ✅ UTILISER LES DONNÉES RÉELLES - Supprimer les mocks
  const isCreator = userInfo?.role === "user" || false;
  // const isCreator = userInfo?.role === "creator" || false;

  // const currentBalance = userInfo?.balance || 0;
  const currentBalance =
    userTransactions?.reduce((balance, transaction) => {
      if (transaction.type === "deposit" || transaction.type === "sale") {
        return balance + (transaction.amount || 0);
      } else if (
        transaction.type === "withdrawal" ||
        transaction.type === "purchase"
      ) {
        return balance - (transaction.amount || 0);
      }
      return balance;
    }, 0) || 0;

  // ✅ CORRECTION : Formater les transactions depuis Firebase
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
      });
    } catch (error) {
      console.error("Erreur format date:", error);
      return "Date inconnue";
    }
  };

  // ✅ CORRECTION : Grouper par mois avec gestion d'erreur
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

  // ✅ TRI DES TRANSACTIONS AVEC GESTION D'ERREUR
  const sortedTransactions = [...(userTransactions || [])]
    .map((transaction) => ({
      ...transaction,
      // ✅ S'assurer que amount est un number
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
          return new Date(0); // Date par défaut
        };

        const dateA = getDate(a);
        const dateB = getDate(b);
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        return 0;
      }
    });

  // ✅ GROUPAGE CORRIGÉ
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

  // ✅ ICÔNES CORRECTES POUR TOUS LES TYPES
  const getTransactionIcon = (type: RealTransaction["type"]) => {
    switch (type) {
      case "purchase":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />; // Débit
      case "sale":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />; // Crédit
      case "deposit":
        return <Plus className="h-4 w-4 text-green-500" />; // Dépôt = crédit
      case "withdrawal":
        return <Minus className="h-4 w-4 text-red-500" />; // Retrait = débit
      // case "auction":refund
      // case "refund":
      //   return <Gavel className="h-4 w-4 text-amber-500" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  // ✅ BADGES DE STATUT
  const getStatusBadge = (status: string) => {
    const statusText = status?.toLowerCase() || "pending";

    switch (statusText) {
      case "completed":
      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Complété
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            En attente
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Échec
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  // ✅ FONCTION DE RETRAIT RÉELLE
  const handleWithdraw = async (request: WithdrawRequest) => {
    try {
      // Implémentez votre appel API réel ici
      console.log("Withdrawal request:", request);

      // Exemple d'appel API :
      const response = await fetch("/api/pawapay/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) throw new Error("Erreur de retrait");
      return await response.json();

      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { success: true };
    } catch (error) {
      console.error("Withdrawal failed:", error);
      throw error;
    }
  };

  // ✅ RENDU DES TRANSACTIONS CORRIGÉ
  const renderTransactionList = (transactionList: RealTransaction[]) => (
    <div className="space-y-3">
      {transactionList.map((transaction) => {
        const displayAmount = transaction.netAmount || transaction.amount;
        const isCredit =
          transaction.type === "deposit" || transaction.type === "sale";
        const isDebit =
          transaction.type === "withdrawal" || transaction.type === "purchase";

        return (
          <Card key={transaction.id || transaction.depositId}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium capitalize">
                      {transaction.type === "purchase" && "Achat"}
                      {transaction.type === "sale" && "Vente"}
                      {transaction.type === "deposit" && "Dépôt"}
                      {transaction.type === "withdrawal" && "Retrait"}
                    </h3>
                    {getStatusBadge(transaction.status)}
                  </div>

                  <p className="text-sm text-gray-500">
                    {formatTransactionDate(transaction)}
                  </p>

                  <p className="text-xs text-gray-400">
                    {transaction.type === "deposit" &&
                      `Dépôt mobile • ${transaction.provider}`}
                    {transaction.type === "purchase" &&
                      `Achat: ${transaction.product || "Produit"}`}
                    {transaction.type === "withdrawal" &&
                      `Retrait vers ${transaction.phoneNumber}`}
                    {transaction.type === "sale" &&
                      `Vente: ${transaction.product || "Produit"}`}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={`font-medium ${
                      isCredit
                        ? "text-green-600"
                        : isDebit
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {isCredit ? "+" : isDebit ? "-" : ""}
                    {transaction.currency || "XAF"}
                    {displayAmount}
                  </p>

                  {transaction.fees && transaction.fees > 0 && (
                    <p className="text-xs text-gray-500">
                      Frais: {transaction.currency || "XAF"}
                      {transaction.fees}
                    </p>
                  )}

                  {transaction.depositId && (
                    <p className="text-xs text-gray-400 truncate max-w-[120px]">
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

  // ✅ COMPOSANT POUR ÉTAT VIDE
  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <ShoppingCart className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-gray-500">{message}</p>
    </div>
  );

  // ✅ CALCUL DES RETRAITS EN ATTENTE RÉELS
  const pendingWithdrawals =
    userTransactions?.filter(
      (t: RealTransaction) => t.type === "withdrawal" && t.status === "pending"
    ).length || 0;

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

      {/* ✅ CARTE DE SOLDE - CORRIGÉE */}
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
                <p className="text-3xl font-bold text-green-600">
                  XAF{currentBalance.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">{t("available")}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold">
                    XAF{currentBalance.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{t("thisMonth")}</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    XAF{(currentBalance * 0.1).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{t("pending")}</p>
                </div>
              </div>

              <WithdrawDialog
                currentBalance={currentBalance}
                pendingWithdrawals={pendingWithdrawals}
                onWithdraw={handleWithdraw}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="all" className="flex-1">
            {t("all")}
          </TabsTrigger>
          <TabsTrigger value="deposits" className="flex-1">
            Dépôts
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex-1">
            {t("withdrawal")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {sortedTransactions.length === 0 ? (
            <EmptyState message="Aucune transaction trouvée" />
          ) : (
            Object.entries(groupedTransactions).map(([month, transactions]) => (
              <div key={month} className="mb-6">
                <h2 className="text-lg font-semibold mb-3">{month}</h2>
                {renderTransactionList(transactions)}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="deposits">
          {sortedTransactions.filter(
            (t: RealTransaction) => t.type === "deposit"
          ).length === 0 ? (
            <EmptyState message="Aucun dépôt trouvé" />
          ) : (
            Object.entries(groupedTransactions).map(([month, transactions]) => {
              const deposits = transactions.filter(
                (t: RealTransaction) => t.type === "deposit"
              );
              if (deposits.length === 0) return null;

              return (
                <div key={month} className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">{month}</h2>
                  {renderTransactionList(deposits)}
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="withdrawals">
          {sortedTransactions.filter(
            (t: RealTransaction) => t.type === "withdrawal"
          ).length === 0 ? (
            <EmptyState message="Aucun retrait trouvé" />
          ) : (
            Object.entries(groupedTransactions).map(([month, transactions]) => {
              const withdrawals = transactions.filter(
                (t: RealTransaction) => t.type === "withdrawal"
              );
              if (withdrawals.length === 0) return null;

              return (
                <div key={month} className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">{month}</h2>
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
