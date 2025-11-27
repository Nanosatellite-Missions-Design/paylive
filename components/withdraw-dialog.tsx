"use client";

import type React from "react";
import { v4 as uuidv4 } from "uuid";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  ArrowRight,
  BanknoteIcon,
  Check,
  CreditCard,
  DollarSign,
  Loader2,
  Phone,
  RefreshCw,
  Shield,
  User,
  Wallet,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { WithdrawRequest } from "@/types/financial";
import { useAuth } from "@/contexts/auth-context";
import { addToSubCollection } from "@/functions/add-to-a-sub-collection";
import { updateDocument } from "@/functions/update-doc-in-collection";
import { increment } from "firebase/firestore";
import { useTranslations } from "@/lib/useTranslations";
import {
  getCountryByCode,
  getProvidersByCountry,
  PAWAPAY_COUNTRIES,
} from "@/lib/countries";
import { toast } from "@/hooks/use-toast";
import { getCurrencyByCountry } from "@/lib/currencies";

// Importez les fonctions de conversion depuis votre autre projet
import {
  getCurrencyForCountry,
  convertXAFToCurrency,
  formatCurrencyWithSymbol,
  formatLocalDisplay,
} from "@/lib/allocate";
import { updateSubcollectionDocument } from "@/functions/update-doc-in-sub-collection";

interface WithdrawDialogProps {
  currentBalance: number;
  pendingWithdrawals?: number;
  onWithdraw: (request: WithdrawRequest) => Promise<void>;
  children?: React.ReactNode;
}

const PAWAPAY_MAX_WITHDRAWAL = 2000000; // 2,000,000 XAF
const PAWAPAY_WITHDRAWAL_FEE_PERCENTAGE = 0.01; // 1%

// Fonction de polling pour les retraits
const pollWithdrawalStatus = async (
  payoutId: string,
  intervalMs = 5000,
  maxAttempts = 12
): Promise<{ ok: boolean; data?: any; error?: string }> => {
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const res = await fetch(`/api/pawapay/withdrawals?payoutId=${payoutId}`);
      const responseData = await res.json();

      console.log(
        `🔄 Polling retrait #${attempt} pour payoutId=${payoutId}`,
        responseData
      );

      // ✅ Accéder au statut réel de la transaction
      const transactionStatus = responseData?.data?.status;

      if (!transactionStatus) {
        console.warn(
          "⚠️ Pas de statut de transaction reçu dans responseData.data"
        );
        await new Promise((r) => setTimeout(r, intervalMs));
        continue;
      }

      console.log(`📊 Statut retrait réel: ${transactionStatus}`);

      // ✅ Transaction confirmée
      if (
        transactionStatus === "SUCCESSFUL" ||
        transactionStatus === "COMPLETED"
      ) {
        console.log("✅ Retrait confirmé SUCCESSFUL");
        return { ok: true, data: responseData };
      }

      // ❌ Transaction échouée
      if (
        transactionStatus === "FAILED" ||
        transactionStatus === "DECLINED" ||
        transactionStatus === "REJECTED"
      ) {
        console.log("❌ Retrait échoué");
        return {
          ok: false,
          data: responseData,
          error: `Retrait échoué: ${transactionStatus}`,
        };
      }

      // Statuts intermédiaires - continuer le polling
      if (
        transactionStatus === "PROCESSING" ||
        transactionStatus === "PENDING" ||
        transactionStatus === "INITIATED" ||
        transactionStatus === "ACCEPTED"
      ) {
        console.log(`⏳ Retrait en cours: ${transactionStatus}`);
        await new Promise((r) => setTimeout(r, intervalMs));
        continue;
      }

      // Statut inconnu - continuer le polling
      console.warn(`⚠️ Statut inconnu: ${transactionStatus}`);
      await new Promise((r) => setTimeout(r, intervalMs));
    } catch (err: any) {
      console.error("⚠️ Erreur lors du polling retrait", err);
      return { ok: false, error: err.message };
    }
  }

  console.warn("⏱️ Polling timeout, le retrait reste en attente");
  return { ok: false, error: "timeout" };
};

