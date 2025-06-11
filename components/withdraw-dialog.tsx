"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  ArrowRight,
  BanknoteIcon,
  Check,
  CreditCard,
  DollarSign,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { WithdrawRequest } from "@/types/financial"

interface WithdrawDialogProps {
  currentBalance: number
  pendingWithdrawals?: number
  onWithdraw: (request: WithdrawRequest) => Promise<void>
  children?: React.ReactNode
}

export default function WithdrawDialog({
  currentBalance,
  pendingWithdrawals = 0,
  onWithdraw,
  children,
}: WithdrawDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"amount" | "method" | "confirm" | "success">("amount")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<WithdrawRequest["method"]>("bank")
  const [accountDetails, setAccountDetails] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [routingNumber, setRoutingNumber] = useState("")
  const [paypalEmail, setPaypalEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null)

  // Constants
  const minWithdraw = 20
  const maxWithdraw = currentBalance
  const withdrawalFee = method === "bank" ? 3.5 : method === "paypal" ? 2.5 : 2.0
  const netAmount = Math.max(0, Number.parseFloat(amount || "0") - withdrawalFee)
  const estimatedDays = method === "bank" ? "2-3 business days" : method === "paypal" ? "1-2 business days" : "24 hours"

  const resetForm = () => {
    setAmount("")
    setMethod("bank")
    setAccountDetails("")
    setBankName("")
    setAccountNumber("")
    setRoutingNumber("")
    setPaypalEmail("")
    setError(null)
    setStep("amount")
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset form when dialog closes
      setTimeout(resetForm, 300) // Delay to allow dialog animation to complete
    }
  }

  const handleAmountSubmit = () => {
    const withdrawAmount = Number.parseFloat(amount)
    if (withdrawAmount < minWithdraw || withdrawAmount > maxWithdraw) {
      setError(`Amount must be between XAF${minWithdraw} and XAF${maxWithdraw}`)
      return
    }

    setError(null)
    setStep("method")
  }

  const handleMethodSubmit = () => {
    let isValid = true

    if (method === "bank") {
      if (!bankName.trim() || !accountNumber.trim() || !routingNumber.trim()) {
        setError("Please fill in all bank details")
        isValid = false
      }
    } else if (method === "paypal") {
      if (!paypalEmail.trim() || !paypalEmail.includes("@")) {
        setError("Please enter a valid PayPal email")
        isValid = false
      }
    } else if (!accountDetails.trim()) {
      setError("Please enter your account details")
      isValid = false
    }

    if (isValid) {
      setError(null)
      setStep("confirm")
    }
  }

  const handleConfirmWithdrawal = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const withdrawAmount = Number.parseFloat(amount)
      let details = ""

      if (method === "bank") {
        details = `Bank: ${bankName}, Account: XAF{accountNumber}, Routing: XAF{routingNumber}`
      } else if (method === "paypal") {
        details = paypalEmail
      } else {
        details = accountDetails
      }

      await onWithdraw({
        amount: withdrawAmount,
        method,
        accountDetails: details,
      })

      // Generate a fake withdrawal ID
      setWithdrawalId(`WD-${Math.floor(Math.random() * 1000000)}-${Date.now().toString().slice(-4)}`)
      setStep("success")
    } catch (error) {
      console.error("Withdrawal failed:", error)
      setError("Withdrawal failed. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccessClose = () => {
    setOpen(false)
    resetForm()
  }

  const getMethodDetails = () => {
    switch (method) {
      case "bank":
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input
                id="bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Enter your bank name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter your account number"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routing-number">Routing Number</Label>
              <Input
                id="routing-number"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                placeholder="Enter your routing number"
                required
              />
            </div>
          </div>
        )
      case "paypal":
        return (
          <div className="space-y-2">
            <Label htmlFor="paypal-email">PayPal Email</Label>
            <Input
              id="paypal-email"
              type="email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              placeholder="Enter your PayPal email"
              required
            />
          </div>
        )
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor="account-details">Account Details</Label>
            <Input
              id="account-details"
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              placeholder="Enter your account details"
              required
            />
          </div>
        )
    }
  }

  const getDialogContent = () => {
    switch (step) {
      case "amount":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Withdraw Funds</span>
                {pendingWithdrawals > 0 && (
                  <Badge variant="outline" className="font-normal">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {pendingWithdrawals} Pending
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>Withdraw your available balance to your preferred payment method</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-600">Available Balance</span>
                <span className="text-lg font-semibold">XAF{currentBalance.toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Withdrawal Amount</Label>
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
                  <span>Max: XAF{maxWithdraw.toFixed(2)}</span>
                </div>
              </div>

              {Number.parseFloat(amount || "0") > 0 && (
                <div className="p-3 border rounded-md space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Withdrawal Amount</span>
                    <span>XAF{Number.parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Processing Fee</span>
                    <span>-XAF{withdrawalFee.toFixed(2)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-medium">
                    <span>You'll Receive</span>
                    <span>XAF{netAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={handleAmountSubmit}
                disabled={!amount || Number.parseFloat(amount) < minWithdraw || Number.parseFloat(amount) > maxWithdraw}
                className="w-full"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )

      case "method":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Select Payment Method</DialogTitle>
              <DialogDescription>Choose how you'd like to receive your withdrawal</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-600">Withdrawal Amount</span>
                <span className="text-lg font-semibold">XAF{Number.parseFloat(amount).toFixed(2)}</span>
              </div>

              <RadioGroup value={method} onValueChange={(value: WithdrawRequest["method"]) => setMethod(value)}>
                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="bank" id="bank" />
                  <Label htmlFor="bank" className="flex-1 flex items-center cursor-pointer">
                    <BanknoteIcon className="h-4 w-4 mr-2" />
                    <div>
                      <div>Bank Transfer</div>
                      <div className="text-xs text-gray-500">2-3 business days • XAF3.50 fee</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal" className="flex-1 flex items-center cursor-pointer">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <div>
                      <div>PayPal</div>
                      <div className="text-xs text-gray-500">1-2 business days • XAF2.50 fee</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="stripe" id="stripe" />
                  <Label htmlFor="stripe" className="flex-1 flex items-center cursor-pointer">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <div>
                      <div>Stripe</div>
                      <div className="text-xs text-gray-500">24 hours • XAF2.00 fee</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              <div className="pt-2">{getMethodDetails()}</div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("amount")}>
                Back
              </Button>
              <Button onClick={handleMethodSubmit}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )

      case "confirm":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Withdrawal</DialogTitle>
              <DialogDescription>Please review your withdrawal details before confirming</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-3 p-4 border rounded-md">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-medium">XAF{Number.parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee</span>
                  <span className="text-gray-600">-XAF{withdrawalFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">You'll Receive</span>
                  <span className="font-bold">XAF{netAmount.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium capitalize">{method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Arrival</span>
                  <span>{estimatedDays}</span>
                </div>
                {method === "bank" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank</span>
                      <span>{bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account</span>
                      <span>****{accountNumber.slice(-4)}</span>
                    </div>
                  </>
                )}
                {method === "paypal" && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">PayPal Email</span>
                    <span>{paypalEmail}</span>
                  </div>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  By confirming this withdrawal, you agree to our terms and conditions. This transaction cannot be
                  reversed once processed.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("method")}>
                Back
              </Button>
              <Button onClick={handleConfirmWithdrawal} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Confirm Withdrawal</>
                )}
              </Button>
            </DialogFooter>
          </>
        )

      case "success":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">Withdrawal Successful</DialogTitle>
              <DialogDescription className="text-center">
                Your withdrawal has been processed successfully
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>

              <div>
                <p className="text-xl font-semibold">XAF{netAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-500">will be sent to your {method} account</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Withdrawal ID</span>
                  <span className="font-mono">{withdrawalId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated Arrival</span>
                  <span>{estimatedDays}</span>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                You'll receive an email confirmation shortly. You can track the status of your withdrawal in the
                transaction history.
              </p>
            </div>

            <DialogFooter>
              <Button className="w-full" onClick={handleSuccessClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="w-full" onClick={() => setOpen(true)}>
            <Wallet className="mr-2 h-4 w-4" />
            Withdraw Funds
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">{getDialogContent()}</DialogContent>
    </Dialog>
  )
}
