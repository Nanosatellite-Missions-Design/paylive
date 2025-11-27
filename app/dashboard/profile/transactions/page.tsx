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
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import WithdrawDialog from "@/components/withdraw-dialog";
import type { WithdrawRequest } from "@/types/financial";
import { Timestamp } from "firebase/firestore";
import { useTranslations } from "@/lib/useTranslations";

// ✅ INTERFACE POUR LES TRANSACTIONS RÉELLES
interface RealTransaction {
  id: string;
  type: "deposit" | "withdrawal" | "purchase" | "sale";
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
  netAmount?: number;
  fees?: number;
}

export default function TransactionsPage() {
  const { userInfo, userTransactions } = useAuth();
  const t = useTranslations("Dashboard.Transactions");

  // ✅ UTILISER LE BALANCE DE USERINFO
  const isCreator = userInfo?.role === "user" || false;
  const currentBalance = userInfo?.balance || 0;

  // ✅ FILTRER LES TRANSACTIONS - EXCLURE LES TRANSACTIONS ÉCHOUÉES OU DE TEST
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

      // ✅ CORRECTION : Exclure les transactions échouées ou annulées
      const status = transaction.status?.toLowerCase();
      if (
        status === "failed" ||
        status === "cancelled" ||
        status === "rejected"
      ) {
        return false;
      }

      return true;
    });
  };

  const validTransactions = getValidTransactions();

  // ✅ FORMATER LES DATES DES TRANSACTIONS
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

  // ✅ ICÔNES CORRECTES POUR TOUS LES TYPES
  const getTransactionIcon = (type: RealTransaction["type"]) => {
    switch (type) {
      case "purchase":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case "sale":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case "deposit":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "withdrawal":
        return <Minus className="h-4 w-4 text-red-500" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  // ✅ BADGES DE STATUT CORRIGÉS - NE PLUS AFFICHER "COMPLÉTÉ" POUR LES ÉCHECS
  const getStatusBadge = (status: string) => {
    const statusText = status?.toLowerCase() || "pending";

    switch (statusText) {
      case "completed":
      case "accepted":
      case "successful":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
            Complété
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case "failed":
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

  // ✅ RENDU DES TRANSACTIONS CORRIGÉ - NE PAS AFFICHER LES ÉCHECS
  const renderTransactionList = (transactionList: RealTransaction[]) => (
    <div className="space-y-3">
      {transactionList.map((transaction) => {
        const displayAmount = transaction.netAmount || transaction.amount;
        const isCredit =
          transaction.type === "deposit" || transaction.type === "sale";
        const isDebit =
          transaction.type === "withdrawal" || transaction.type === "purchase";

        // ✅ NE PAS AFFICHER LES TRANSACTIONS ÉCHOUÉES
        const status = transaction.status?.toLowerCase();
        if (
          status === "failed" ||
          status === "cancelled" ||
          status === "rejected"
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
                      {transaction.type === "sale" && "Vente"}
                      {transaction.type === "deposit" && "Dépôt"}
                      {transaction.type === "withdrawal" && "Retrait"}
                    </h3>
                    {getStatusBadge(transaction.status)}
                  </div>

                  <p className="text-sm text-gray-500 mb-1">
                    {formatTransactionDate(transaction)}
                  </p>

                  <p className="text-xs text-gray-400 truncate">
                    {transaction.type === "deposit" &&
                      `Dépôt mobile • ${
                        transaction.provider || "Mobile Money"
                      }`}
                    {transaction.type === "purchase" &&
                      `Achat: ${transaction.product || "Produit"}`}
                    {transaction.type === "withdrawal" &&
                      `Retrait vers ${transaction.phoneNumber || "compte"}`}
                    {transaction.type === "sale" &&
                      `Vente: ${transaction.product || "Produit"}`}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-medium text-sm ${
                      isCredit
                        ? "text-green-600"
                        : isDebit
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {isCredit ? "+" : isDebit ? "-" : ""}
                    {transaction.currency || "XAF"}
                    {displayAmount?.toLocaleString()}
                  </p>

                  {transaction.fees && transaction.fees > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Frais: {transaction.currency || "XAF"}
                      {transaction.fees.toLocaleString()}
                    </p>
                  )}

                  {transaction.depositId &&
                    transaction.depositId !== "idle" &&
                    transaction.depositId !== "other" && (
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

  // ✅ CALCUL DES RETRAITS EN ATTENTE (UNIQUEMENT LES VALIDES)
  const pendingWithdrawals = validTransactions.filter(
    (t: RealTransaction) => t.type === "withdrawal" && t.status === "pending"
  ).length;

  // ✅ FONCTION DE RETRAIT
  const handleWithdraw = async (request: WithdrawRequest) => {
    try {
      // Implémentez votre appel API réel ici
      console.log("Withdrawal request:", request);

      // Exemple d'appel API
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
  };

  // ✅ STATISTIQUES DES TRANSACTIONS VALIDES SEULEMENT
  const transactionStats = {
    total: sortedTransactions.length,
    deposits: sortedTransactions.filter((t) => t.type === "deposit").length,
    withdrawals: sortedTransactions.filter((t) => t.type === "withdrawal")
      .length,
    purchases: sortedTransactions.filter((t) => t.type === "purchase").length,
    sales: sortedTransactions.filter((t) => t.type === "sale").length,
  };

  // ✅ AFFICHER UN MESSAGE SI DES TRANSACTIONS ONT ÉTÉ FILTRÉES
  const filteredCount =
    (userTransactions?.length || 0) - validTransactions.length;

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

        {/* ✅ STATISTIQUES RAPIDES */}
        {/* {sortedTransactions.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            <div className="bg-blue-50 p-2 rounded">
              <p className="font-semibold text-blue-700">
                {transactionStats.total}
              </p>
              <p className="text-xs text-blue-600">Total</p>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <p className="font-semibold text-green-700">
                {transactionStats.deposits}
              </p>
              <p className="text-xs text-green-600">Dépôts</p>
            </div>
            <div className="bg-red-50 p-2 rounded">
              <p className="font-semibold text-red-700">
                {transactionStats.withdrawals}
              </p>
              <p className="text-xs text-red-600">Retraits</p>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <p className="font-semibold text-purple-700">
                {isCreator
                  ? transactionStats.sales
                  : transactionStats.purchases}
              </p>
              <p className="text-xs text-purple-600">
                {isCreator ? "Ventes" : "Achats"}
              </p>
            </div>
          </div>
        )} */}
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
                pendingWithdrawals={pendingWithdrawals}
                onWithdraw={handleWithdraw}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ ONGLETS DES TRANSACTIONS */}
      <Tabs defaultValue="all">
        <TabsList className="w-full mb-6 grid grid-cols-4">
          <TabsTrigger value="all" className="flex-1 text-xs">
            Tous ({transactionStats.total})
          </TabsTrigger>
          <TabsTrigger value="deposits" className="flex-1 text-xs">
            Dépôts ({transactionStats.deposits})
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex-1 text-xs">
            Retraits ({transactionStats.withdrawals})
          </TabsTrigger>
          <TabsTrigger
            value={isCreator ? "sales" : "purchases"}
            className="flex-1 text-xs"
          >
            {isCreator
              ? `Ventes (${transactionStats.sales})`
              : `Achats (${transactionStats.purchases})`}
          </TabsTrigger>
        </TabsList>

        {/* ✅ TOUTES LES TRANSACTIONS VALIDES */}
        <TabsContent value="all">
          {sortedTransactions.length === 0 ? (
            <EmptyState message="Aucune transaction valide trouvée" />
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

        {/* ✅ DÉPÔTS SEULEMENT */}
        <TabsContent value="deposits">
          {transactionStats.deposits === 0 ? (
            <EmptyState message="Aucun dépôt valide trouvé" />
          ) : (
            Object.entries(groupedTransactions).map(([month, transactions]) => {
              const deposits = transactions.filter(
                (t: RealTransaction) => t.type === "deposit"
              );
              if (deposits.length === 0) return null;

              return (
                <div key={month} className="mb-6">
                  <h2 className="text-lg font-semibold mb-3 text-gray-800">
                    {month}
                  </h2>
                  {renderTransactionList(deposits)}
                </div>
              );
            })
          )}
        </TabsContent>

        {/* ✅ RETRAITS SEULEMENT */}
        <TabsContent value="withdrawals">
          {transactionStats.withdrawals === 0 ? (
            <EmptyState message="Aucun retrait valide trouvé" />
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

        {/* ✅ VENTES OU ACHATS */}
        <TabsContent value={isCreator ? "sales" : "purchases"}>
          {isCreator ? (
            transactionStats.sales === 0 ? (
              <EmptyState message="Aucune vente valide trouvée" />
            ) : (
              Object.entries(groupedTransactions).map(
                ([month, transactions]) => {
                  const sales = transactions.filter(
                    (t: RealTransaction) => t.type === "sale"
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
                }
              )
            )
          ) : transactionStats.purchases === 0 ? (
            <EmptyState message="Aucun achat valide trouvé" />
          ) : (
            Object.entries(groupedTransactions).map(([month, transactions]) => {
              const purchases = transactions.filter(
                (t: RealTransaction) => t.type === "purchase"
              );
              if (purchases.length === 0) return null;

              return (
                <div key={month} className="mb-6">
                  <h2 className="text-lg font-semibold mb-3 text-gray-800">
                    {month}
                  </h2>
                  {renderTransactionList(purchases)}
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
