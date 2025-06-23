"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Building2, Smartphone, Plus, Check, Lock, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface PaymentMethod {
  id: string
  type: "card" | "bank" | "digital"
  name: string
  details: string
  isDefault: boolean
  lastUsed?: string
  icon: React.ReactNode
}

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: string
  product: string
  onPaymentComplete?: (paymentMethodId: string) => void
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
]

export function PaymentDialog({ open, onOpenChange, amount, product, onPaymentComplete }: PaymentDialogProps) {
  const { userInfo } = useAuth()
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    userInfo?.paymentMethods.find((method: any) => method.isDefault)?.number || userInfo?.paymentMethods[0]?.number,
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleAddPaymentMethod = () => {
    onOpenChange(false)
    router.push("/dashboard/settings/payment-methods")
  }

  const handlePayment = async () => {
    if (!selectedPaymentMethod) return

    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsProcessing(false)
    onPaymentComplete?.(selectedPaymentMethod)
    onOpenChange(false)
  }

//   const formatAmount = (amount: number) => {
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: "USD",
//     }).format(amount)
//   }

//   const getPaymentMethodIcon = (type: string) => {
//     switch (type) {
//       case "card":
//         return <CreditCard className="h-5 w-5 text-blue-600" />
//       case "bank":
//         return <Building2 className="h-5 w-5 text-green-600" />
//       case "digital":
//         return <Smartphone className="h-5 w-5 text-purple-600" />
//       default:
//         return <CreditCard className="h-5 w-5" />
//     }
//   }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-600" />
            Secure Payment
          </DialogTitle>
          <DialogDescription>Complete your payment for {product}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{product}</p>
                  <p className="text-sm text-muted-foreground">Payment due immediately</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{amount}</p>
                  <Badge variant="secondary" className="text-xs">
                    Secure
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Payment Methods */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Payment Methods</h3>
              <Button variant="outline" size="sm" onClick={handleAddPaymentMethod} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New
              </Button>
            </div>

            <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} className="space-y-3">
              {userInfo?.paymentMethods.map((method: any) => (
                <div key={method.number} className="relative">
                  <Label
                    htmlFor={method.number}
                    className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <RadioGroupItem value={method.number} id={method.number} />

                    <div className="flex items-center gap-3 flex-1">
                      <Smartphone className="h-5 w-5 text-purple-600"/>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{method.network}</p>
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{method.number}</p>
                        {method.lastUsed && (
                          <p className="text-xs text-muted-foreground">Last used {method.lastUsed}</p>
                        )}
                      </div>
                    </div>

                    {selectedPaymentMethod === method.number && <Check className="h-5 w-5 text-green-600" />}
                  </Label>
                </div>
              ))}
                <div key={"other"} className="relative">
                  <Label
                    htmlFor={"other"}
                    className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <RadioGroupItem value={"other"} id={"other"} />

                    <div className="flex items-center gap-3 flex-1">
                      <Smartphone className="h-5 w-5 text-purple-600"/>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">Other</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Use another number to pay</p>
                      </div>
                    </div>

                    {selectedPaymentMethod === "other" && <Check className="h-5 w-5 text-green-600" />}
                  </Label>
                </div>
            </RadioGroup>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Secure Payment</p>
              <p className="text-blue-700">
                Your payment information is encrypted and secure. We never store your full payment details.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancel
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
              `Pay ${amount}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
