"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ShoppingCart, Gavel, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import AuthLayout from "@/components/auth-layout"

export default function TransactionsPage() {
  // Mock transactions data
  const transactions = [
    {
      id: 1,
      type: "purchase",
      title: "Wireless Earbuds",
      amount: 89.99,
      date: "Apr 15, 2023",
      status: "completed",
      image: "/placeholder.svg?height=50&width=50",
    },
    {
      id: 2,
      type: "purchase",
      title: "Smart Watch",
      amount: 129.99,
      date: "Mar 22, 2023",
      status: "completed",
      image: "/placeholder.svg?height=50&width=50",
    },
    {
      id: 3,
      type: "auction",
      title: "Vintage Camera",
      amount: 250.0,
      date: "Mar 18, 2023",
      status: "completed",
      image: "/placeholder.svg?height=50&width=50",
    },
    {
      id: 4,
      type: "sale",
      title: "Designer Handbag",
      amount: 199.99,
      date: "Mar 10, 2023",
      status: "completed",
      image: "/placeholder.svg?height=50&width=50",
    },
    {
      id: 5,
      type: "purchase",
      title: "Bluetooth Speaker",
      amount: 79.99,
      date: "Feb 28, 2023",
      status: "failed",
      image: "/placeholder.svg?height=50&width=50",
    },
  ]

  // Group transactions by month
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date)
    const month = date.toLocaleString("default", { month: "long", year: "numeric" })

    if (!groups[month]) {
      groups[month] = []
    }

    groups[month].push(transaction)
    return groups
  }, {})

  const getTransactionIcon = (type) => {
    switch (type) {
      case "purchase":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case "sale":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      case "auction":
        return <Gavel className="h-4 w-4 text-amber-500" />
      default:
        return <ShoppingCart className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
            Failed
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <AuthLayout>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
        <header className="mb-6">
          <div className="flex items-center mb-4">
            <Link href="/profile" className="mr-2">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Transaction History</h1>
          </div>
          <p className="text-gray-500">View your purchase, auction, and sale history</p>
        </header>

        <Tabs defaultValue="all">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex-1">
              Purchases
            </TabsTrigger>
            <TabsTrigger value="auctions" className="flex-1">
              Auctions
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex-1">
              Sales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {Object.entries(groupedTransactions).map(([month, monthTransactions]) => (
              <div key={month} className="mb-6">
                <h2 className="text-lg font-semibold mb-3">{month}</h2>
                <div className="space-y-3">
                  {monthTransactions.map((transaction) => (
                    <Card key={transaction.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden">
                            <img
                              src={transaction.image || "/placeholder.svg"}
                              alt={transaction.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h3 className="font-medium">{transaction.title}</h3>
                              <div className="ml-2">{getTransactionIcon(transaction.type)}</div>
                            </div>
                            <p className="text-sm text-gray-500">{transaction.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${transaction.amount.toFixed(2)}</p>
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="purchases">
            {Object.entries(groupedTransactions).map(([month, monthTransactions]) => {
              const purchases = monthTransactions.filter((t) => t.type === "purchase")
              if (purchases.length === 0) return null

              return (
                <div key={month} className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">{month}</h2>
                  <div className="space-y-3">
                    {purchases.map((transaction) => (
                      <Card key={transaction.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md overflow-hidden">
                              <img
                                src={transaction.image || "/placeholder.svg"}
                                alt={transaction.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{transaction.title}</h3>
                              <p className="text-sm text-gray-500">{transaction.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${transaction.amount.toFixed(2)}</p>
                              {getStatusBadge(transaction.status)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </TabsContent>

          <TabsContent value="auctions">
            {Object.entries(groupedTransactions).map(([month, monthTransactions]) => {
              const auctions = monthTransactions.filter((t) => t.type === "auction")
              if (auctions.length === 0) return null

              return (
                <div key={month} className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">{month}</h2>
                  <div className="space-y-3">
                    {auctions.map((transaction) => (
                      <Card key={transaction.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md overflow-hidden">
                              <img
                                src={transaction.image || "/placeholder.svg"}
                                alt={transaction.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="font-medium">{transaction.title}</h3>
                                <Gavel className="h-4 w-4 ml-2 text-amber-500" />
                              </div>
                              <p className="text-sm text-gray-500">{transaction.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${transaction.amount.toFixed(2)}</p>
                              {getStatusBadge(transaction.status)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </TabsContent>

          <TabsContent value="sales">
            {Object.entries(groupedTransactions).map(([month, monthTransactions]) => {
              const sales = monthTransactions.filter((t) => t.type === "sale")
              if (sales.length === 0) return null

              return (
                <div key={month} className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">{month}</h2>
                  <div className="space-y-3">
                    {sales.map((transaction) => (
                      <Card key={transaction.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md overflow-hidden">
                              <img
                                src={transaction.image || "/placeholder.svg"}
                                alt={transaction.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="font-medium">{transaction.title}</h3>
                                <ArrowDownLeft className="h-4 w-4 ml-2 text-green-500" />
                              </div>
                              <p className="text-sm text-gray-500">{transaction.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${transaction.amount.toFixed(2)}</p>
                              {getStatusBadge(transaction.status)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </TabsContent>
        </Tabs>
      </div>
    </AuthLayout>
  )
}
