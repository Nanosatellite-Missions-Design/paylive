// components/admin/transactions-overview.tsx
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  Download,
  ArrowDownLeft,
  Minus,
  CheckCircle,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface TransactionStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  totalAmount: number;
  monthlyAmount: number;
  byType: {
    sales: number;
    withdrawal: number;
  };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  userId: string;
  userName: string;
  product?: string;
  provider?: string;
}

export default function TransactionsOverview({ detailed = false }: { detailed?: boolean }) {
  const [stats, setStats] = useState<TransactionStats>({
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    totalAmount: 0,
    monthlyAmount: 0,
    byType: {
      sales: 0,
      withdrawal: 0,
    },
  });

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [activeTab, setActiveTab] = useState("all");

  // Fonction pour récupérer les données de la vue d'ensemble
  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/transactions?limit=5");
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setStats(data.stats);
      setRecentTransactions(data.transactions || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les transactions paginées
  const fetchPaginatedTransactions = async (page: number, type?: string) => {
    try {
      setLoading(true);
      let url = `/api/admin/transactions?page=${page}&limit=20`;
      if (type && type !== "all") {
        url += `&type=${type}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setTransactions(data.transactions || []);
      setTotalPages(data.pagination.totalPages);
      setTotalTransactions(data.pagination.total);
      // Pour l'onglet "all", mettre à jour les stats
      if (!type || type === "all") {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (detailed) {
      fetchPaginatedTransactions(1);
    } else {
      fetchOverviewData();
    }
  }, [detailed]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const type = activeTab === "all" ? undefined : activeTab;
    fetchPaginatedTransactions(newPage, type);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    const type = tab === "all" ? undefined : tab;
    fetchPaginatedTransactions(1, type);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (transaction: Transaction) => {
    const status = transaction.status?.toLowerCase();

    switch (status) {
      case "successful":
      case "completed":
      case "complété":
        return (
          <Badge className="bg-green-100 text-green-800 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Complété
          </Badge>
        );
      case "processing":
      case "pending":
      case "en attente":
        return (
          <Badge className="bg-amber-100 text-amber-800 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case "failed":
      case "cancelled":
      case "échec":
        return (
          <Badge className="bg-red-100 text-red-800 text-xs">
            <X className="h-3 w-3 mr-1" />
            Échec
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 text-xs">
            {status}
          </Badge>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "vente":
      case "sales":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case "retrait":
      case "withdrawal":
        return <Minus className="h-4 w-4 text-red-500" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });
    } catch {
      return "Date inconnue";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Vue d'ensemble des transactions financières</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => detailed ? fetchPaginatedTransactions(currentPage, activeTab === "all" ? undefined : activeTab) : fetchOverviewData()}
          >
            <Download className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!detailed ? (
          <div className="space-y-6">
            {/* Statistiques rapides */}
            {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Montant total</p>
                    <p className="text-2xl font-bold">
                      {formatAmount(stats.totalAmount)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Réussies</p>
                    <p className="text-2xl font-bold">{stats.successful}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Ce mois</p>
                    <p className="text-2xl font-bold">
                      {formatAmount(stats.monthlyAmount)}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div> */}

            {/* Types de transactions - 2 CATÉGORIES SEULEMENT */}
            <div>
              <h3 className="font-semibold mb-3">Par type</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-lg p-3">
                  <p className="text-sm text-gray-500">Ventes</p>
                  <p className="text-xl font-bold">{stats.byType.sales || 0}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-sm text-gray-500">Retraits</p>
                  <p className="text-xl font-bold">{stats.byType.withdrawal || 0}</p>
                </div>
              </div>
            </div>

            {/* Transactions récentes */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Transactions récentes</h3>
                <Button variant="ghost" size="sm" onClick={fetchOverviewData}>
                  Rafraîchir
                </Button>
              </div>
              <div className="space-y-2">
                {recentTransactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-gray-100">
                        {getTypeIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.type}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.userName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatAmount(transaction.amount)}
                      </p>
                      <div className="mt-1">
                        {getStatusBadge(transaction)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">Toutes ({stats.total})</TabsTrigger>
                <TabsTrigger value="sales">Ventes ({stats.byType.sales})</TabsTrigger>
                <TabsTrigger value="withdrawal">Retraits ({stats.byType.withdrawal})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4 mt-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucune transaction trouvée</p>
                  </div>
                ) : (
                  <>
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          {getTypeIcon(transaction.type)}
                          <div>
                            <p className="font-medium capitalize">{transaction.type}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatAmount(transaction.amount)}</p>
                          <p className="text-sm text-gray-500">{transaction.userName}</p>
                        </div>
                        {getStatusBadge(transaction)}
                      </div>
                    ))}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="sales" className="space-y-4 mt-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucune vente trouvée</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {getTypeIcon(transaction.type)}
                        <div>
                          <p className="font-medium">Vente</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatAmount(transaction.amount)}</p>
                        <p className="text-sm text-gray-500">{transaction.userName}</p>
                      </div>
                      {getStatusBadge(transaction)}
                    </div>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="withdrawal" className="space-y-4 mt-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun retrait trouvé</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {getTypeIcon(transaction.type)}
                        <div>
                          <p className="font-medium">Retrait</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatAmount(transaction.amount)}</p>
                        <p className="text-sm text-gray-500">{transaction.userName}</p>
                      </div>
                      {getStatusBadge(transaction)}
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  {totalTransactions} transactions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}