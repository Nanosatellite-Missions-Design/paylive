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

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "card-1",
    type: "card",
    name: "Visa ending in 4242",
    details: "Expires 12/25",
    isDefault: true,
    lastUsed: "2 days ago",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: "card-2",
    type: "card",
    name: "Mastercard ending in 8888",
    details: "Expires 08/26",
    isDefault: false,
    lastUsed: "1 week ago",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: "bank-1",
    type: "bank",
    name: "Chase Business Account",
    details: "****1234",
    isDefault: false,
    lastUsed: "3 weeks ago",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: "digital-1",
    type: "digital",
    name: "PayPal",
    details: "john@lawfirm.com",
    isDefault: false,
    icon: <Smartphone className="h-5 w-5" />,
  },
];

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

  // SUPPRESSION des états problématiques qui créent des conflits
  // const [transactionSuccess, setTransactionSuccess] = useState(false);
  // const [transactionId, setTransactionId] = useState("");
  // const [currentPaymentState, setCurrentPaymentState] = useState(paymentState);

  // Pour déterminer les fournisseurs disponibles
  const currentCountry = PAWAPAY_COUNTRIES.find(
    (c) => c.code === selectedCountry
  );
  const availableProviders = currentCountry?.providers || [];

  const t = useTranslations("LivePage");

  const handleAddPaymentMethod = () => {
    onOpenChange(false);
    router.push("/dashboard/settings/payment-methods");
  };

  // Effet pour synchroniser la devise quand le pays change
  useEffect(() => {
    if (selectedCountry) {
      const newCurrency = getCurrencyByCountry(selectedCountry);
      setCurrency(newCurrency);
    }
  }, [selectedCountry]);

  const handlePayment = async () => {
    // 1. Validation de base
    if (!selectedCountry || !mobileProvider || !phoneNumber) {
      alert("Veuillez remplir tous les champs requis");
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

    // 5. Préparer les données de la transaction
    const paymentData = {
      amount: amount,
      countryCode: selectedCountry,
      mobileProviderId: mobileProvider,
      phoneNumber: finalPhoneNumber,
      currency: currency,
    };

    try {
      // 6. Appeler votre API Backend
      setIsProcessing(true);

      // ✅ CORRECTION : Notifier le parent que le paiement est en cours
      if (onPaymentComplete) {
        onPaymentComplete("pending");
      }

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
          // Créer l'objet transaction
          const transactionRecord = {
            amount: parseInt(paymentData.amount),
            currency: paymentData.currency,
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
              <p className="text-lg font-bold text-blue-600">{amount}</p>
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
                Your payment of {amount} has been processed successfully
              </p>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Product:</strong> {product}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Payment Method:</strong> Mobile Money
                </p>
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
                We couldn't process your payment of {amount}
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
                  <p className="text-2xl font-bold">{amount}</p>
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
              {/* <h3 className="text-lg font-semibold">Payment Methods</h3> */}
              {/* <Button
                variant="outline"
                size="sm"
                onClick={handleAddPaymentMethod}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New
              </Button> */}
              <Tabs
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as "pawapay")}
              >
                {/* Le contenu du paiement Mobile Money */}
                <TabsContent value="pawapay" className="space-y-4 mt-4">
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
                        {/* CORRECTION 2: Afficher la liste des PAWAPAY_COUNTRIES */}
                        {PAWAPAY_COUNTRIES.map((country: CountryProvider) => (
                          <SelectItem key={country.code} value={country.code}>
                            <div className="flex items-center gap-2">
                              {/* Assurez-vous que l'image du drapeau est disponible si vous l'utilisez */}
                              {/* <img src={country.flag} alt={`${country.name} flag`} className="w-6 h-4 object-cover rounded" /> */}
                              <span className="flex-1">
                                {country.dialCode} {country.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
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
                          {/* CORRECTION 3: Afficher chaque fournisseur */}
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
                          {/* Afficher le dialCode: currentCountry?.dialCode */}
                          <div className="flex items-center px-3 border rounded-md bg-muted text-muted-foreground min-w-[80px] justify-center">
                            {/* Récupère le dialCode du pays sélectionné */}
                            {currentCountry?.dialCode}
                          </div>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="6XX XXX XXX"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
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
                        // Condition du bouton: Pays, Fournisseur, Numéro, et Termes doivent être validés si vous ajoutez la validation des termes.
                        disabled={
                          isProcessing ||
                          !selectedCountry ||
                          !mobileProvider ||
                          phoneNumber.length < 5
                        }
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            Processing Payment...
                          </div>
                        ) : (
                          `Pay ${amount} with Mobile Money`
                        )}
                      </Button>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>

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
              {/* <div key={"other"} className="relative">
                <Label
                  htmlFor={"other"}
                  className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors"
                >
                  <RadioGroupItem value={"other"} id={"other"} />

                  <div className="flex items-center gap-3 flex-1">
                    <Smartphone className="h-5 w-5 text-purple-600" />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Other</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use another number to pay
                      </p>
                    </div>
                  </div>

                  {selectedPaymentMethod === "other" && (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                </Label>
              </div> */}
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
          {/* <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handlePayment}
            disabled={!selectedPaymentMethod || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Processing...
              </div>
            ) : (
              `${t("BuyDialog.pay")} ${amount}`
            )}
          </Button> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
