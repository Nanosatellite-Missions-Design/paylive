// components/admin/telegram-overview.tsx
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
  MessageSquare,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  ExternalLink,
} from "lucide-react";

interface TelegramStats {
  totalGroups: number;
  activeGroups: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  topGroups: Array<{
    id: string;
    name: string;
    memberCount: number;
    subscriptionCount: number;
    revenue: number;
    creatorName: string;
  }>;
}

export default function TelegramOverview({ detailed = false }: { detailed?: boolean }) {
  const [stats, setStats] = useState<TelegramStats>({
    totalGroups: 0,
    activeGroups: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    topGroups: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTelegramData();
  }, []);

  const fetchTelegramData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/telegram");
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setStats(data);
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

  if (loading && !detailed) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement Telegram...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram</CardTitle>
        <CardDescription>Groupes payants et abonnements</CardDescription>
      </CardHeader>
      <CardContent>
        {!detailed ? (
          <div className="space-y-6">
            {/* Statistiques Telegram */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Groupes</p>
                    <p className="text-2xl font-bold">{stats.totalGroups}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Abonnements</p>
                    <p className="text-2xl font-bold">{stats.totalSubscriptions}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Revenus</p>
                    <p className="text-2xl font-bold">
                      {formatAmount(stats.totalRevenue)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Groupes actifs */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Groupes populaires</h3>
                <Button variant="ghost" size="sm" onClick={fetchTelegramData}>
                  Rafraîchir
                </Button>
              </div>
              <div className="space-y-3">
                {stats.topGroups.slice(0, 3).map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-gray-100">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-gray-500">
                          {group.creatorName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatAmount(group.revenue)}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="h-3 w-3" />
                        <span>{group.subscriptionCount} abonnés</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Résumé rapide */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-lg p-3">
                <p className="text-sm text-gray-500">Groupes actifs</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold">{stats.activeGroups}</p>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-gray-500">Revenus du mois</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold">
                    {formatAmount(stats.monthlyRevenue)}
                  </p>
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vue détaillée - Similaire à votre page CreatorSubscriptionsPage mais pour admin */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Groupes totaux", value: stats.totalGroups, icon: MessageSquare, color: "blue" },
                { label: "Abonnements totaux", value: stats.totalSubscriptions, icon: Users, color: "green" },
                { label: "Abonnements actifs", value: stats.activeSubscriptions, icon: TrendingUp, color: "purple" },
                { label: "Revenus totaux", value: formatAmount(stats.totalRevenue), icon: DollarSign, color: "orange" },
              ].map((stat, idx) => (
                <Card key={idx}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                        <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Liste des groupes */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Tous les groupes</h3>
              <div className="space-y-4">
                {stats.topGroups.map((group) => (
                  <Card key={group.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{group.name}</h4>
                          <p className="text-sm text-gray-500">
                            Créé par {group.creatorName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {formatAmount(group.revenue)}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{group.memberCount} membres</span>
                            <span>{group.subscriptionCount} abonnements</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}