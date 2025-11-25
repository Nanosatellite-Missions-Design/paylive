"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  CreditCard,
  Building2,
  Smartphone,
  Plus,
  Check,
  Lock,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "@/lib/useTranslations";
//
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CountryProvider,
  getCountryByCode,
  PAWAPAY_COUNTRIES,
  getAllCountries,
} from "@/lib/countries";
import { addToSubCollection } from "@/functions/add-to-a-sub-collection";
import { updateDocument } from "@/functions/update-doc-in-collection";
import { getCurrencyByCountry } from "@/lib/currencies";

// Importez les fonctions de conversion depuis votre autre projet
import {
  getCurrencyForCountry,
  convertXAFToCurrency,
  formatCurrencyWithSymbol,
  formatLocalDisplay,
} from "@/lib/allocate";

interface PaymentMethod {
  id: string;
  type: "card" | "bank" | "digital";
  name: string;
  details: string;
  isDefault: boolean;
  lastUsed?: string;
  icon: React.ReactNode;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  product: string;
  onPaymentComplete?: (paymentMethodId: string) => void;
  paymentState: string;
  handleCancel?: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  amount,
  product,
  onPaymentComplete,
  paymentState,
  handleCancel,
}: PaymentDialogProps) {
  const { userInfo } = useAuth();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    userInfo?.paymentMethods.find((method: any) => method.isDefault)?.number ||
      userInfo?.paymentMethods[0]?.number
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // États pour le formulaire Mobile Money
  const [paymentMethod, setPaymentMethod] = useState<"pawapay" | "paypal">(
    "pawapay"
  );
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

  const currentCountry = PAWAPAY_COUNTRIES.find(
    (c) => c.code === selectedCountry
  );
  const availableProviders = currentCountry?.providers || [];

  const t = useTranslations("LivePage");

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

  const handleAddPaymentMethod = () => {
    onOpenChange(false);
    router.push("/dashboard/settings/payment-methods");
  };

  // Effet pour synchroniser la devise quand le pays change
  useEffect(() => {
    if (selectedCountry) {
      const newCurrency = getCurrencyForCountry(selectedCountry);
      setCurrency(newCurrency);
    }
  }, [selectedCountry]);

  const handlePayment = async () => {
    // 1. Validation de base
    if (!selectedCountry || !mobileProvider || !phoneNumber) {
      alert("Veuillez remplir tous les champs requis");
      return;
    }

    const amountNumber = getSafeAmount();
    if (amountNumber === 0) {
      alert("Montant invalide");
      return;
    }

    // 2. ✅ CORRECTION CRITIQUE : Nettoyage COMPLET du numéro
    let cleanPhoneNumber = phoneNumber.replace(/[^\d]/g, ""); // Supprime TOUT sauf les chiffres

    // 3. Supprimer le préfixe '0' si présent (ex: "0682374552" → "682374552")
    if (cleanPhoneNumber.startsWith("0")) {
      cleanPhoneNumber = cleanPhoneNumber.substring(1);
    }

    // 4. Ajouter l'indicatif pays SANS le '+'
    const country = PAWAPAY_COUNTRIES.find((c) => c.code === selectedCountry);
    if (!country) {
      alert("Pays non supporté");
      return;
    }

    const countryCodeDigits = country.dialCode.replace("+", "");
    const finalPhoneNumber = countryCodeDigits + cleanPhoneNumber;

    // 5. ✅ CORRECTION : Utiliser le montant converti dans la devise locale
    const localAmount = getLocalAmount(selectedCountry);
    const targetCurrency = getCurrencyForCountry(selectedCountry);

    // Préparer les données de la transaction
    const paymentData = {
      amount: localAmount.toString(), // ✅ Montant dans la devise locale
      countryCode: selectedCountry,
      mobileProviderId: mobileProvider,
      phoneNumber: finalPhoneNumber,
      currency: targetCurrency, // ✅ Devise locale
      originalAmountXAF: amountNumber.toString(), // Garder une trace du montant original
    };

    try {
      // 6. Appeler votre API Backend
      setIsProcessing(true);

      // ✅ CORRECTION : Notifier le parent que le paiement est en cours
      if (onPaymentComplete) {
        onPaymentComplete("pending");
      }

      console.log("🔹 REQUÊTE PAWAPAY - DEVISE LOCALE:", {
        country: selectedCountry,
        currency: targetCurrency,
        amountLocal: localAmount,
        amountXAF: amountNumber,
        paymentData,
      });

      const response = await fetch("/api/pawapay/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Erreur API:", result);
        // ✅ CORRECTION : Notifier le parent de l'échec
        if (onPaymentComplete) {
          onPaymentComplete("failed");
        }
        alert(`Erreur de paiement: ${result.error || "Erreur inconnue"}`);
        return;
      }

      // 7. ✅ SUCCÈS - Mettre à jour Firebase et notifier le parent
      console.log("✅ Réponse API réussie:", result);

      if (userInfo && userInfo.uid) {
        try {
          // Créer l'objet transaction avec les informations de devise
          const transactionRecord = {
            amount: amountNumber, // Montant original en XAF
            currency: "XAF", // Toujours stocker en XAF pour référence
            localAmount: localAmount, // Montant dans la devise locale
            localCurrency: targetCurrency, // Devise utilisée pour le paiement
            depositId: result.depositId, // ID de la transaction Pawapay
            status: result.status || "ACCEPTED",
            phoneNumber: finalPhoneNumber,
            provider: mobileProvider,
            country: selectedCountry,
            product: product, // Le produit acheté
            user: {
              uid: userInfo.uid,
              name: userInfo.name || "Unknown",
              phone: userInfo.phone || "Unknown",
            },
            timestamp: new Date().toISOString(),
            type: "deposit", // Type de transaction
          };

          console.log(
            "📝 Enregistrement transaction Firebase:",
            transactionRecord
          );

          // ✅ CORRECTION : Attendre que Firebase soit mis à jour avant de notifier le parent
          await addToSubCollection(
            transactionRecord,
            "users",
            userInfo.uid,
            "transactions"
          );
          console.log("✅ Transaction enregistrée dans Firebase");

          await updateDocument("users", userInfo.uid, {
            lastTransaction: new Date().toISOString(),
            // Vous pouvez aussi mettre à jour le solde ici si nécessaire
          });

          // ✅ CORRECTION CRITIQUE : Notifier le parent du succès APRÈS la mise à jour Firebase
          if (onPaymentComplete) {
            onPaymentComplete(result.depositId);
          }
        } catch (firebaseError) {
          console.error("❌ Erreur Firebase:", firebaseError);
          // Notifier le parent de l'échec en cas d'erreur Firebase
          if (onPaymentComplete) {
            onPaymentComplete("failed");
          }
        }
      } else {
        // Si pas d'userInfo, notifier quand même le succès
        if (onPaymentComplete) {
          onPaymentComplete(result.depositId);
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors du paiement:", error);
      // ✅ CORRECTION : Notifier le parent de l'échec
      if (onPaymentComplete) {
        onPaymentComplete("failed");
      }
      alert("Erreur lors de la communication avec le service de paiement");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCountryChange = (newCountryCode: string) => {
    // Mettre à jour le pays
    setSelectedCountry(newCountryCode);

    // Réinitialiser le fournisseur car il peut ne pas exister dans le nouveau pays
    setMobileProvider(undefined);

    setPhoneNumber("");
  };

  // Formater le numéro de téléphone pour l'affichage
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

  // ✅ CORRECTION : Utiliser directement paymentState du parent sans état local

  // Pending State
  if (paymentState === "pending") {
    return (
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
              Processing Payment
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <Clock className="h-16 w-16 text-blue-600 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                Waiting for you to complete the payment
              </h3>
              <p className="text-sm text-muted-foreground">
                Please complete the payment process in your payment provider's
                window
              </p>
              <p className="text-lg font-bold text-blue-600">
                {selectedCountry
                  ? getLocalAmountDisplay(selectedCountry)
                  : amount}
              </p>
              {selectedCountry &&
                getCurrencyForCountry(selectedCountry) !== "XAF" && (
                  <p className="text-sm text-gray-500">
                    Reference: {amount} XAF
                  </p>
                )}
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full animate-pulse"
                style={{ width: "60%" }}
              ></div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} className="w-full">
              Cancel Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Success State
  if (paymentState === "success") {
    return (
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Payment Completed
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-75"></div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-green-800">
                Payment Successful!
              </h3>
              <p className="text-sm text-muted-foreground">
                Your payment has been processed successfully
              </p>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Amount Paid:</strong>{" "}
                  {selectedCountry
                    ? getLocalAmountDisplay(selectedCountry)
                    : amount}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Product:</strong> {product}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Payment Method:</strong> Mobile Money
                </p>
                {selectedCountry &&
                  getCurrencyForCountry(selectedCountry) !== "XAF" && (
                    <p className="text-sm text-green-700">
                      <strong>Reference:</strong> {amount} XAF
                    </p>
                  )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCancel}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Failed State
  if (paymentState === "failed") {
    return (
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <XCircle className="h-6 w-6 text-red-600" />
              Payment Failed
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <XCircle className="h-16 w-16 text-red-600" />
              <div className="absolute inset-0 rounded-full bg-red-100 animate-pulse opacity-75"></div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-red-800">
                Payment Not Completed
              </h3>
              <p className="text-sm text-muted-foreground">
                We couldn't process your payment
              </p>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> Payment was declined by your payment
                  provider
                </p>
                <p className="text-sm text-red-700">
                  Please check your payment method or try a different one
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
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Réinitialiser le formulaire pour réessayer
                setSelectedCountry(undefined);
                setMobileProvider(undefined);
                setPhoneNumber("");
                if (onPaymentComplete) {
                  onPaymentComplete("idle");
                }
              }}
              className="w-full sm:w-auto"
            >
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Default State - Formulaire de paiement
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-600" />
            {t("BuyDialog.securePayment")}
          </DialogTitle>
          <DialogDescription>
            {t("BuyDialog.description")} {product}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{product}</p>
                  <p className="text-sm text-muted-foreground">
                    Payment due immediately
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {selectedCountry && amount
                      ? getLocalAmountDisplay(selectedCountry)
                      : amount || "0"}
                  </p>
                  {selectedCountry &&
                    getCurrencyForCountry(selectedCountry) !== "XAF" &&
                    amount && (
                      <p className="text-sm text-gray-500 mt-1">{amount} XAF</p>
                    )}
                  <Badge variant="secondary" className="text-xs">
                    {t("BuyDialog.secure")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Payment Methods */}
          <div className="space-y-4">
            <div className="flex items-center ml-10 ">
              <Tabs
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as "pawapay")}
              >
                {/* Le contenu du paiement Mobile Money */}
                <TabsContent value="pawapay" className="space-y-4 mt-4">
                  {/* Localisation détectée */}
                  {userLocation && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <MapPin className="h-4 w-4" />
                      <span>Detected location: {userLocation.country}</span>
                    </div>
                  )}

                  {/* 1. Country Selection */}
                  <div className="space-y-2 w-full">
                    <Label>Country *</Label>
                    <Select
                      value={selectedCountry}
                      onValueChange={handleCountryChange}
                      disabled={isProcessing}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAWAPAY_COUNTRIES.map((country: CountryProvider) => {
                          // Gestion sécurisée du montant pour l'affichage
                          const amountNumber = getSafeAmount();
                          const displayAmount =
                            amountNumber > 0
                              ? formatLocalDisplay(amountNumber, country.code)
                              : "";

                          return (
                            <SelectItem key={country.code} value={country.code}>
                              <div className="flex items-center gap-2">
                                <img
                                  src={country.flag}
                                  alt={`${country.name} flag`}
                                  className="w-6 h-4 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {country.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {country.dialCode} •{" "}
                                    {getCurrencyForCountry(country.code)}
                                    {getCurrencyForCountry(country.code) !==
                                      "XAF" &&
                                      displayAmount && (
                                        <span> • ≈ {displayAmount}</span>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Les sections suivantes s'affichent uniquement si un pays est sélectionné */}
                  {selectedCountry && (
                    <>
                      {/* 2. Mobile Provider RadioGroup */}
                      <div className="space-y-2">
                        <Label>Mobile Provider *</Label>
                        <RadioGroup
                          value={mobileProvider}
                          onValueChange={setMobileProvider}
                          disabled={isProcessing}
                        >
                          {availableProviders.map((provider) => (
                            <div
                              key={provider.id}
                              className="flex items-center space-x-2 p-3 border rounded-lg"
                            >
                              <RadioGroupItem
                                value={provider.id}
                                id={provider.id}
                                disabled={isProcessing}
                              />
                              <Label
                                htmlFor={provider.id}
                                className="flex-1 cursor-pointer font-normal"
                              >
                                {provider.name}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* 3. Phone Number Input */}
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
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
                          You will receive a prompt on your phone to confirm the
                          payment
                        </p>
                      </div>

                      {/* 4. Payment Button */}
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={handlePayment}
                        disabled={
                          isProcessing ||
                          !selectedCountry ||
                          !mobileProvider ||
                          phoneNumber.length < 5 ||
                          !amount
                        }
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            Processing Payment...
                          </div>
                        ) : (
                          `Pay ${
                            selectedCountry && amount
                              ? getLocalAmountDisplay(selectedCountry)
                              : amount || "0"
                          } with Mobile Money`
                        )}
                      </Button>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Ancien code pour les méthodes de paiement existantes */}
            <RadioGroup
              value={selectedPaymentMethod}
              onValueChange={setSelectedPaymentMethod}
              className="space-y-3"
            >
              {userInfo?.paymentMethods.map((method: any) => (
                <div key={method.number} className="relative">
                  <Label
                    htmlFor={method.number}
                    className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <RadioGroupItem value={method.number} id={method.number} />

                    <div className="flex items-center gap-3 flex-1">
                      <Smartphone className="h-5 w-5 text-purple-600" />

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{method.network}</p>
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {method.number}
                        </p>
                        {method.lastUsed && (
                          <p className="text-xs text-muted-foreground">
                            Last used {method.lastUsed}
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedPaymentMethod === method.number && (
                      <Check className="h-5 w-5 text-green-600" />
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">
                {t("BuyDialog.securePayment")}
              </p>
              <p className="text-blue-700">
                {t("BuyDialog.footerDescription")}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          {/* Les boutons du footer peuvent être réactivés si nécessaire */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
