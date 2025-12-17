"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import {
  Bot,
  Users,
  Calendar,
  Shield,
  Lock,
  Check,
  ArrowLeft,
  Loader2,
  ExternalLink,
  CheckCircle,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import TelegramPaymentDialog from "@/components/telegram-payment-dialog";

export default function TelegramCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, userInfo } = useAuth();

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [paymentState, setPaymentState] = useState<
    "idle" | "pending" | "success" | "failed"
  >("idle");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [telegramUserId, setTelegramUserId] = useState<string | null>(null);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [telegramDataLoaded, setTelegramDataLoaded] = useState(false);

  const groupId = params.groupId as string;

  useEffect(() => {
    // Fonction pour récupérer l'ID Telegram
    const loadTelegramData = async () => {
      console.log("🔍 Recherche des données Telegram...");

      // 1. Depuis l'URL (paramètre direct)
      const telegramIdFromUrl = searchParams.get("telegramUserId");
      const telegramUsernameFromUrl = searchParams.get("telegramUsername");

      // 2. Depuis localStorage (si déjà stocké)
      const telegramIdFromStorage = localStorage.getItem("telegramUserId");
      const telegramUsernameFromStorage =
        localStorage.getItem("telegramUsername");

      // 3. Depuis le contexte d'authentification
      const telegramIdFromAuth = userInfo?.telegramId;
      const telegramUsernameFromAuth = userInfo?.telegramUsername;

      // Priorité: URL > Auth > Storage
      const finalTelegramId =
        telegramIdFromUrl || telegramIdFromAuth || telegramIdFromStorage;

      const finalTelegramUsername =
        telegramUsernameFromUrl ||
        telegramUsernameFromAuth ||
        telegramUsernameFromStorage;

      console.log("📊 Sources des données Telegram:", {
        url: telegramIdFromUrl,
        auth: telegramIdFromAuth,
        storage: telegramIdFromStorage,
        final: finalTelegramId,
      });

      if (finalTelegramId) {
        setTelegramUserId(finalTelegramId);
        localStorage.setItem("telegramUserId", finalTelegramId);

        if (finalTelegramUsername) {
          setTelegramUsername(finalTelegramUsername);
          localStorage.setItem("telegramUsername", finalTelegramUsername);
        }

        console.log("✅ ID Telegram chargé:", finalTelegramId);
      } else {
        console.log("⚠️ Aucun ID Telegram trouvé");

        toast({
          title: "ID Telegram manquant",
          description:
            "Pour être ajouté automatiquement, nous avons besoin de votre ID Telegram.",
          // variant: "warning",
          duration: 5000,
        });
      }

      setTelegramDataLoaded(true);
    };

    loadTelegramData();
  }, [searchParams, userInfo, toast]);

  useEffect(() => {
    if (groupId && telegramDataLoaded) {
      fetchGroup();
    }
  }, [groupId, telegramDataLoaded]);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      console.log("🔍 Chargement du groupe avec ID:", groupId);

      // UN SEUL APPEL à l'API corrigée
      const response = await fetch(`/api/telegram/groups/${groupId}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erreur API:", errorData);
        throw new Error(errorData.error || "Groupe introuvable");
      }

      const data = await response.json();

      if (data.success) {
        setGroup(data.group);
        console.log("✅ Groupe chargé:", data.group.name);
        console.log("📋 Détails du groupe:", {
          id: data.group.id,
          publicSlug: data.group.publicSlug,
          telegramGroupId: data.group.telegramGroupId,
          price: data.group.price,
          source: data.source,
        });
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (error: any) {
      console.error("❌ Erreur chargement groupe:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger le groupe",
        variant: "destructive",
      });
      router.push("/telegram");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = async (paymentTransactionId: string) => {
    console.log("💰 Début du paiement avec ID Telegram:", telegramUserId);

    if (paymentTransactionId === "pending") {
      setPaymentState("pending");
      return;
    }

    if (paymentTransactionId === "failed") {
      setPaymentState("failed");
      return;
    }

    try {
      setPaymentState("pending");

      console.log("📦 Données envoyées à l'API:", {
        telegramUserId,
        telegramUsername,
        groupId: group.id,
        groupName: group.name,
        creatorUid: group.creatorUid,
        telegramGroupId: group.telegramGroupId,
      });

      // Créer l'abonnement
      const subscriptionResponse = await fetch("/api/telegram/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: group.id,
          creatorUid: group.creatorUid,
          subscriptionType: group.subscriptionType || "one_time",
          paymentTransactionId: paymentTransactionId,
          paymentAmount: group.price,
          subscriberTelegramId: telegramUserId,
          subscriberTelegramUsername:
            telegramUsername || userInfo?.telegramUsername,
          subscriberName:
            userInfo?.displayName ||
            user?.email?.split("@")[0] ||
            "Utilisateur Telegram",
          subscriberEmail: user?.email,
          subscriberUid: user?.uid,
          // Données spécifiques pour le bot
          telegramGroupId: group.telegramGroupId,
          groupName: group.name,
          price: group.price,
          fromBot: true,
        }),
      });

      const subscriptionData = await subscriptionResponse.json();

      if (!subscriptionResponse.ok) {
        throw new Error(subscriptionData.error || "Erreur création abonnement");
      }

      console.log("✅ Réponse abonnement:", subscriptionData);
      setPaymentState("success");

      // Rediriger vers la page de succès
      setTimeout(() => {
        const queryParams = new URLSearchParams({
          subscriptionId: subscriptionData.subscriptionId,
          groupName: encodeURIComponent(group.name),
          price: group.price,
        });

        if (subscriptionData.addedToGroup) {
          queryParams.append("status", "added");
        }

        if (telegramUserId) {
          queryParams.append("telegramUserId", telegramUserId);
        }

        router.push(
          `/telegram/subscription-success/${
            subscriptionData.subscriptionId
          }?${queryParams.toString()}`
        );
      }, 2000);
    } catch (error: any) {
      console.error("❌ Erreur création abonnement:", error);
      setPaymentState("failed");
      toast({
        title: "Erreur",
        description:
          error.message || "Erreur lors de la création de l'abonnement",
        variant: "destructive",
      });
    }
  };

  const handleCancelPayment = () => {
    setPaymentDialogOpen(false);
    setPaymentState("idle");
  };

  const handleOpenTelegramBot = () => {
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || "PayLiveBot";
    let botUrl = `https://t.me/${botUsername}`;

    if (group?.telegramGroupId) {
      botUrl += `?start=pay_${group.telegramGroupId}`;
    }

    window.open(botUrl, "_blank");

    toast({
      title: "Ouvrez Telegram",
      description: "Ouvrez le chat avec le bot pour plus d'options",
      duration: 3000,
    });
  };

  const handleGetTelegramId = () => {
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || "PayLiveBot";
    const deepLink = `https://t.me/${botUsername}?start=getid_${groupId}`;

    window.open(deepLink, "_blank");

    toast({
      title: "Ouvrez Telegram",
      description: "Le bot va vous envoyer votre ID Telegram",
      duration: 3000,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-600">Chargement du groupe...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Groupe non trouvé</h2>
          <p className="text-gray-600 mb-4">
            L'identifiant du groupe est invalide ou a expiré.
          </p>
          <Button onClick={() => router.push("/telegram")}>
            Voir les groupes disponibles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        {/* Bannière d'information Telegram */}
        {!telegramUserId && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">
                  ID Telegram non détecté
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Pour être ajouté automatiquement au groupe après paiement,
                  nous avons besoin de votre ID Telegram.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGetTelegramId}
                    className="text-amber-700 border-amber-300"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Obtenir mon ID Telegram
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.location.reload()}
                  >
                    Rafraîchir la page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Colonne gauche: Détails du groupe */}
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {group.name}
                  {group.isActive && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700"
                    >
                      Actif
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {group.currentMembers || 0} membres
                  {group.telegramGroupId && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Groupe Telegram
                    </span>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Prix et type d'abonnement */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">
                        {group.price} XAF
                      </p>
                      <p className="text-gray-600">
                        {group.subscriptionType === "monthly" && "/ mois"}
                        {group.subscriptionType === "weekly" && "/ semaine"}
                        {group.subscriptionType === "yearly" && "/ an"}
                        {group.subscriptionType === "one_time" &&
                          " (accès unique)"}
                        {!group.subscriptionType && " (accès unique)"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-lg py-2 px-4">
                      {group.subscriptionType === "monthly" && "Mensuel"}
                      {group.subscriptionType === "weekly" && "Hebdomadaire"}
                      {group.subscriptionType === "yearly" && "Annuel"}
                      {(group.subscriptionType === "one_time" ||
                        !group.subscriptionType) &&
                        "Accès unique"}
                    </Badge>
                  </div>
                </div>

                {/* Avantages */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Ce qui est inclus :</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Accès immédiat au groupe Telegram</span>
                    </li>
                    <li className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <Users className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>
                        Rejoignez {group.currentMembers || 0} membres actifs
                      </span>
                    </li>
                    <li className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <Shield className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Contenu exclusif et protégé</span>
                    </li>
                    <li className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <Bot className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>
                        {telegramUserId
                          ? "Ajout automatique après paiement ✓"
                          : "Gestion automatique par le bot"}
                      </span>
                    </li>
                    <li className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <Lock className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Paiement 100% sécurisé</span>
                    </li>
                  </ul>
                </div>

                {group.description && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">Description :</h3>
                    <p className="text-gray-700 whitespace-pre-line">
                      {group.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations créateur */}
            <Card>
              <CardHeader>
                <CardTitle>À propos du créateur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {group.creatorName?.charAt(0) || "C"}
                  </div>
                  <div>
                    <p className="font-medium">
                      {group.creatorName || "Créateur PayLive"}
                    </p>
                    <p className="text-sm text-gray-500">Créateur du groupe</p>
                  </div>
                </div>
                {group.welcomeMessage && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {group.welcomeMessage}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite: Paiement */}
          <div>
            <Card className="sticky top-8 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Finaliser l'abonnement
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Résumé du prix */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Abonnement</span>
                    <span className="font-semibold">{group.price} XAF</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Frais de service</span>
                    <span className="font-semibold">0 XAF</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center py-2">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-primary">
                      {group.price} XAF
                    </span>
                  </div>
                </div>

                {/* Statut Telegram */}
                <div className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium">Compte Telegram</span>
                  </div>
                  {telegramUserId ? (
                    <div className="space-y-2">
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                        ✓ ID Telegram détecté:
                        <span className="font-mono block mt-1 text-xs">
                          {telegramUsername
                            ? `@${telegramUsername}`
                            : `ID: ${telegramUserId}`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Vous serez ajouté automatiquement au groupe après
                        paiement.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        ⚠️ Aucun ID Telegram détecté
                      </div>
                      <p className="text-xs text-gray-500">
                        Vous recevrez un lien d'invitation par message privé
                        après paiement.
                      </p>
                    </div>
                  )}
                </div>

                {/* Bouton de paiement */}
                <Button
                  size="lg"
                  className="w-full h-12 text-lg"
                  onClick={() => setPaymentDialogOpen(true)}
                  disabled={paymentState === "pending"}
                >
                  {paymentState === "pending" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    "Procéder au paiement"
                  )}
                </Button>

                {/* Actions supplémentaires */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleOpenTelegramBot}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir le bot Telegram
                  </Button>

                  {!telegramUserId && (
                    <div className="text-center">
                      <Button
                        variant="link"
                        className="text-sm"
                        onClick={handleGetTelegramId}
                      >
                        Comment être ajouté automatiquement ?
                      </Button>
                    </div>
                  )}
                </div>

                {/* Sécurité */}
                <div className="text-center text-xs text-gray-500 pt-4 border-t">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Lock className="h-3 w-3" />
                    <span>Paiement sécurisé avec PawaPay</span>
                  </div>
                  <p>Vos informations sont cryptées et protégées</p>
                </div>
              </CardContent>
            </Card>

            {/* Processus d'abonnement */}
            <Card className="mt-6">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Comment ça marche ?
                </h3>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Paiement</p>
                      <p className="text-sm text-gray-600">
                        Payez avec Mobile Money via PawaPay
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Confirmation</p>
                      <p className="text-sm text-gray-600">
                        Recevez une confirmation immédiate
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Accès</p>
                      <p className="text-sm text-gray-600">
                        {telegramUserId
                          ? "Ajout automatique au groupe Telegram"
                          : "Lien d'invitation envoyé par message privé"}
                      </p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog de paiement */}
      <TelegramPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        amount={group.price.toString()}
        product={`Abonnement à ${group.name}`}
        onPaymentComplete={handlePaymentComplete}
        paymentState={paymentState}
        handleCancel={handleCancelPayment}
        groupId={group.id}
        telegramGroupId={group.telegramGroupId}
        subscriberTelegramId={telegramUserId || undefined}
      />
    </div>
  );
}
