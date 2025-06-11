"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Smartphone, Plus, ChevronLeft, Trash2, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: "card",
      name: "Visa ending in 4242",
      details: "Expires 04/25",
      isDefault: true,
    },
    {
      id: 2,
      type: "mobile",
      name: "Mobile Money",
      details: "+1 555-123-4567",
      isDefault: false,
    },
  ])

  const [isAddingMethod, setIsAddingMethod] = useState(false)
  const [newMethodType, setNewMethodType] = useState("card")
  const { toast } = useToast()

  const handleSetDefault = (id: any) => {
    setPaymentMethods(
      paymentMethods.map((method) => ({
        ...method,
        isDefault: method.id === id,
      })),
    )

    toast({
      title: "Default payment method updated",
      description: "Your default payment method has been updated successfully.",
    })
  }

  const handleDelete = (id: any) => {
    setPaymentMethods(paymentMethods.filter((method) => method.id !== id))

    toast({
      title: "Payment method removed",
      description: "Your payment method has been removed successfully.",
    })
  }

  const handleAddMethod = (e: any) => {
    e.preventDefault()

    // In a real app, you would validate and process the form data
    const newMethod = {
      id: paymentMethods.length + 1,
      type: newMethodType,
      name: newMethodType === "card" ? "Mastercard ending in 5678" : "Mobile Money",
      details: newMethodType === "card" ? "Expires 05/26" : "+1 555-987-6543",
      isDefault: false,
    }

    setPaymentMethods([...paymentMethods, newMethod])
    setIsAddingMethod(false)

    toast({
      title: "Payment method added",
      description: "Your new payment method has been added successfully.",
    })
  }

  return (
    <div>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
        <header className="mb-6">
          <div className="flex items-center mb-4">
            <Link href="/profile" className="mr-2">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Payment Methods</h1>
          </div>
          <p className="text-gray-500">Manage your payment methods for purchases and sales</p>
        </header>

        <div className="space-y-4 mb-6">
          {paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    {method.type === "card" ? (
                      <CreditCard className="h-5 w-5 text-primary" />
                    ) : (
                      <Smartphone className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{method.name}</h3>
                    <p className="text-sm text-gray-500">{method.details}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.isDefault ? (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        Default
                      </span>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => handleSetDefault(method.id)} className="text-xs">
                        Set default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(method.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isAddingMethod} onOpenChange={setIsAddingMethod}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMethod} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <RadioGroup
                  defaultValue="card"
                  value={newMethodType}
                  onValueChange={setNewMethodType}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center cursor-pointer">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Credit Card
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mobile" id="mobile" />
                    <Label htmlFor="mobile" className="flex items-center cursor-pointer">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Mobile Money
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {newMethodType === "card" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input id="expiry" placeholder="MM/YY" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input id="cvc" placeholder="123" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name on Card</Label>
                    <Input id="name" placeholder="John Doe" />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input id="phoneNumber" placeholder="+1 555-123-4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select defaultValue="provider1">
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="provider1">Provider 1</SelectItem>
                        <SelectItem value="provider2">Provider 2</SelectItem>
                        <SelectItem value="provider3">Provider 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsAddingMethod(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Method</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
