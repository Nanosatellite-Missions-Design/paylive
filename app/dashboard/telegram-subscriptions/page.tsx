"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  Users,
  Calendar,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  MessageSquare,
} from "lucide-react";

interface Subscription {
  id: string;
  subscriberName: string;
  subscriberTelegramUsername: string;
  subscriberTelegramId: string;
  status: string;
  groupId: string;
  groupName: string;
  price: number;
  subscriptionType: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  addedToGroup: boolean;
  paymentTransactionId: string;
  paymentConfirmed: boolean;
  subscriberEmail?: string;
  subscriberUid?: string;
  telegramGroupId?: string;
  fromBot?: boolean;
  source?: string;
}

interface Group {
  id: string;
  name: string;
  telegramGroupId: string;
}

interface TransactionStats {
  total: number;
  active: number;
  revenue: number;
  activeGroups: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export default function CreatorSubscriptionsPage() {
  const { user, userInfo } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Onglets
  const [activeTab, setActiveTab] = useState("subscriptions");

  // Filtres pour les abonnements
  const [subscriptionFilters, setSubscriptionFilters] = useState({
    groupId: "all",
    status: "all",
    search: "",
  });

  // Filtres pour les transactions
  const [transactionFilters, setTransactionFilters] = useState({
    search: "",
    status: "all",
    subscriptionType: "all",
  });

  // Pagination pour les transactions
  const [transactionPage, setTransactionPage] = useState(1);
  const transactionsPerPage = 10;

  // Statistiques
  const [stats, setStats] = useState<TransactionStats>({
    total: 0,
    active: 0,
    revenue: 0,
    activeGroups: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    if (userInfo?.uid) {
      fetchSubscriptions();
    }
  }, [userInfo?.uid]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/telegram/creator-subscriptions?creatorUid=${userInfo?.uid}&page=1&limit=1000`
      );

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des abonnements");
      }

      const data = await response.json();

      if (data.success) {
        // Convertir les prix en nombres
        const subsWithNumericPrice = data.subscriptions.map((sub: any) => ({
          ...sub,
          price: Number(sub.price) || 0,
        }));

        setSubscriptions(subsWithNumericPrice);
        setGroups(data.groups || []);

        // Calculer les statistiques
        calculateStats(subsWithNumericPrice);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (subs: Subscription[]) => {
    const activeSubs = subs.filter((sub) => sub.status === "active");
    const activeGroups = new Set(
      subs.filter((sub) => sub.status === "active").map((sub) => sub.groupId)
    );

    // Revenu total (tous les abonnements payés)
    const totalRevenue = subs
      .filter((sub) => sub.paymentConfirmed)
      .reduce((sum, sub) => sum + sub.price, 0);

    // Revenu des abonnements actifs
    const activeRevenue = activeSubs.reduce((sum, sub) => sum + sub.price, 0);

    // Revenu du mois en cours
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = subs
      .filter((sub) => {
        if (!sub.createdAt) return false;
        const subDate = new Date(sub.createdAt);
        return (
          subDate.getMonth() === currentMonth &&
          subDate.getFullYear() === currentYear &&
          sub.paymentConfirmed
        );
      })
      .reduce((sum, sub) => sum + sub.price, 0);

    setStats({
      total: subs.length,
      active: activeSubs.length,
      revenue: activeRevenue,
      activeGroups: activeGroups.size,
      totalRevenue,
      monthlyRevenue,
    });
  };

  // Filtrer les abonnements pour l'onglet "Abonnements"
  const getFilteredSubscriptions = () => {
    let result = [...subscriptions];

    // Filtre par groupe
    if (subscriptionFilters.groupId !== "all") {
      result = result.filter(
        (sub) => sub.groupId === subscriptionFilters.groupId
      );
    }

    // Filtre par statut
    if (subscriptionFilters.status !== "all") {
      result = result.filter(
        (sub) => sub.status === subscriptionFilters.status
      );
    }

    // Filtre par recherche
    if (subscriptionFilters.search) {
      const query = subscriptionFilters.search.toLowerCase();
      result = result.filter(
        (sub) =>
          sub.subscriberName?.toLowerCase().includes(query) ||
          sub.subscriberTelegramUsername?.toLowerCase().includes(query) ||
          sub.subscriberTelegramId
            ?.toString()
            .includes(subscriptionFilters.search)
      );
    }

    return result;
  };

  // Filtrer les transactions pour l'onglet "Transactions"
  const getFilteredTransactions = () => {
    let result = [...subscriptions];

    // Filtre par statut
    if (transactionFilters.status !== "all") {
      result = result.filter((sub) => sub.status === transactionFilters.status);
    }

    // Filtre par type d'abonnement
    if (transactionFilters.subscriptionType !== "all") {
      result = result.filter(
        (sub) => sub.subscriptionType === transactionFilters.subscriptionType
      );
    }

    // Filtre par recherche
    if (transactionFilters.search) {
      const query = transactionFilters.search.toLowerCase();
      result = result.filter(
        (sub) =>
          sub.subscriberName?.toLowerCase().includes(query) ||
          sub.subscriberTelegramUsername?.toLowerCase().includes(query) ||
          sub.subscriberTelegramId
            ?.toString()
            .includes(transactionFilters.search) ||
          sub.paymentTransactionId?.toLowerCase().includes(query)
      );
    }

    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  // Pagination des transactions
  const getPaginatedTransactions = () => {
    const transactions = getFilteredTransactions();
    const startIndex = (transactionPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    return transactions.slice(startIndex, endIndex);
  };

  const totalTransactionPages = Math.ceil(
    getFilteredTransactions().length / transactionsPerPage
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Actif
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <Clock className="h-3 w-3 mr-1" />
            Expiré
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Annulé
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (confirmed: boolean) => {
    return confirmed ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Payé
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Non payé
      </Badge>
    );
  };

  const handleExportTransactions = () => {
    const transactions = getFilteredTransactions();
    const csv = [
      [
        "Date",
        "Utilisateur",
        "ID Telegram",
        "Groupe",
        "Type",
        "Prix",
        "Statut",
        "Paiement",
        "ID Transaction",
      ],
      ...transactions.map((t) => [
        formatDate(t.createdAt),
        t.subscriberName,
        t.subscriberTelegramId,
        t.groupName,
        t.subscriptionType,
        t.price.toString(),
        t.status,
        t.paymentConfirmed ? "Payé" : "Non payé",
        t.paymentTransactionId,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-telegram-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  const handleViewSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setViewDialogOpen(true);
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
      {/* Header avec bouton retour */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/profile")}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Retour au profil
        </Button>
        <h1 className="text-3xl font-bold">Abonnements Telegram</h1>
        <p className="text-gray-600">
          Gérez et visualisez tous les abonnements à vos groupes Telegram
          payants
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Abonnements Actifs</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Abonnements</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenus Totaux</p>
                <p className="text-2xl font-bold">
                  {formatPrice(stats.totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenus du Mois</p>
                <p className="text-2xl font-bold">
                  {formatPrice(stats.monthlyRevenue)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="subscriptions">
              <Users className="h-4 w-4 mr-2" />
              Abonnements ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <FileText className="h-4 w-4 mr-2" />
              Transactions ({getFilteredTransactions().length})
            </TabsTrigger>
          </TabsList>

          {activeTab === "transactions" && (
            <Button onClick={handleExportTransactions} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          )}
        </div>

        {/* Onglet Abonnements */}
        <TabsContent value="subscriptions">
          <Card>
            <CardContent className="p-6">
              {/* Filtres Abonnements */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Recherche
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nom, username ou ID..."
                      className="pl-10"
                      value={subscriptionFilters.search}
                      onChange={(e) =>
                        setSubscriptionFilters({
                          ...subscriptionFilters,
                          search: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Groupe
                  </label>
                  <Select
                    value={subscriptionFilters.groupId}
                    onValueChange={(value) =>
                      setSubscriptionFilters({
                        ...subscriptionFilters,
                        groupId: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les groupes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les groupes</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Statut
                  </label>
                  <Select
                    value={subscriptionFilters.status}
                    onValueChange={(value) =>
                      setSubscriptionFilters({
                        ...subscriptionFilters,
                        status: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="expired">Expiré</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSubscriptionFilters({
                        groupId: "all",
                        status: "all",
                        search: "",
                      });
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              </div>

              {/* Liste des abonnements */}
              <div className="space-y-4">
                {getFilteredSubscriptions().length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Aucun abonnement trouvé</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {subscriptionFilters.groupId !== "all" ||
                      subscriptionFilters.status !== "all" ||
                      subscriptionFilters.search
                        ? "Essayez de modifier vos filtres"
                        : "Les abonnements apparaîtront ici"}
                    </p>
                  </div>
                ) : (
                  getFilteredSubscriptions().map((subscription) => (
                    <Card key={subscription.id} className="hover:bg-gray-50">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <div>
                                <h3 className="font-semibold">
                                  {subscription.subscriberName ||
                                    "Utilisateur Telegram"}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {subscription.subscriberTelegramUsername
                                    ? `@${subscription.subscriberTelegramUsername}`
                                    : `ID: ${subscription.subscriberTelegramId}`}
                                </p>
                              </div>
                              {getStatusBadge(subscription.status)}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Groupe</p>
                                <p className="font-medium">
                                  {subscription.groupName || "Sans nom"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Type</p>
                                <p className="font-medium capitalize">
                                  {subscription.subscriptionType?.replace(
                                    "_",
                                    " "
                                  ) || "Accès unique"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Prix</p>
                                <p className="font-medium">
                                  {formatPrice(subscription.price)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Paiement</p>
                                <div className="mt-1">
                                  {getPaymentStatusBadge(
                                    subscription.paymentConfirmed
                                  )}
                                </div>
                              </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="flex justify-between text-sm">
                              <div>
                                <p className="text-gray-500">
                                  ID: {subscription.subscriberTelegramId}
                                </p>
                                <p className="text-gray-500">
                                  Créé le: {formatDate(subscription.createdAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                {subscription.endDate &&
                                  subscription.status === "active" && (
                                    <p className="text-gray-500">
                                      ⏳ Expire dans:{" "}
                                      {Math.ceil(
                                        (new Date(
                                          subscription.endDate
                                        ).getTime() -
                                          Date.now()) /
                                          (1000 * 60 * 60 * 24)
                                      )}{" "}
                                      jours
                                    </p>
                                  )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() =>
                                    handleViewSubscription(subscription)
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Détails
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Transactions */}
        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-6">
              {/* Filtres Transactions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Recherche
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nom, ID Telegram ou Transaction..."
                      className="pl-10"
                      value={transactionFilters.search}
                      onChange={(e) =>
                        setTransactionFilters({
                          ...transactionFilters,
                          search: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Statut
                  </label>
                  <Select
                    value={transactionFilters.status}
                    onValueChange={(value) =>
                      setTransactionFilters({
                        ...transactionFilters,
                        status: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="expired">Expiré</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Type d'abonnement
                  </label>
                  <Select
                    value={transactionFilters.subscriptionType}
                    onValueChange={(value) =>
                      setTransactionFilters({
                        ...transactionFilters,
                        subscriptionType: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="trois_jours">3 jours</SelectItem>
                      <SelectItem value="hebdomadaire">Hebdomadaire</SelectItem>
                      <SelectItem value="mensuelle">Mensuelle</SelectItem>
                      <SelectItem value="trimestrielle">
                        Trimestrielle
                      </SelectItem>
                      <SelectItem value="one_time">Unique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setTransactionFilters({
                        search: "",
                        status: "all",
                        subscriptionType: "all",
                      });
                      setTransactionPage(1);
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              </div>

              {/* Liste des transactions (cartes) */}
              <div className="space-y-4">
                {getFilteredTransactions().length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Aucune transaction trouvée</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {transactionFilters.status !== "all" ||
                      transactionFilters.subscriptionType !== "all" ||
                      transactionFilters.search
                        ? "Essayez de modifier vos filtres"
                        : "Les transactions apparaîtront ici"}
                    </p>
                  </div>
                ) : (
                  <>
                    {getPaginatedTransactions().map((transaction) => (
                      <Card key={transaction.id} className="hover:bg-gray-50">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            {/* Colonne gauche: Infos principales */}
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">
                                      {transaction.subscriberName}
                                    </h4>
                                    {getStatusBadge(transaction.status)}
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    ID: {transaction.subscriberTelegramId}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold">
                                    {formatPrice(transaction.price)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {transaction.subscriptionType}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500">Groupe</p>
                                  <p className="font-medium">
                                    {transaction.groupName}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Date</p>
                                  <p className="font-medium">
                                    {formatDate(transaction.createdAt)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Paiement</p>
                                  <div>
                                    {getPaymentStatusBadge(
                                      transaction.paymentConfirmed
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-gray-500">
                                    Transaction ID
                                  </p>
                                  <p className="font-mono text-xs truncate">
                                    {transaction.paymentTransactionId}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Colonne droite: Actions */}
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleViewSubscription(transaction)
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Détails
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Pagination */}
                    {totalTransactionPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          Page {transactionPage} sur {totalTransactionPages}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setTransactionPage((prev) =>
                                Math.max(1, prev - 1)
                              )
                            }
                            disabled={transactionPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Précédent
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setTransactionPage((prev) =>
                                Math.min(totalTransactionPages, prev + 1)
                              )
                            }
                            disabled={transactionPage === totalTransactionPages}
                          >
                            Suivant
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bouton rafraîchir */}
      <div className="flex justify-end mt-6">
        <Button onClick={fetchSubscriptions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Rafraîchir les données
        </Button>
      </div>

      {/* Dialog de détails */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'abonnement</DialogTitle>
            {selectedSubscription && (
              <DialogDescription>
                Transaction ID: {selectedSubscription.paymentTransactionId}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedSubscription && (
            <div className="space-y-6">
              {/* Informations utilisateur */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Informations de l'utilisateur
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nom</p>
                    <p className="font-medium">
                      {selectedSubscription.subscriberName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID Telegram</p>
                    <p className="font-medium">
                      {selectedSubscription.subscriberTelegramId}
                    </p>
                  </div>
                  {selectedSubscription.subscriberTelegramUsername && (
                    <div>
                      <p className="text-sm text-gray-500">Nom d'utilisateur</p>
                      <p className="font-medium">
                        @{selectedSubscription.subscriberTelegramUsername}
                      </p>
                    </div>
                  )}
                  {selectedSubscription.subscriberEmail && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">
                        {selectedSubscription.subscriberEmail}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Informations de l'abonnement */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Informations de l'abonnement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Groupe</p>
                    <p className="font-medium">
                      {selectedSubscription.groupName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type d'abonnement</p>
                    <p className="font-medium capitalize">
                      {selectedSubscription.subscriptionType?.replace(
                        "_",
                        " "
                      ) || "Accès unique"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Prix</p>
                    <p className="font-medium text-xl">
                      {formatPrice(selectedSubscription.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedSubscription.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date de début</p>
                    <p className="font-medium">
                      {formatDate(selectedSubscription.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date de fin</p>
                    <p className="font-medium">
                      {formatDate(selectedSubscription.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Informations techniques */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Informations techniques
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ID de l'abonnement</p>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                      {selectedSubscription.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID de transaction</p>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                      {selectedSubscription.paymentTransactionId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut paiement</p>
                    <div className="mt-1">
                      {getPaymentStatusBadge(
                        selectedSubscription.paymentConfirmed
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Source</p>
                    <p className="font-medium">
                      {selectedSubscription.source || "Inconnue"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