// Fonction utilitaire pour mettre à jour le statut des transactions
const updateTransactionStatus = async (
  userId: string,
  transactionId: string,
  status: string,
  additionalData?: any
) => {
  try {
    // ✅ CORRECTION : Nettoyer les données pour éviter les valeurs undefined
    const cleanAdditionalData = additionalData
      ? Object.fromEntries(
          Object.entries(additionalData).filter(
            ([_, value]) => value !== undefined
          )
        )
      : {};

    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
      ...cleanAdditionalData,
    };

    console.log(
      `💾 Mise à jour transaction ${transactionId} avec statut: ${status}`,
      updateData
    );

    return await updateSubcollectionDocument(
      "users",
      userId,
      "transactions",
      transactionId,
      updateData
    );
  } catch (error) {
    console.error("❌ Erreur mise à jour statut transaction:", error);
    return false;
  }
};

export default function WithdrawDialog({
  pendingWithdrawals = 0,
  onWithdraw,
  children,
}: WithdrawDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"amount" | "method" | "confirm" | "success">(
    "amount"
  );
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<WithdrawRequest["method"]>("orange");
  const [accountDetails, setAccountDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null);
  const { user, userInfo, userTransactions } = useAuth();
  const t = useTranslations("Dashboard.Transactions");

  // États pour la gestion des pays et devises
  const [selectedCountry, setSelectedCountry] = useState<string>("CMR");
  const [currency, setCurrency] = useState("XAF");
  const [userLocation, setUserLocation] = useState<{
    country: string;
    countryCode: string;
  } | null>(null);

  const currentCountry = PAWAPAY_COUNTRIES.find(
    (c) => c.code === selectedCountry
  );
  const availableProviders = currentCountry?.providers || [];

  // Détection de la localisation de l'utilisateur
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

          // Définir comme pays par défaut si c'est un pays PawaPay
          const isPawaPayCountry = PAWAPAY_COUNTRIES.some(
            (country) => country.code === data.country_code
          );
          if (isPawaPayCountry) {
            setSelectedCountry(data.country_code);
          }
        }
      } catch (error) {
        console.log("Could not get user location:", error);
        // Fallback vers le premier pays disponible
        setSelectedCountry(PAWAPAY_COUNTRIES[0]?.code || "CMR");
      }
    };

    getUserLocation();
  }, []);

  // Effet pour synchroniser la devise quand le pays change
  useEffect(() => {
    if (selectedCountry) {
      const newCurrency = getCurrencyForCountry(selectedCountry);
      setCurrency(newCurrency);
    }
  }, [selectedCountry]);

  // Fonction sécurisée pour parser le montant
  const getSafeAmount = (): number => {
    if (!amount) return 0;
    try {
      // Supprimer tous les caractères non numériques sauf le point décimal
      const cleanAmount = amount.replace(/[^\d.]/g, "");
      return parseFloat(cleanAmount) || 0;
    } catch (error) {
      console.error("Error parsing amount:", error);
      return 0;
    }
  };

  // Fonction pour obtenir le montant dans la devise locale
  const getLocalAmount = (countryCode: string): number => {
    const targetCurrency = getCurrencyForCountry(countryCode);
    // Convertir le montant XAF en devise locale
    const amountNumber = getSafeAmount();
    return convertXAFToCurrency(amountNumber, targetCurrency);
  };

  // Fonction pour formater l'affichage du montant local
  const getLocalAmountDisplay = (countryCode: string): string => {
    const amountNumber = getSafeAmount();
    if (amountNumber === 0) return "0";
    return formatLocalDisplay(amountNumber, countryCode);
  };

  // Calcul du solde actuel
  const calculateCurrentBalance = () => {
    if (!userTransactions || userTransactions.length === 0) return 0;
    return userTransactions.reduce((balance, transaction) => {
      if (transaction.type === "deposit" || transaction.type === "sale") {
        return balance + (transaction.amount || 0);
      } else if (
        transaction.type === "withdrawal" ||
        transaction.type === "purchase"
      ) {
        return balance - (transaction.amount || 0);
      }
      return balance;
    }, 0);
  };

  // Constants
  const currentBalance = userInfo?.balance || 0;
  const minWithdraw = 100; // Minimum 100 XAF
  const maxWithdraw = Math.min(currentBalance, PAWAPAY_MAX_WITHDRAWAL);

  // ✅ CALCUL DES FRAIS ET MONTANT NET EN XAF (IMPORTANT pour PawaPay)
  const withdrawAmountXAF = getSafeAmount();
  const withdrawalFeeXAF =
    withdrawAmountXAF * PAWAPAY_WITHDRAWAL_FEE_PERCENTAGE;
  const netAmountXAF = Math.max(0, withdrawAmountXAF - withdrawalFeeXAF);

  // Montants convertis dans la devise locale (pour l'affichage seulement)
  const localWithdrawAmount = getLocalAmount(selectedCountry);
  const localWithdrawalFee = convertXAFToCurrency(
    withdrawalFeeXAF,
    getCurrencyForCountry(selectedCountry)
  );
  const localNetAmount = convertXAFToCurrency(
    netAmountXAF,
    getCurrencyForCountry(selectedCountry)
  );

  const estimatedDays = "24 hours";
  const showLimitInfo = currentBalance > PAWAPAY_MAX_WITHDRAWAL;

  const resetForm = () => {
    setAmount("");
    setMethod("orange");
    setAccountDetails("");
    setError(null);
    setStep("amount");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(resetForm, 300);
    }
  };

  const handleAmountSubmit = () => {
    const withdrawAmount = getSafeAmount();
    if (withdrawAmount < minWithdraw || withdrawAmount > maxWithdraw) {
      setError(
        `Le montant doit être entre ${minWithdraw} XAF et ${maxWithdraw.toLocaleString()} XAF`
      );
      return;
    }

    if (withdrawAmount > maxWithdraw) {
      setError(`Le montant maximum est de ${maxWithdraw.toLocaleString()} XAF`);
      return;
    }

    setError(null);
    setStep("method");
  };

  // ✅ GESTION DU PAYS AMÉLIORÉE AVEC CONVERSION
  const handleCountryChange = (newCountryCode: string) => {
    setSelectedCountry(newCountryCode);

    // Réinitialiser le provider et sélectionner le premier disponible
    const countryData = getCountryByCode(newCountryCode);
    if (countryData?.providers?.[0]) {
      setMethod(countryData.providers[0].id as WithdrawRequest["method"]);
    }
  };

  const handleMethodSubmit = () => {
    let isValid = true;
    if (!accountDetails) {
      setError("Veuillez saisir votre numéro de téléphone");
      isValid = false;
    }

    if (isValid) {
      setError(null);
      setStep("confirm");
    }
  };

  const handleConfirmWithdrawal = async () => {
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError("Utilisateur non connecté");
      setIsLoading(false);
      return;
    }

    // ✅ VALIDATIONS COMPLÈTES
    const validationErrors = [];

    if (!amount || getSafeAmount() <= 0) {
      validationErrors.push("Le montant est requis");
    }

    if (!selectedCountry) {
      validationErrors.push("Le pays est requis");
    }

    if (!method) {
      validationErrors.push("Le fournisseur est requis");
    }

    if (!accountDetails || accountDetails.length < 8) {
      validationErrors.push("Le numéro de téléphone est invalide");
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      setIsLoading(false);
      return;
    }

    // ✅ RÉCUPÉRATION DES DONNÉES PAYS
    const country = PAWAPAY_COUNTRIES.find((c) => c.code === selectedCountry);
    if (!country) {
      setError("Pays non supporté par PawaPay");
      setIsLoading(false);
      return;
    }

    // ✅ VÉRIFICATION QUE LE PROVIDER EST DISPONIBLE DANS LE PAYS
    const countryProvider = country.providers.find((p) => p.id === method);
    if (!countryProvider) {
      setError(
        `Le fournisseur ${method} n'est pas disponible en ${country.name}`
      );
      setIsLoading(false);
      return;
    }

    // ✅ CALCUL DES MONTANTS CORRIGÉ - TOUJOURS EN XAF
    const withdrawAmountXAF = getSafeAmount();
    const withdrawalFeeXAF =
      withdrawAmountXAF * PAWAPAY_WITHDRAWAL_FEE_PERCENTAGE;
    const netAmountXAF = Math.max(0, withdrawAmountXAF - withdrawalFeeXAF);

    // ✅ FORMATAGE DU NUMÉRO DE TÉLÉPHONE
    let cleanPhoneNumber = accountDetails.replace(/[^\d]/g, "");

    if (cleanPhoneNumber.startsWith("0")) {
      cleanPhoneNumber = cleanPhoneNumber.substring(1);
    }

    const dialCode = country.dialCode.replace("+", "");
    const fullPhoneNumber = dialCode + cleanPhoneNumber;

    // ✅ PRÉPARATION DU PAYLOAD POUR PAWAPAY
    const payoutId = uuidv4();

    let transactionData: any = null;
    let transactionRef: any = null;
    let transactionId: string | null = null;

    try {
      // ✅ ÉTAPE 1: CRÉER LA TRANSACTION AVEC STATUT "pending" DANS FIRESTORE
      transactionData = {
        // Informations de base
        type: "withdrawal",
        status: "pending",
        timestamp: new Date().toISOString(),

        // Informations montant - TOUJOURS EN XAF
        amount: netAmountXAF,
        fees: withdrawalFeeXAF,
        totalAmount: withdrawAmountXAF,
        currency: "XAF",

        // ✅ AJOUT DES MONTANTS CONVERTIS POUR L'AFFICHAGE
        localAmount: localNetAmount,
        localCurrency: currency,
        originalAmountXAF: withdrawAmountXAF.toString(),

        // Informations bénéficiaire
        paymentMethod: method,
        providerName: countryProvider.name,
        phoneNumber: fullPhoneNumber,
        formattedPhoneNumber: country.dialCode + " " + accountDetails,

        // Informations géographiques
        country: {
          code: selectedCountry,
          name: country.name,
          dialCode: country.dialCode,
        },

        // Références
        payoutId: payoutId,
        userUid: user.uid,

        // Métadonnées
        processingFeeRate: "1%",

        // ✅ AJOUTER LES DATES
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log(
        "💾 Création transaction avec statut pending:",
        transactionData
      );

      // ✅ AJOUTER LA TRANSACTION À FIRESTORE AVEC STATUT "pending"
      transactionRef = await addToSubCollection(
        transactionData,
        "users",
        user.uid,
        "transactions"
      );

      // ✅ RÉCUPÉRER L'ID DE LA TRANSACTION CRÉÉE
      transactionId = transactionRef?.id;
      console.log(
        "✅ Transaction créée avec ID:",
        transactionId,
        "et statut pending"
      );

      // ✅ ÉTAPE 2: APPEL API PAWAPAY - CORRECTION CRITIQUE : ENVOYER LE MONTANT EN XAF
      const res = await fetch("/api/pawapay/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // ✅ CORRECTION : Envoyer le montant NET en XAF pour les retraits
          amount: Math.floor(netAmountXAF),
          phoneNumber: fullPhoneNumber,
          provider: method,
          customerId: user.uid,
          countryCode: selectedCountry,
          currency: "XAF", // ✅ CORRECTION : Toujours XAF pour les retraits
          payoutId: payoutId,
        }),
      });

      const data = await res.json();
      console.log("📥 Réponse initiale PawaPay:", data);

      if (!res.ok) {
        console.error("❌ Erreur détaillée PawaPay:", {
          status: res.status,
          statusText: res.statusText,
          data: data,
        });

        if (transactionId) {
          await updateTransactionStatus(user.uid, transactionId, "failed", {
            errorMessage:
              data.error || data.details || `Erreur HTTP ${res.status}`,
            pawapayResponse: data,
          });
        }

        // ✅ AMÉLIORATION : Messages d'erreur plus détaillés
        let errorMessage =
          data.error ||
          data.details ||
          `Erreur HTTP ${res.status}: ${res.statusText}`;

        // Messages d'erreur spécifiques PawaPay
        if (
          data.error?.includes("amount") ||
          data.details?.includes("amount")
        ) {
          errorMessage =
            "Erreur de montant. Veuillez vérifier le montant saisi.";
        } else if (
          data.error?.includes("phone") ||
          data.details?.includes("phone")
        ) {
          errorMessage = "Numéro de téléphone invalide pour ce pays.";
        } else if (
          data.error?.includes("provider") ||
          data.details?.includes("provider")
        ) {
          errorMessage = "Fournisseur mobile non disponible pour ce pays.";
        }

        throw new Error(errorMessage);
      }

      if (!data.payoutId) {
        throw new Error("ID de retrait manquant dans la réponse");
      }

      // ✅ ÉTAPE 3: POLLING POUR VÉRIFIER LE STATUT EN TEMPS RÉEL
      console.log("🔄 Début du polling pour le statut du retrait...");
      const pollResult = await pollWithdrawalStatus(data.payoutId);

      let finalStatus = "pending";
      let shouldDecrementBalance = false;

      if (pollResult.ok) {
        finalStatus = "completed";
        shouldDecrementBalance = true;
        console.log(
          "✅ Retrait confirmé par PawaPay via polling - Statut final: completed"
        );
      } else {
        finalStatus = pollResult.error === "timeout" ? "pending" : "failed";
        shouldDecrementBalance = false;
        console.warn(`⚠️ Retrait en statut: ${finalStatus}`, pollResult.error);
      }

      // ✅ ÉTAPE 4: METTRE À JOUR LA TRANSACTION AVEC LE STATUT FINAL DANS FIRESTORE
      if (transactionId) {
        const updateSuccess = await updateTransactionStatus(
          user.uid,
          transactionId,
          finalStatus,
          {
            payoutId: data.payoutId,
            pawapayResponse: pollResult.data || data,
            pollingResult: pollResult.ok
              ? { ok: true }
              : { ok: false, error: pollResult.error },
          }
        );

        if (updateSuccess) {
          console.log(
            `✅ Transaction ${transactionId} mise à jour avec statut: ${finalStatus}`
          );
        } else {
          console.error(`❌ Échec mise à jour statut pour ${transactionId}`);
        }
      }

      // ✅ ÉTAPE 5: DÉCRÉMENTER LE SOLDE UNIQUEMENT SI LE RETRAIT EST CONFIRMÉ
      if (shouldDecrementBalance) {
        const updateResult = await updateDocument("users", user.uid, {
          balance: increment(-withdrawAmountXAF),
          lastWithdrawal: new Date().toISOString(),
          totalWithdrawn: increment(withdrawAmountXAF),
        });

        if (updateResult) {
          console.log("✅ Solde décrémenté - retrait confirmé");
        } else {
          console.error("❌ Échec décrémentation solde");
        }
      } else {
        console.log("ℹ️ Solde non décrémenté - retrait en attente ou échoué");
      }

      // ✅ SUCCÈS - PASSAGE À L'ÉTAT SUCCESS
      setStep("success");
      setWithdrawalId(data.payoutId);

      // ✅ TOAST DE SUCCÈS ADAPTÉ AU STATUT
      if (toast) {
        if (finalStatus === "completed") {
          toast({
            title: "✅ Retrait réussi",
            description: `Votre retrait de ${getLocalAmountDisplay(
              selectedCountry
            )} a été envoyé à ${country.dialCode} ${accountDetails}`,
          });
        } else if (finalStatus === "pending") {
          toast({
            title: "⏳ Retrait en attente",
            description: `Votre retrait de ${getLocalAmountDisplay(
              selectedCountry
            )} est en cours de traitement.`,
            variant: "default",
          });
        } else {
          toast({
            title: "❌ Retrait échoué",
            description: `Votre retrait n'a pas pu être traité. Veuillez réessayer.`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("❌ Erreur complète lors du retrait:", error);
      const errorMessage = (error as Error).message;

      if (transactionId) {
        try {
          await updateTransactionStatus(user.uid, transactionId, "failed", {
            errorMessage: errorMessage,
          });
          console.log("✅ Transaction mise à jour avec statut: failed");
        } catch (updateError) {
          console.error(
            "❌ Erreur lors de la mise à jour du statut failed:",
            updateError
          );
        }
      }

      // Messages d'erreur personnalisés
      if (
        errorMessage.includes("insufficient funds") ||
        errorMessage.includes("solde")
      ) {
        setError("Fonds insuffisants pour effectuer ce retrait");
      } else if (
        errorMessage.includes("phone") ||
        errorMessage.includes("numéro")
      ) {
        setError("Numéro de téléphone invalide");
      } else if (
        errorMessage.includes("provider") ||
        errorMessage.includes("fournisseur")
      ) {
        setError("Fournisseur mobile non disponible");
      } else if (
        errorMessage.includes("country") ||
        errorMessage.includes("pays")
      ) {
        setError("Pays non supporté");
      } else if (errorMessage.includes("INVALID_PARAMETER")) {
        setError("Paramètres de retrait invalides");
      } else if (errorMessage.includes("MISSING_PARAMETER")) {
        setError("Paramètres manquants pour le retrait");
      } else {
        setError(`Erreur lors du retrait: ${errorMessage}`);
      }

      if (toast) {
        toast({
          title: "Erreur de retrait",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setOpen(false);
    resetForm();
  };

  const getMethodDetails = () => {
    return (
      <div className="space-y-2">
        <Label htmlFor="account-details">{t("WithdrawDialog.2.phone")}</Label>
        <Input
          id="phoneNumber"
          value={accountDetails}
          onChange={(e) => setAccountDetails(e.target.value)}
          placeholder={t("WithdrawDialog.2.phonePlaceholder")}
          required
        />
      </div>
    );
  };

  const getDialogContent = () => {
    switch (step) {
      case "amount":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{t("withdrawFunds")}</span>
                {pendingWithdrawals > 0 && (
                  <Badge variant="outline" className="font-normal">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {pendingWithdrawals} {t("pending")}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {t("WithdrawDialog.1.description")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Sélection du pays */}
              <div className="space-y-2">
                <Label htmlFor="country">Pays de Retrait</Label>
                <select
                  id="country"
                  value={selectedCountry}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  {PAWAPAY_COUNTRIES.map((country) => {
                    const amountNumber = getSafeAmount();
                    const displayAmount =
                      amountNumber > 0
                        ? formatLocalDisplay(amountNumber, country.code)
                        : "";

                    return (
                      <option key={country.code} value={country.code}>
                        {country.name} ({getCurrencyForCountry(country.code)})
                        {getCurrencyForCountry(country.code) !== "XAF" &&
                          displayAmount && <span> • ≈ {displayAmount}</span>}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-600">
                  {t("WithdrawDialog.1.availableBalance")}
                </span>
                <span className="text-lg font-semibold">
                  {currentBalance.toLocaleString()} XAF
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  {t("WithdrawDialog.1.withdrawalAmount")} (
                  {getCurrencyForCountry(selectedCountry)})
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10"
                    min={minWithdraw}
                    max={maxWithdraw}
                    step="0.01"
                    required
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    Min: {formatLocalDisplay(minWithdraw, selectedCountry)}
                  </span>
                  <span>
                    Max: {formatLocalDisplay(maxWithdraw, selectedCountry)}
                  </span>
                </div>

                {/* Affichage du montant de référence en XAF */}
                {getCurrencyForCountry(selectedCountry) !== "XAF" &&
                  getSafeAmount() > 0 && (
                    <p className="text-xs text-gray-500 text-center">
                      Référence: {getSafeAmount().toLocaleString()} XAF
                    </p>
                  )}
              </div>

              {getSafeAmount() > 0 && (
                <div className="p-3 border rounded-md space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("WithdrawDialog.1.withdrawalAmount")}</span>
                    <span>{getLocalAmountDisplay(selectedCountry)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{t("WithdrawDialog.1.processingFee")}</span>
                    <span>
                      -
                      {formatCurrencyWithSymbol(
                        localWithdrawalFee,
                        getCurrencyForCountry(selectedCountry)
                      )}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-medium">
                    <span>{t("WithdrawDialog.1.youReceive")}</span>
                    <span>
                      {formatCurrencyWithSymbol(
                        localNetAmount,
                        getCurrencyForCountry(selectedCountry)
                      )}
                    </span>
                  </div>
                  <hr />
                  <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-50 rounded">
                    <Shield className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-700">
                      <strong>Frais de service :</strong> PawaPay prélève{" "}
                      {PAWAPAY_WITHDRAWAL_FEE_PERCENTAGE * 100}% sur chaque
                      retrait pour couvrir les coûts de traitement.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("WithdrawDialog.Error.title")}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={handleAmountSubmit}
                disabled={
                  !amount ||
                  getSafeAmount() < minWithdraw ||
                  getSafeAmount() > maxWithdraw
                }
                className="w-full"
              >
                {t("WithdrawDialog.continue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        );

      // ... (les autres cas method, confirm, success restent identiques)
      case "method":
        return (
          <>
            <DialogHeader>
              <DialogTitle>{t("WithdrawDialog.2.title")}</DialogTitle>
              <DialogDescription>
                {t("WithdrawDialog.2.description")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-600">
                  {t("WithdrawDialog.2.withdrawalAmount")}
                </span>
                <span className="text-lg font-semibold">
                  {getLocalAmountDisplay(selectedCountry)}
                </span>
                {getCurrencyForCountry(selectedCountry) !== "XAF" && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({getSafeAmount().toLocaleString()} XAF)
                  </span>
                )}
              </div>

              <RadioGroup
                value={method}
                onValueChange={(value: WithdrawRequest["method"]) =>
                  setMethod(value)
                }
              >
                {availableProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center space-x-2 border rounded-md p-3"
                  >
                    <RadioGroupItem value={provider.id} id={provider.id} />
                    <Label
                      htmlFor={provider.id}
                      className="flex-1 flex items-center cursor-pointer"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      <div>
                        <div>{provider.name}</div>
                        <div className="text-xs text-gray-500">
                          {/* Estimation du temps */}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="pt-2">{getMethodDetails()}</div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("WithdrawDialog.Error.title")}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("amount")}>
                {t("WithdrawDialog.back")}
              </Button>
              <Button onClick={handleMethodSubmit}>
                {t("WithdrawDialog.continue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        );

      case "confirm":
        return (
          <>
            <DialogHeader>
              <DialogTitle>{t("WithdrawDialog.3.title")}</DialogTitle>
              <DialogDescription>
                {t("WithdrawDialog.3.description")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-3 p-4 border rounded-md">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.3.amount")}
                  </span>
                  <span className="font-medium">
                    {getLocalAmountDisplay(selectedCountry)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frais</span>
                  <span className="text-gray-600">
                    -
                    {formatCurrencyWithSymbol(
                      localWithdrawalFee,
                      getCurrencyForCountry(selectedCountry)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.3.youReceive")}
                  </span>
                  <span className="font-bold">
                    {formatCurrencyWithSymbol(
                      localNetAmount,
                      getCurrencyForCountry(selectedCountry)
                    )}
                  </span>
                </div>
                {getCurrencyForCountry(selectedCountry) !== "XAF" && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Montant référence:</span>
                    <span>{getSafeAmount().toLocaleString()} XAF</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.3.method")}
                  </span>
                  <span className="font-medium capitalize">{method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.3.phone")}
                  </span>
                  <span>{accountDetails}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pays</span>
                  <span>{currentCountry?.name}</span>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("WithdrawDialog.3.Notice.title")}</AlertTitle>
                <AlertDescription>
                  {t("WithdrawDialog.3.Notice.description")}
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("WithdrawDialog.Error.title")}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("method")}>
                {t("WithdrawDialog.back")}
              </Button>
              <Button onClick={handleConfirmWithdrawal} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>{t("WithdrawDialog.confirm")}</>
                )}
              </Button>
            </DialogFooter>
          </>
        );

      case "success":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">
                Retrait réussi
              </DialogTitle>
              <DialogDescription className="text-center">
                Votre retrait a été traité avec succès
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>

              <div>
                <p className="text-xl font-semibold">
                  {formatCurrencyWithSymbol(
                    localNetAmount,
                    getCurrencyForCountry(selectedCountry)
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {t("WithdrawDialog.4.willBeSent")}
                </p>
                {getCurrencyForCountry(selectedCountry) !== "XAF" && (
                  <p className="text-sm text-gray-400">
                    ({getSafeAmount().toLocaleString()} XAF)
                  </p>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.4.withdrawalID")}
                  </span>
                  <span className="font-mono">{withdrawalId}</span>
                </div>
                {/* <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.3.estimatedArrival")}
                  </span>
                  <span>{estimatedDays}</span>
                </div> */}
              </div>

              <p className="text-sm text-gray-500">
                {t("WithdrawDialog.4.recieveSMS")}
              </p>
            </div>

            <DialogFooter>
              <Button className="w-full" onClick={handleSuccessClose}>
                {t("WithdrawDialog.4.done")}
              </Button>
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="w-full" onClick={() => setOpen(true)}>
            <Wallet className="mr-2 h-4 w-4" />
            {t("withdrawFunds")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {getDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
