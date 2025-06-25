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
import { CreditCard, Building2, Smartphone, Plus, Check, Lock, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "./ui/input"
import Image from "next/image"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: string
  product: string
  onPaymentComplete?: (paymentMethodId: string, number: string, name: string) => void
  paymentState: string
  handleCancel?: () => void
}

export function PaymentDialog({ open, onOpenChange, amount, product, onPaymentComplete, paymentState, handleCancel }: PaymentDialogProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")

  const handlePayment = async () => {
    if (!selectedPaymentMethod) return

    setIsProcessing(true)
    onPaymentComplete?.(selectedPaymentMethod, phone, name)
    setIsProcessing(false)

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
              <h3 className="text-lg font-semibold">Waiting for you to complete the payment</h3>
              <p className="text-sm text-muted-foreground">
                Please complete the payment process in your payment provider's window
              </p>
              <p className="text-lg font-bold text-blue-600">{amount}</p>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} className="w-full">
              Cancel Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
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
              <h3 className="text-lg font-semibold text-green-800">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground">
                Your payment of {amount} has been processed successfully
              </p>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Transaction ID:</strong> TXN-{Date.now().toString().slice(-8)}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Payment Method:</strong>{" "}
                  {/* {mockPaymentMethods.find((m) => m.id === selectedPaymentMethod)?.name} */}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCancel} className="w-full bg-green-600 hover:bg-green-700">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
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
              <h3 className="text-lg font-semibold text-red-800">Payment Not Completed</h3>
              <p className="text-sm text-muted-foreground">
                We couldn't process your payment of {amount}
              </p>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> Payment was declined by your payment provider
                </p>
                <p className="text-sm text-red-700">Please check your payment method or try a different one</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button className="w-full sm:w-auto">
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

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

          <RadioGroup
            defaultValue={selectedPaymentMethod}
            onValueChange={setSelectedPaymentMethod}
            className="flex items-center gap-4"
          >
            {/* Orange Money Option */}
            <div className="flex items-center space-x-2 border rounded-xl p-2 hover:shadow-md cursor-pointer">
              <RadioGroupItem value="Orange" id="Orange" />
              <Label htmlFor="Orange" className="flex items-center gap-2">
                <Image
                  src="/orange.jpeg" // Replace with your image path
                  alt="Orange"
                  width={40}
                  height={40}
                />
                Orange Money
              </Label>
            </div>

            {/* MTN Money Option */}
            <div className="flex items-center space-x-2 border rounded-xl p-2 hover:shadow-md cursor-pointer">
              <RadioGroupItem value="MTN" id="MTN" />
              <Label htmlFor="MTN" className="flex items-center gap-2">
                <Image
                  src="/mtn.jpg" // Replace with your image path
                  alt="MTN"
                  width={40}
                  height={40}
                />
                MTN Money
              </Label>
            </div>
          </RadioGroup>

          {/* Payment Methods */}
          {selectedPaymentMethod && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Payment Methods</h3>
              </div>
              <div>
                <Label>Name</Label>
                <Input type="text" placeholder="Nuadje Todjo" onChange={(e) => setName(e.target.value)}/>
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input type="text" placeholder="670166661" onChange={(e) => setPhone(e.target.value)}/>
              </div>
            </div>
          )
          }

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
