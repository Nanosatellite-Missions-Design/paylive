"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
  Edit,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface Voucher {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  maxUses: number;
  currentUses: number;
  userIds?: string[];
  telegramGroupIds?: string[];
  productTypes?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function VouchersAdminPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 10,
    minPurchaseAmount: 0,
    maxDiscountAmount: 0,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    maxUses: 100,
    userIds: "",
    telegramGroupIds: "",
    productTypes: "normal,telegram_subscription",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/vouchers");
      const data = await response.json();

      if (data.success) {
        setVouchers(data.vouchers);
      } else {
        toast.error("Erreur lors du chargement des vouchers");
      }
    } catch (error) {
      console.error("Erreur récupération vouchers:", error);
      toast.error("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const createVoucher = async () => {
    if (!newVoucher.code.trim()) {
      toast.error("Le code est requis");
      return;
    }

    if (newVoucher.discountValue <= 0) {
      toast.error("La valeur de réduction doit être positive");
      return;
    }

    setCreating(true);
    try {
      const voucherData = {
        ...newVoucher,
        userIds: newVoucher.userIds
          ? newVoucher.userIds
              .split(",")
              .map((id) => id.trim())
              .filter((id) => id)
          : [],
        telegramGroupIds: newVoucher.telegramGroupIds
          ? newVoucher.telegramGroupIds
              .split(",")
              .map((id) => id.trim())
              .filter((id) => id)
          : [],
        productTypes: newVoucher.productTypes
          ? newVoucher.productTypes
              .split(",")
              .map((type) => type.trim())
              .filter((type) => type)
          : ["normal", "telegram_subscription"],
      };

      const response = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voucherData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Voucher créé avec succès");
        setShowCreateForm(false);
        setNewVoucher({
          code: "",
          discountType: "percentage",
          discountValue: 10,
          minPurchaseAmount: 0,
          maxDiscountAmount: 0,
          validFrom: new Date().toISOString().split("T")[0],
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          maxUses: 100,
          userIds: "",
          telegramGroupIds: "",
          productTypes: "normal,telegram_subscription",
        });
        fetchVouchers();
      } else {
        toast.error(data.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur création voucher:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const toggleVoucherStatus = async (voucherId: string) => {
    try {
      const response = await fetch(
        `/api/admin/vouchers?id=${voucherId}&action=toggle`,
        {
          method: "PUT",
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchVouchers();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("Erreur changement statut:", error);
      toast.error("Erreur lors du changement de statut");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Code copié dans le presse-papier");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch =
      voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.discountValue.toString().includes(searchTerm);

    if (filterActive === null) return matchesSearch;
    return matchesSearch && voucher.isActive === filterActive;
  });

  const stats = {
    total: vouchers.length,
    active: vouchers.filter((v) => v.isActive).length,
    used: vouchers.reduce((sum, v) => sum + v.currentUses, 0),
    available: vouchers.reduce(
      (sum, v) => sum + (v.maxUses - v.currentUses),
      0,
    ),
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestion des Codes Promo</h1>
        <p className="text-gray-600 mt-2">
          Créez et gérez vos codes de réduction pour les paiements normaux et
          Telegram
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-gray-600">Total codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-sm text-gray-600">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.used}</div>
            <p className="text-sm text-gray-600">Utilisations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.available}
            </div>
            <p className="text-sm text-gray-600">Utilisations restantes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire création */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Créer un code promo</span>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  {showCreateForm ? "Masquer" : "Afficher"}
                </Button>
              </CardTitle>
              <CardDescription>
                Les codes s'appliqueront aux deux systèmes de paiement
              </CardDescription>
            </CardHeader>

            {showCreateForm && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    placeholder="SUMMER20"
                    value={newVoucher.code}
                    onChange={(e) =>
                      setNewVoucher({
                        ...newVoucher,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountType">Type</Label>
                    <Select
                      value={newVoucher.discountType}
                      onValueChange={(value: "percentage" | "fixed") =>
                        setNewVoucher({ ...newVoucher, discountType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          Pourcentage (%)
                        </SelectItem>
                        <SelectItem value="fixed">
                          Montant fixe (XAF)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountValue">Valeur *</Label>
                    <Input
                      id="discountValue"
                      type="number"
                      value={newVoucher.discountValue}
                      onChange={(e) =>
                        setNewVoucher({
                          ...newVoucher,
                          discountValue: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPurchaseAmount">Minimum (XAF)</Label>
                    <Input
                      id="minPurchaseAmount"
                      type="number"
                      value={newVoucher.minPurchaseAmount}
                      onChange={(e) =>
                        setNewVoucher({
                          ...newVoucher,
                          minPurchaseAmount: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxUses">Utilisations max</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      value={newVoucher.maxUses}
                      onChange={(e) =>
                        setNewVoucher({
                          ...newVoucher,
                          maxUses: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">Valide du</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={newVoucher.validFrom}
                      onChange={(e) =>
                        setNewVoucher({
                          ...newVoucher,
                          validFrom: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valide jusqu'au</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={newVoucher.validUntil}
                      onChange={(e) =>
                        setNewVoucher({
                          ...newVoucher,
                          validUntil: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productTypes">Types de produits</Label>
                  <Input
                    id="productTypes"
                    placeholder="normal,telegram_subscription"
                    value={newVoucher.productTypes}
                    onChange={(e) =>
                      setNewVoucher({
                        ...newVoucher,
                        productTypes: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Séparés par des virgules: normal, telegram_subscription
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userIds">Restreint aux utilisateurs</Label>
                  <Textarea
                    id="userIds"
                    placeholder="user1,user2,user3"
                    value={newVoucher.userIds}
                    onChange={(e) =>
                      setNewVoucher({ ...newVoucher, userIds: e.target.value })
                    }
                    rows={2}
                  />
                  <p className="text-xs text-gray-500">
                    IDs séparés par des virgules. Laisser vide pour tous.
                  </p>
                </div>

                <Button
                  onClick={createVoucher}
                  className="w-full"
                  disabled={creating}
                >
                  {creating ? "Création..." : "Créer le code promo"}
                </Button>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Liste des vouchers */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Codes promotionnels</CardTitle>
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterActive === null ? "default" : "outline"}
                    onClick={() => setFilterActive(null)}
                    size="sm"
                  >
                    Tous
                  </Button>
                  <Button
                    variant={filterActive === true ? "default" : "outline"}
                    onClick={() => setFilterActive(true)}
                    size="sm"
                  >
                    Actifs
                  </Button>
                  <Button
                    variant={filterActive === false ? "default" : "outline"}
                    onClick={() => setFilterActive(false)}
                    size="sm"
                  >
                    Inactifs
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Chargement des codes...</p>
                </div>
              ) : filteredVouchers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || filterActive !== null ? (
                    <>Aucun code ne correspond à votre recherche</>
                  ) : (
                    <>Aucun code promo créé. Créez-en un !</>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Réduction</TableHead>
                        <TableHead>Utilisations</TableHead>
                        <TableHead>Validité</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVouchers.map((voucher) => (
                        <TableRow key={voucher.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {voucher.code}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(voucher.code)}
                                className="h-6 w-6"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {voucher.discountType === "percentage"
                                ? `${voucher.discountValue}%`
                                : `${voucher.discountValue} XAF`}
                            </div>
                            {voucher.minPurchaseAmount ||
                              (0 > 0 && (
                                <div className="text-xs text-gray-500">
                                  Min: {voucher.minPurchaseAmount} XAF
                                </div>
                              ))}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {voucher.currentUses} / {voucher.maxUses}
                            </div>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(100, (voucher.currentUses / voucher.maxUses) * 100)}%`,
                                }}
                              ></div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              Jusqu'au {formatDate(voucher.validUntil)}
                            </div>
                            <div
                              className={`text-xs ${new Date(voucher.validUntil) < new Date() ? "text-red-600" : "text-green-600"}`}
                            >
                              {new Date(voucher.validUntil) < new Date()
                                ? "Expiré"
                                : "Valide"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                voucher.isActive ? "default" : "secondary"
                              }
                            >
                              {voucher.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleVoucherStatus(voucher.id)}
                                className="h-8 w-8"
                              >
                                {voucher.isActive ? (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Exemples de codes prêts à copier */}
              {!loading &&
                filteredVouchers.length === 0 &&
                !searchTerm &&
                filterActive === null && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">
                      Exemples de codes que vous pouvez créer :
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="p-3">
                        <div className="font-mono font-bold">WELCOME10</div>
                        <div className="text-sm text-gray-600">
                          10% de réduction
                        </div>
                        <div className="text-xs text-gray-500">
                          Pour les nouveaux utilisateurs
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="font-mono font-bold">TELEGRAM20</div>
                        <div className="text-sm text-gray-600">
                          20% de réduction
                        </div>
                        <div className="text-xs text-gray-500">
                          Abonnements Telegram uniquement
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="font-mono font-bold">VIP100</div>
                        <div className="text-sm text-gray-600">
                          100% gratuit
                        </div>
                        <div className="text-xs text-gray-500">
                          Pour utilisateurs spécifiques
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="font-mono font-bold">FLASH500</div>
                        <div className="text-sm text-gray-600">
                          500 XAF de réduction
                        </div>
                        <div className="text-xs text-gray-500">
                          Minimum 3000 XAF d'achat
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-3">
                💡 Comment utiliser les codes
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <p>
                    <strong>Créez un code</strong> avec les paramètres souhaités
                    (pourcentage, montant fixe, restrictions)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <p>
                    <strong>Partagez le code</strong> avec vos clients via
                    email, SMS, ou votre site web
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <p>
                    <strong>Les clients l'utilisent</strong> dans le formulaire
                    de paiement (normal ou Telegram)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">
                    4
                  </div>
                  <p>
                    <strong>Suivez les statistiques</strong> en temps réel dans
                    ce tableau
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-bold text-yellow-800 mb-2">
                  🎯 Cas d'utilisation
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>
                    • <strong>Offrir un produit gratuit</strong> : Code 100%
                    pour un utilisateur spécifique
                  </li>
                  <li>
                    • <strong>Promotion saisonnière</strong> : Code avec date
                    d'expiration limitée
                  </li>
                  <li>
                    • <strong>Fidélisation</strong> : Code réutilisable pour vos
                    meilleurs clients
                  </li>
                  <li>
                    • <strong>Test produit</strong> : Code limité à quelques
                    utilisations
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
