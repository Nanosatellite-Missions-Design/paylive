// components/admin/admin-stats.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Package,
  MessageSquare,
  DollarSign,
  Calendar,
} from "lucide-react";

interface AdminStatsProps {
  stats: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalTelegramGroups: number;
    totalTelegramSubscriptions: number;
    totalRevenue: number;
    monthlyRevenue: number;
    activeCreators: number;
    pendingWithdrawals: number;
  };
}

export default function AdminStats({ stats }: AdminStatsProps) {
  const statCards = [
    {
      title: "Utilisateurs totaux",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Créateurs actifs",
      value: stats.activeCreators,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Produits totaux",
      value: stats.totalProducts,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Commandes",
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    // {
    //   title: "Groupes Telegram",
    //   value: stats.totalTelegramGroups,
    //   icon: MessageSquare,
    //   color: "text-cyan-600",
    //   bgColor: "bg-cyan-50",
    // },
    // {
    //   title: "Abonnements Telegram",
    //   value: stats.totalTelegramSubscriptions,
    //   icon: MessageSquare,
    //   color: "text-indigo-600",
    //   bgColor: "bg-indigo-50",
    // },
    // {
    //   title: "Revenus totaux",
    //   value: `XAF ${stats.totalRevenue.toLocaleString()}`,
    //   icon: DollarSign,
    //   color: "text-green-600",
    //   bgColor: "bg-green-50",
    // },
    // {
    //   title: "Revenus du mois",
    //   value: `XAF ${stats.monthlyRevenue.toLocaleString()}`,
    //   icon: Calendar,
    //   color: "text-blue-600",
    //   bgColor: "bg-blue-50",
    // },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}