"use client";

import type React from "react";

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

interface WithdrawDialogProps {
  currentBalance: number;
  pendingWithdrawals?: number;
  onWithdraw: (request: WithdrawRequest) => Promise<void>;
  children?: React.ReactNode;
}

export default function WithdrawDialog({
  currentBalance,
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
  const { user } = useAuth();
  const t = useTranslations("Dashboard.Transactions");
  // Constants
  const minWithdraw = 1;
  const maxWithdraw = currentBalance;
  const withdrawalFee = 0.1 * Number(amount) ?? 0;
  const netAmount = Math.max(
    0,
    Number.parseFloat(amount || "0") - 0.1 * Number(amount)
  );
  const estimatedDays = "24 hours";

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

    setError(null);
    setStep("method");
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
    if (!user) return;

    const body = JSON.stringify({
      amount: Math.floor(netAmount),
      phoneNumber: accountDetails,
      provider: method,
      customerId: user.uid,
    });

    try {
      const res = await fetch("/api/pawapay/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      const data = await res.json();
      console.log(data);
      if (!res.ok) throw new Error(data.error || "Unknown error");

      const newTransaction = {
        amount: netAmount,
        fees: Number(amount) - netAmount,
        paymentMethod: method,
        status: "completed",
        type: "withdrawal",
        phoneNumber: accountDetails,
      };

      await addToSubCollection(
        newTransaction,
        "users",
        user.uid,
        "transactions"
      );

      await updateDocument("users", user.uid, {
        balance: increment(-Number(amount)),
      });

      setStep("success");
    } catch (error) {
      console.error("Withdrawal failed:", error);
      setError(t("WithdrawDialog.Error.description"));
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
                  XAF{currentBalance}
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
                  <span>Min: XAF{minWithdraw}</span>
                  <span>Max: XAF{maxWithdraw}</span>
                </div>
              </div>

              {Number.parseFloat(amount || "0") > 0 && (
                <div className="p-3 border rounded-md space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("WithdrawDialog.1.withdrawalAmount")}</span>
                    <span>XAF{Number.parseFloat(amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{t("WithdrawDialog.1.processingFee")}</span>
                    <span>-XAF{withdrawalFee}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-medium">
                    <span>{t("WithdrawDialog.1.youReceive")}</span>
                    <span>XAF{netAmount}</span>
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
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-600">
                  {t("WithdrawDialog.2.withdrawalAmount")}
                </span>
                <span className="text-lg font-semibold">
                  XAF{Number.parseFloat(amount)}
                </span>
              </div>

              <RadioGroup
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
                    XAF{Number.parseFloat(amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee</span>
                  <span className="text-gray-600">-XAF{withdrawalFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.3.youReceive")}
                  </span>
                  <span className="font-bold">XAF{netAmount}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.3.method")}
                  </span>
                  <span className="font-medium capitalize">{method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("WithdrawDialog.3.estimatedArrival")}
                  </span>
                  <span>{estimatedDays}</span>
                </div>
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
                <p className="text-xl font-semibold">XAF{netAmount}</p>
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
