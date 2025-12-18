"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Smartphone,
  Loader2,
  Lock,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PAWAPAY_COUNTRIES } from "@/lib/countries";
import {
  getCurrencyForCountry,
  formatLocalDisplay,
  convertXAFToCurrency,
} from "@/lib/allocate";
import { useRouter } from "next/navigation";

interface TelegramPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  product: string;
  onPaymentComplete?: (paymentTransactionId: string) => void;
  paymentState: "idle" | "pending" | "success" | "failed";
  handleCancel?: () => void;
  groupId?: string;
  telegramGroupId?: string;
  subscriberTelegramId?: string;
  groupName?: string;
  creatorUid?: string;
  subscriberTelegramUsername?: string;
  subscriberName?: string;
  subscriberEmail?: string;
}

export default function TelegramPaymentDialog({
  open,
  onOpenChange,
  amount,
  product,
  onPaymentComplete,
  paymentState,
  handleCancel,
  groupId,
  telegramGroupId,
  subscriberTelegramId,
  groupName,
  creatorUid,
  subscriberTelegramUsername,
  subscriberName,
  subscriberEmail,
}: TelegramPaymentDialogProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(
    undefined
  );
  const [mobileProvider, setMobileProvider] = useState<string | undefined>(
    undefined
  );
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [currency, setCurrency] = useState("XAF");
  const [userLocation, setUserLocation] = useState<{
    country: string;
    countryCode: string;
  } | null>(null);
  const [groupSubscriptionType, setGroupSubscriptionType] =
    useState<string>("one_time");
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(false);

  const currentCountry = PAWAPAY_COUNTRIES.find(
    (c) => c.code === selectedCountry
  );
  const availableProviders = currentCountry?.providers || [];

  // Fonction sécurisée pour parser le montant
  const getSafeAmount = (): number => {
    if (!amount) return 0;
    try {
      const cleanAmount = amount.replace(/[^\d.]/g, "");
      return parseFloat(cleanAmount) || 0;
    } catch (error) {
      console.error("Error parsing amount:", error);
      return 0;
    }
  };

  // Détection de la localisation
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();

        if (data.country_code) {
          setUserLocation({
            country: data.country_name,
            countryCode: data.country_code,
          });

          const isPawaPayCountry = PAWAPAY_COUNTRIES.some(
            (country) => country.code === data.country_code
          );
          if (isPawaPayCountry) {
            setSelectedCountry(data.country_code);
          } else {
            setSelectedCountry("CMR");
          }
        }
      } catch (error) {
        console.log("Impossible de détecter la localisation:", error);
        setSelectedCountry(PAWAPAY_COUNTRIES[0]?.code || "CMR");
      }
    };

    getUserLocation();
  }, []);

  // Récupérer les infos du groupe (dont le subscriptionType)
  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (!groupId || !open) return;

      try {
        setIsLoadingGroup(true);
        console.log(`🔍 Récupération des infos du groupe ${groupId}`);
        const response = await fetch(`/api/telegram/groups/${groupId}`);
        const data = await response.json();

        if (data.success && data.group) {
          console.log("✅ Infos groupe récupérées:", {
            subscriptionType: data.group.subscriptionType,
            groupName: data.group.name,
            price: data.group.price,
          });

          setGroupInfo(data.group);

          // Mettre à jour le subscriptionType
          if (data.group.subscriptionType) {
            setGroupSubscriptionType(data.group.subscriptionType);
          }
        } else {
          console.warn("⚠️ Impossible de récupérer les infos du groupe");
          setGroupSubscriptionType("one_time"); // Valeur par défaut
        }
      } catch (error) {
        console.error("❌ Erreur récupération groupe:", error);
        setGroupSubscriptionType("one_time"); // Valeur par défaut
      } finally {
        setIsLoadingGroup(false);
      }
    };

    if (open && groupId) {
      fetchGroupInfo();
    }
  }, [groupId, open]);

  // Synchroniser la devise
  useEffect(() => {
    if (selectedCountry) {
      const newCurrency = getCurrencyForCountry(selectedCountry);
      setCurrency(newCurrency);
    }
  }, [selectedCountry]);

  // Fonction utilitaire pour obtenir le montant affiché dans la devise locale
  const getDisplayAmount = (): string => {
    const amountNumber = getSafeAmount();
    if (!selectedCountry) {
      return `${amountNumber.toLocaleString()} XAF`;
    }
    try {
      return formatLocalDisplay(amountNumber, selectedCountry);
    } catch (error) {
      console.error("Erreur de conversion:", error);
      return `${amountNumber.toLocaleString()} XAF`;
    }
  };

  // Fonction pour obtenir le montant converti pour l'API
  const getConvertedAmountForAPI = (): number => {
    const amountNumber = getSafeAmount();
    if (!selectedCountry) {
      return amountNumber; // Retourne en XAF par défaut
    }
    try {
      const targetCurrency = getCurrencyForCountry(selectedCountry);
      return convertXAFToCurrency(amountNumber, targetCurrency);
    } catch (error) {
      console.error("Erreur de conversion pour l'API:", error);
      return amountNumber;
    }
  };

  // Fonction pour formater le type d'abonnement
  const formatSubscriptionType = (type: string): string => {
    switch (type) {
      case "trois_jours":
        return "3 jours";
      case "hebdomadaire":
        return "7 jours";
      case "mensuelle":
        return "30 jours";
      case "trimestrielle":
        return "3 mois";
      case "one_time":
        return "30 jours";
      default:
        return type;
    }
  };

  const handlePayment = async () => {
    if (!selectedCountry || !mobileProvider || !phoneNumber) {
      alert("Veuillez remplir tous les champs requis");
      return;
    }

    const amountNumber = getSafeAmount();
    if (amountNumber === 0) {
      alert("Montant invalide");
      return;
    }

    // Nettoyage du numéro
    let cleanPhoneNumber = phoneNumber.replace(/[^\d]/g, "");
    if (cleanPhoneNumber.startsWith("0")) {
      cleanPhoneNumber = cleanPhoneNumber.substring(1);
    }

    const country = PAWAPAY_COUNTRIES.find((c) => c.code === selectedCountry);
    if (!country) {
      alert("Pays non supporté");
      return;
    }

    const countryCodeDigits = country.dialCode.replace("+", "");
    const finalPhoneNumber = countryCodeDigits + cleanPhoneNumber;

    // Convertir le montant XAF en devise locale pour l'API
    const convertedAmount = getConvertedAmountForAPI();
    const targetCurrency = getCurrencyForCountry(selectedCountry);

    console.log(
      `Conversion pour l'API: ${amountNumber} XAF → ${convertedAmount} ${targetCurrency}`
    );
    console.log(`📅 SubscriptionType à utiliser: ${groupSubscriptionType}`);

    const paymentData = {
      amount: convertedAmount.toString(),
      countryCode: selectedCountry,
      mobileProviderId: mobileProvider,
      phoneNumber: finalPhoneNumber,
      currency: targetCurrency,
      product: product,
      type: "telegram_subscription",
      metadata: {
        groupId: groupId,
        telegramGroupId: telegramGroupId,
        subscriberTelegramId: subscriberTelegramId,
        productName: product,
      },
    };

    try {
      setIsProcessing(true);

      // 1. Notifier que le paiement est en cours
      if (onPaymentComplete) {
        onPaymentComplete("pending");
      }

      console.log("🔹 Envoi de la requête Pawapay pour Telegram...");

      // 2. Créer le dépôt
      const response = await fetch("/api/pawapay/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("❌ Erreur API PawaPay:", result);
        if (onPaymentComplete) {
          onPaymentComplete("failed");
        }
        alert(`Erreur de paiement: ${result.error || "Erreur inconnue"}`);
        return;
      }

      console.log("✅ Transaction PawaPay créée, depositId:", result.depositId);

      // 3. POLLING
      const pollResult = await pollTransactionStatus(result.depositId);

      if (!pollResult.ok) {
        console.warn("⚠️ Transaction non confirmée:", pollResult);

        if (pollResult.error?.includes("Transaction échouée")) {
          if (onPaymentComplete) onPaymentComplete("failed");
          alert("Le paiement a été refusé par votre opérateur mobile");
        } else if (pollResult.error?.includes("Timeout")) {
          // Timeout - on reste en état pending
          console.log("⏰ Timeout - L'utilisateur doit vérifier son téléphone");
          // Ne pas changer l'état, rester en pending
          return;
        } else {
          if (onPaymentComplete) onPaymentComplete("failed");
          alert(
            "Le paiement n'a pas été confirmé. Veuillez vérifier votre compte."
          );
        }
        return;
      }

      // 4. SUCCÈS - Paiement confirmé
      console.log("✅ Paiement confirmé avec succès");

      // 5. CRÉATION DE L'ABONNEMENT TELEGRAM
      let subscriptionResult = null;
      let inviteLink = null;

      if (groupId && subscriberTelegramId && telegramGroupId) {
        try {
          console.log("🔗 Création de l'abonnement Telegram...");

          // PRÉPARER TOUTES LES DONNÉES avec le subscriptionType du groupe
          const subscriptionData = {
            groupId: groupId,
            telegramGroupId: telegramGroupId,
            groupName: groupName || product,
            creatorUid: creatorUid,
            subscriberTelegramId: subscriberTelegramId,
            subscriberTelegramUsername: subscriberTelegramUsername || null,
            subscriberName: subscriberName || "Utilisateur Telegram",
            subscriberEmail: subscriberEmail || null,
            paymentTransactionId: result.depositId,
            subscriptionType: groupSubscriptionType, // ← UTILISE LE SUBSCRIPTIONTYPE DU GROUPE
            paymentAmount: amountNumber,
            price: amountNumber,
            status: "active",
            paymentConfirmed: true,
            fromBot: false,
          };

          console.log("📤 Données envoyées à l'API:", subscriptionData);

          const subscriptionResponse = await fetch(
            "/api/telegram/subscriptions",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(subscriptionData),
            }
          );

          if (!subscriptionResponse.ok) {
            const errorData = await subscriptionResponse.json();
            console.error("❌ Erreur création abonnement:", errorData);
            alert("Erreur lors de la création de l'abonnement");
            return;
          } else {
            subscriptionResult = await subscriptionResponse.json();
            console.log(
              "✅ Abonnement Telegram créé:",
              subscriptionResult.subscriptionId
            );

            // RÉCUPÉRER LE LIEN D'INVITATION
            inviteLink = subscriptionResult.inviteLink;

            // Vérifier si le message a été envoyé
            if (subscriptionResult.notificationSent) {
              console.log("📨 Notification envoyée avec succès");
              console.log("🔗 Lien d'invitation:", inviteLink);
            } else {
              console.warn("⚠️ Notification non envoyée");
            }
          }
        } catch (subscriptionError) {
          console.error(
            "❌ Erreur lors de la création de l'abonnement:",
            subscriptionError
          );
          alert("Erreur lors de la création de l'abonnement");
          return;
        }
      }

      // 6. Notifier le succès
      if (onPaymentComplete) {
        onPaymentComplete("success");
      }

      // 7. Fermer le dialog et rediriger
      onOpenChange(false);

      // Rediriger vers la page de succès avec TOUTES les infos
      if (subscriptionResult?.subscriptionId) {
        const params = new URLSearchParams({
          subscriptionId: subscriptionResult.subscriptionId,
          groupName: encodeURIComponent(groupName || product),
          price: amountNumber.toString(),
          telegramUserId: subscriberTelegramId || "",
          subscriptionType: groupSubscriptionType, // ← UTILISE LE SUBSCRIPTIONTYPE DU GROUPE
          depositId: result.depositId,
        });

        // AJOUTER LE LIEN D'INVITATION S'IL EST DISPONIBLE
        if (inviteLink) {
          params.append("inviteLink", encodeURIComponent(inviteLink));
          console.log("🔗 Lien ajouté aux paramètres:", inviteLink);
        }

        router.push(
          `/telegram/subscription-success/${subscriptionResult.subscriptionId}?${params}`
        );
      } else {
        // Fallback - Créer l'abonnement manuellement
        console.warn(
          "⚠️ Aucun résultat d'abonnement, création manuelle de la page"
        );

        const manualSubscriptionId = `temp_${Date.now()}`;
        const params = new URLSearchParams({
          subscriptionId: manualSubscriptionId,
          groupName: encodeURIComponent(groupName || product),
          price: amountNumber.toString(),
          telegramUserId: subscriberTelegramId || "",
          subscriptionType: groupSubscriptionType, // ← UTILISE LE SUBSCRIPTIONTYPE DU GROUPE
          depositId: result.depositId,
          manualMode: "true",
        });

        router.push(
          `/telegram/subscription-success/${manualSubscriptionId}?${params}`
        );
      }
    } catch (error: any) {
      console.error("❌ Erreur lors du paiement:", error);
      if (onPaymentComplete) {
        onPaymentComplete("failed");
      }

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        alert("Problème de connexion au service de paiement.");
      } else {
        alert(error.message || "Erreur lors du traitement du paiement");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const pollTransactionStatus = async (depositId: string) => {
    let attempts = 0;
    const maxAttempts = 15;
    const delay = 3000;

    console.log(`🔄 Démarrage du polling pour depositId: ${depositId}`);

    while (attempts < maxAttempts) {
      try {
        console.log(`🔄 Polling #${attempts + 1} pour depositId=${depositId}`);

        const response = await fetch(
          `/api/pawapay/deposits?depositId=${depositId}`
        );

        if (!response.ok) {
          console.warn(
            `⚠️ HTTP ${response.status}, nouvelle tentative dans ${
              delay / 1000
            }s`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          attempts++;
          continue;
        }

        const result = await response.json();
        console.log("📊 Réponse polling:", result);

        if (result.status === "FOUND" && result.data) {
          const transactionStatus = result.data.status || result.data.state;
          console.log("📊 Statut transaction réel:", transactionStatus);

          if (
            transactionStatus === "SUCCESS" ||
            transactionStatus === "COMPLETED" ||
            transactionStatus === "SUCCESSFUL"
          ) {
            console.log("✅ Transaction confirmée SUCCESSFUL");
            return { ok: true, data: result };
          }

          if (
            transactionStatus === "FAILED" ||
            transactionStatus === "REJECTED" ||
            transactionStatus === "CANCELLED"
          ) {
            console.log("❌ Transaction échouée");
            return { ok: false, error: "Transaction échouée", data: result };
          }

          if (
            transactionStatus === "PROCESSING" ||
            transactionStatus === "PENDING"
          ) {
            console.log("⏳ Transaction en cours:", transactionStatus);
          }
        } else if (result.data?.status) {
          const transactionStatus = result.data.status;
          console.log("📊 Statut data.status:", transactionStatus);

          if (
            transactionStatus === "SUCCESS" ||
            transactionStatus === "COMPLETED" ||
            transactionStatus === "SUCCESSFUL"
          ) {
            console.log("✅ Transaction confirmée");
            return { ok: true, data: result };
          }

          if (
            transactionStatus === "FAILED" ||
            transactionStatus === "REJECTED" ||
            transactionStatus === "CANCELLED"
          ) {
            console.log("❌ Transaction échouée");
            return { ok: false, error: "Transaction échouée", data: result };
          }
        } else if (result.status) {
          const status = result.status;
          console.log("📊 Statut racine:", status);

          if (
            status === "SUCCESS" ||
            status === "COMPLETED" ||
            status === "SUCCESSFUL"
          ) {
            console.log("✅ Transaction confirmée");
            return { ok: true, data: result };
          }

          if (
            status === "FAILED" ||
            status === "REJECTED" ||
            status === "CANCELLED"
          ) {
            console.log("❌ Transaction échouée");
            return { ok: false, error: "Transaction échouée", data: result };
          }
        }

        console.log(`⏳ Statut non final, attente ${delay / 1000}s...`);
      } catch (error) {
        console.error("❌ Erreur lors du polling:", error);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      attempts++;
    }

    console.log("⏰ Timeout après", maxAttempts, "tentatives");
    return {
      ok: false,
      error: `Timeout - Transaction non confirmée après ${
        (maxAttempts * delay) / 1000
      } secondes`,
      timeout: true,
    };
  };

  const handleCountryChange = (newCountryCode: string) => {
    setSelectedCountry(newCountryCode);
    setMobileProvider(undefined);
    setPhoneNumber("");
  };

  const formatPhoneDisplay = (phone: string): string => {
    const cleanPhone = phone.replace(/[^\d]/g, "");
    if (cleanPhone.length <= 3) return cleanPhone;
    if (cleanPhone.length <= 6)
      return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3)}`;
    return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(
      3,
      6
    )} ${cleanPhone.slice(6, 9)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneDisplay(value);
    setPhoneNumber(formatted);
  };

  // ÉTAT PENDING
  if (paymentState === "pending") {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
              Paiement en cours
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                Confirmation en cours...
              </h3>
              <p className="text-sm text-muted-foreground">
                Vérification du statut de votre paiement
              </p>
              <p className="text-lg font-bold text-blue-600">
                {getDisplayAmount()}
              </p>
              {groupSubscriptionType && (
                <p className="text-sm text-blue-600">
                  Durée: {formatSubscriptionType(groupSubscriptionType)}
                </p>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Instructions:</strong>
                </p>
                <ol className="text-xs text-blue-600 mt-1 list-decimal list-inside">
                  <li>Vérifiez les notifications sur votre téléphone</li>
                  <li>Validez le paiement dans l'interface Mobile Money</li>
                  <li>Attendez la confirmation automatique</li>
                </ol>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full animate-pulse"
                style={{ width: "70%" }}
              ></div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} className="w-full">
              Annuler le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ÉTAT SUCCESS
  if (paymentState === "success") {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Paiement réussi !
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-75"></div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-green-800">
                Abonnement activé
              </h3>
              <p className="text-sm text-muted-foreground">
                Vous avez maintenant accès à {product}
              </p>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Montant:</strong> {getDisplayAmount()}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Produit:</strong> {product}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Durée:</strong>{" "}
                  {formatSubscriptionType(groupSubscriptionType)}
                </p>
                {groupId && (
                  <p className="text-sm text-green-700">
                    <strong>Groupe Telegram:</strong> Accès accordé
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                onOpenChange(false);
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Continuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ÉTAT FAILED
  if (paymentState === "failed") {
    return (
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <XCircle className="h-6 w-6 text-red-600" />
              Paiement échoué
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-red-800">
                Échec de la transaction
              </h3>
              <p className="text-sm text-muted-foreground">
                Votre paiement n'a pas pu être traité
              </p>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Raisons possibles:</strong>
                  <br />
                  • Solde insuffisant
                  <br />
                  • Transaction refusée
                  <br />• Erreur technique temporaire
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              Fermer
            </Button>
            <Button
              onClick={() => {
                setSelectedCountry(undefined);
                setMobileProvider(undefined);
                setPhoneNumber("");
                if (onPaymentComplete) {
                  onPaymentComplete("idle");
                }
              }}
              className="w-full sm:w-auto"
            >
              Réessayer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // FORMULAIRE DE PAIEMENT (état initial)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-600" />
            Paiement sécurisé Telegram
          </DialogTitle>
          <DialogDescription>
            Finalisez votre abonnement à {product}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Résumé */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{product}</p>
                  <p className="text-sm text-muted-foreground">
                    Abonnement Telegram Premium
                  </p>
                  {groupSubscriptionType && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {formatSubscriptionType(groupSubscriptionType)}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{getDisplayAmount()}</p>
                  <Badge variant="secondary" className="text-xs">
                    Paiement unique
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Localisation */}
          {userLocation && (
            <div className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-blue-50 rounded">
              <MapPin className="h-4 w-4" />
              <span>Localisation: {userLocation.country}</span>
            </div>
          )}

          {/* Pays */}
          <div className="space-y-2">
            <Label>Pays *</Label>
            <Select
              value={selectedCountry}
              onValueChange={handleCountryChange}
              disabled={isProcessing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre pays" />
              </SelectTrigger>
              <SelectContent>
                {PAWAPAY_COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center gap-2">
                      <img
                        src={country.flag}
                        alt={`${country.name} flag`}
                        className="w-6 h-4 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{country.name}</div>
                        <div className="text-xs text-gray-500">
                          {country.dialCode}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opérateur */}
          {selectedCountry && (
            <div className="space-y-2">
              <Label>Opérateur mobile *</Label>
              <RadioGroup
                value={mobileProvider}
                onValueChange={setMobileProvider}
                disabled={isProcessing}
                className="grid grid-cols-2 gap-2"
              >
                {availableProviders.map((provider) => (
                  <div key={provider.id}>
                    <RadioGroupItem
                      value={provider.id}
                      id={provider.id}
                      className="peer sr-only"
                      disabled={isProcessing}
                    />
                    <Label
                      htmlFor={provider.id}
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Smartphone className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">
                        {provider.name}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Numéro de téléphone */}
          {selectedCountry && mobileProvider && (
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone *</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 border rounded-md bg-muted text-muted-foreground min-w-[80px] justify-center">
                  {currentCountry?.dialCode}
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="6XX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="flex-1"
                  disabled={isProcessing}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Vous recevrez une demande de paiement sur ce numéro
              </p>
            </div>
          )}

          {/* Bouton de paiement */}
          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handlePayment}
            disabled={
              isProcessing ||
              !selectedCountry ||
              !mobileProvider ||
              phoneNumber.length < 5 ||
              !amount ||
              isLoadingGroup
            }
          >
            {isProcessing || isLoadingGroup ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isLoadingGroup ? "Chargement..." : "Initialisation..."}
              </div>
            ) : (
              `Payer ${getDisplayAmount()}`
            )}
          </Button>

          {groupSubscriptionType && (
            <div className="text-center text-sm text-gray-600">
              <p>Durée: {formatSubscriptionType(groupSubscriptionType)}</p>
            </div>
          )}

          <p className="text-xs text-center text-gray-500">
            Paiement 100% sécurisé via PawaPay
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
