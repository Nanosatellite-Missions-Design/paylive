"use client";

import type React from "react";
import { v4 as uuidv4 } from "uuid";
import { useState } from "react";
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

interface WithdrawDialogProps {
  currentBalance: number;
  pendingWithdrawals?: number;
  onWithdraw: (request: WithdrawRequest) => Promise<void>;
  children?: React.ReactNode;
}

const PAWAPAY_MAX_WITHDRAWAL = 2000000; // 2,000,000 XAF
const PAWAPAY_WITHDRAWAL_FEE_PERCENTAGE = 0.01; // 1%

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
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null);
  const { user, userInfo, userTransactions } = useAuth();
  const t = useTranslations("Dashboard.Transactions");
  // new states
  const [selectedCountry, setSelectedCountry] = useState("CMR"); // Valeur par défaut (e.g., Cameroun)
  const [currency, setCurrency] = useState("XAF");

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
  const currentBalance = calculateCurrentBalance();

  const minWithdraw = 100; // Minimum 100 XAF
  const maxWithdraw = Math.min(currentBalance, PAWAPAY_MAX_WITHDRAWAL);
  const withdrawalFee = PAWAPAY_WITHDRAWAL_FEE_PERCENTAGE * Number(amount);
  const netAmount = Math.max(
    0,
    Number.parseFloat(amount || "0") - 0.01 * Number(amount)
  );
  const estimatedDays = "24 hours";
  const showLimitInfo = currentBalance > PAWAPAY_MAX_WITHDRAWAL;

  const resetForm = () => {
    setAmount("");
    setMethod("orange");
    setAccountDetails("");
    setBankName("");
    setAccountNumber("");
    setRoutingNumber("");
    setPaypalEmail("");
    setError(null);
    setStep("amount");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when dialog closes
      setTimeout(resetForm, 300); // Delay to allow dialog animation to complete
    }
  };

  const handleAmountSubmit = () => {
    const withdrawAmount = Number.parseFloat(amount);
    if (withdrawAmount < minWithdraw || withdrawAmount > maxWithdraw) {
      setError(
        `Amount must be between XAF${minWithdraw} and XAF${maxWithdraw}`
      );
      return;
    }

    if (withdrawAmount > maxWithdraw) {
      setError(
        `Le montant maximum est de ${maxWithdraw.toLocaleString()} ${currency}`
      );
      return;
    }

    setError(null);
    setStep("method");
  };

  // ✅ GESTION DU PAYS AMÉLIORÉE
  const handleCountryChange = (newCountryCode: string) => {
    setSelectedCountry(newCountryCode);
    setCurrency(getCurrencyByCountry(newCountryCode));

    // Réinitialiser le provider et sélectionner le premier disponible
    const countryData = getCountryByCode(newCountryCode);
    if (countryData?.providers?.[0]) {
      setMethod(countryData.providers[0].id as WithdrawRequest["method"]);
    }
  };

  const handleMethodSubmit = () => {
    let isValid = true;
    if (!accountDetails) {
      setError("Please fill in your account number");
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

    if (!amount || Number.parseFloat(amount) <= 0) {
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

    // ✅ CALCUL DES MONTANTS CORRIGÉ
    const withdrawAmount = Number.parseFloat(amount);
    const withdrawalFee = withdrawAmount * PAWAPAY_WITHDRAWAL_FEE_PERCENTAGE; // ✅ 1%
    const netAmount = Math.max(0, withdrawAmount - withdrawalFee);

    // ✅ FORMATAGE DU NUMÉRO DE TÉLÉPHONE
    let cleanPhoneNumber = accountDetails.replace(/[^\d]/g, "");

    // Supprimer le préfixe '0' si présent
    if (cleanPhoneNumber.startsWith("0")) {
      cleanPhoneNumber = cleanPhoneNumber.substring(1);
    }

    // Ajouter l'indicatif pays SANS le '+'
    const dialCode = country.dialCode.replace("+", "");
    const fullPhoneNumber = dialCode + cleanPhoneNumber;

    // ✅ RÉCUPÉRATION DE LA DEVISE
    const currency = getCurrencyByCountry(selectedCountry);

    // ✅ PRÉPARATION DU PAYLOAD POUR PAWAPAY (STRUCTURE EXACTE)
    const payoutId = uuidv4(); // Vous devrez importer uuidv4
    const payload = {
      payoutId: payoutId,
      amount: String(Math.floor(netAmount)), // ✅ String et montant NET
      currency: currency,
      recipient: {
        type: "MMO",
        accountDetails: {
          phoneNumber: fullPhoneNumber, // ✅ Déjà formaté sans '+'
          provider: method, // ✅ ID du provider PawaPay
        },
      },
    };

    console.log("📤 Payload pour PawaPay:", JSON.stringify(payload, null, 2));

    try {
      // ✅ APPEL API PAWAPAY VIA VOTRE SERVEUR EXPRESS
      const res = await fetch("/api/pawapay/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.floor(netAmount),
          phoneNumber: fullPhoneNumber,
          provider: method,
          customerId: user.uid,
          countryCode: selectedCountry,
          currency: currency,
        }),
      });

      const data = await res.json();
      console.log("📥 Réponse complète:", data);

      if (!res.ok) {
        // ✅ MEILLEUR LOGGING DE L'ERREUR
        console.error("❌ Erreur détaillée:", {
          status: res.status,
          statusText: res.statusText,
          data: data,
        });

        throw new Error(
          data.error ||
            data.details ||
            `Erreur HTTP ${res.status}: ${res.statusText}`
        );
      }

      // ✅ VÉRIFICATION DE LA RÉPONSE PAWAPAY
      if (!data.payoutId) {
        throw new Error("ID de retrait manquant dans la réponse");
      }

      // ✅ PRÉPARATION DE LA TRANSACTION POUR FIRESTORE
      const transactionData = {
        // Informations de base
        type: "withdrawal",
        status: data.status || "pending", // ✅ Utiliser le status de PawaPay
        timestamp: new Date().toISOString(),

        // Informations montant
        amount: netAmount,
        fees: withdrawalFee,
        totalAmount: withdrawAmount,
        currency: currency,

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
        payoutId: data.payoutId,
        userUid: user.uid,

        // Métadonnées
        // estimatedArrival: "5 min",
        processingFeeRate: "1%",

        // ✅ AJOUTER LA DATE DE CRÉATION POUR FIRESTORE
        createdAt: new Date().toISOString(),
      };

      console.log("💾 Enregistrement transaction:", transactionData);

      // ✅ ENREGISTREMENT DANS FIRESTORE
      try {
        // Ajouter à la sous-collection transactions
        await addToSubCollection(
          transactionData,
          "users",
          user.uid, // ✅ Utiliser user.uid, pas userInfo.uid
          "transactions"
        );

        // ✅ CORRECTION : DÉCRÉMENTER LE SOLDE POUR UN RETRAIT
        await updateDocument("users", user.uid, {
          balance: increment(-withdrawAmount), // ✅ DÉCRÉMENTER
          lastWithdrawal: new Date().toISOString(),
          totalWithdrawn: increment(withdrawAmount),
        });

        console.log("✅ Transaction et solde mis à jour avec succès");
      } catch (firebaseError) {
        console.error("❌ Erreur Firebase:", firebaseError);
        // Ne pas bloquer le processus pour une erreur Firebase
      }

      // ✅ SUCCÈS - PASSAGE À L'ÉTAT SUCCESS
      setStep("success");
      setWithdrawalId(data.payoutId);

      // ✅ TOAST DE SUCCÈS
      if (toast) {
        toast({
          title: "Retrait initié avec succès",
          description: `Votre retrait de ${netAmount} ${currency} a été envoyé à ${country.dialCode} ${accountDetails}`,
        });
      }
    } catch (error) {
      console.error("❌ Erreur complète lors du retrait:", error);

      // ✅ GESTION D'ERREUR DÉTAILLÉE
      const errorMessage = (error as Error).message;
      console.error("📋 Détails de l'erreur:", errorMessage);

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

      // ✅ TOAST D'ERREUR
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
    switch (method) {
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor="account-details">
              {t("WithdrawDialog.2.phone")}
            </Label>
            <Input
              id="phoneNumber"
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              placeholder={t("WithdrawDialog.2.phonePlaceholder")}
              required
            />
          </div>
        );
    }
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
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-600">
                  {t("WithdrawDialog.1.availableBalance")}
                </span>
                <span className="text-lg font-semibold">
                  {currentBalance.toLocaleString()} {currency}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  {t("WithdrawDialog.1.withdrawalAmount")}
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
                    Min: {minWithdraw}
                    {currency}
                  </span>
                  <span>
                    Max: {maxWithdraw} {currency}
                  </span>
                </div>
              </div>

              {Number.parseFloat(amount || "0") > 0 && (
                <div className="p-3 border rounded-md space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("WithdrawDialog.1.withdrawalAmount")}</span>
                    <span>
                      {Number.parseFloat(amount).toLocaleString()}
                      {currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{t("WithdrawDialog.1.processingFee")}</span>
                    <span>-XAF{withdrawalFee}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-medium">
                    <span>{t("WithdrawDialog.1.youReceive")}</span>
                    <span>
                      -{netAmount.toFixed(2)}
                      {currency}
                    </span>
                  </div>
                  <hr />
                  {/* ✅ INFORMATION SUR LES FRAIS */}
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
                  Number.parseFloat(amount) < minWithdraw ||
                  Number.parseFloat(amount) > maxWithdraw
                }
                className="w-full"
              >
                {t("WithdrawDialog.continue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        );

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
              {/* AJOUT DE LA SÉLECTION DU PAYS ET DE LA DEVISE (similaire au dépôt) */}
              <div className="space-y-2">
                <Label htmlFor="country">
                  Pays de Retrait (Devise:{" "}
                  {getCurrencyByCountry(selectedCountry)})
                </Label>
                <select
                  id="country"
                  value={selectedCountry}
                  onChange={(e) => {
                    const newCountryCode = e.target.value;
                    setSelectedCountry(newCountryCode);
                    const countryData = getCountryByCode(newCountryCode);
                    setCurrency(getCurrencyByCountry(newCountryCode)); // Optionnel : si votre getCurrencyByCountry est plus simple, sinon utilisez countryData.currency
                    // Réinitialiser la méthode si elle n'est pas disponible dans le nouveau pays
                    setMethod(
                      (countryData?.providers[0]
                        ?.id as WithdrawRequest["method"]) || "orange"
                    ); // Choisir le premier fournisseur disponible
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  {PAWAPAY_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name} ({getCurrencyByCountry(country.code)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-600">
                  {t("WithdrawDialog.2.withdrawalAmount")}
                </span>
                <span className="text-lg font-semibold">
                  {Number.parseFloat(amount)}
                  {currency}
                </span>
              </div>

              {/* <RadioGroup
                value={method}
                onValueChange={(value: WithdrawRequest["method"]) =>
                  setMethod(value)
                }
              >
                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="orange" id="orange" />
                  <Label
                    htmlFor="orange"
                    className="flex-1 flex items-center cursor-pointer"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    <div>
                      <div>Orange Money</div>
                      <div className="text-xs text-gray-500">5 Minutes</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="mtn" id="mtn" />
                  <Label
                    htmlFor="mtn"
                    className="flex-1 flex items-center cursor-pointer"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    <div>
                      <div>MTN MOMO</div>
                      <div className="text-xs text-gray-500">5 Minutes</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup> */}
              <RadioGroup
                value={method}
                onValueChange={(value: WithdrawRequest["method"]) =>
                  setMethod(value)
                }
              >
                {getProvidersByCountry(selectedCountry).map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center space-x-2 border rounded-md p-3"
                  >
                    <RadioGroupItem value={provider.id} id={provider.id} />
                    <Label
                      htmlFor={provider.id}
                      className="flex-1 flex items-center cursor-pointer"
                    >
                      <Phone className="h-4 w-4 mr-2" />{" "}
                      {/* Utilisez l'icône générique ou un mappage plus avancé */}
                      <div>
                        <div>{provider.name}</div>
                        <div className="text-xs text-gray-500">
                          {/* 5 Minutes */}
                        </div>
                        {/* Estimation */}
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
                    {Number.parseFloat(amount)}
                    {currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee</span>
                  <span className="text-gray-600">
                    -{withdrawalFee}
                    {currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.3.youReceive")}
                  </span>
                  <span className="font-bold">
                    {netAmount}
                    {currency}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.3.method")}
                  </span>
                  <span className="font-medium capitalize">{method}</span>
                </div>
                {/* <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.3.estimatedArrival")}
                  </span>
                  <span>{estimatedDays}</span>
                </div> */}
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.3.phone")}
                  </span>
                  <span>{accountDetails}</span>
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
                    Processing...
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
                Withdrawal Successful
              </DialogTitle>
              <DialogDescription className="text-center">
                Your withdrawal has been processed successfully
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>

              <div>
                <p className="text-xl font-semibold">
                  {netAmount}
                  {currency}
                </p>
                <p className="text-sm text-gray-500">
                  {/* {will be sent to your {method} account} */}
                  {t("WithdrawDialog.4.willBeSent")}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.4.withdrawalID")}
                  </span>
                  <span className="font-mono">{withdrawalId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.3.estimatedArrival")}
                  </span>
                  <span>{estimatedDays}</span>
                </div>
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
