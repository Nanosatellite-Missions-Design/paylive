"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ShoppingCart, Gavel, ArrowUpRight, ArrowDownLeft, TrendingUp, Download } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import WithdrawDialog from "@/components/withdraw-dialog"
import type { Transaction, FinancialStats, WithdrawRequest } from "@/types/financial"

export default function TransactionsPage() {
  const user = {
    name: "Jane Cooper",
    email: "jane@example.com",
    phone: "+1 (555) 123-4567",
    bio: "Content creator specializing in fashion and lifestyle products.",
    isCreator: true,
    avatar: "/placeholder.svg?height=100&width=100",
    joinedDate: "March 2023",
    location: "New York, NY",
    website: "https://janecooper.com",
  }

  // Mock financial data
  const financialStats: FinancialStats = {
    currentBalance: 1247.83,
    monthlyEarnings: 892.5,
    totalEarnings: 15420.75,
    pendingPayouts: 156.2,
    totalSales: 89,
    totalPurchases: 23,
  }

  // Mock transactions data with proper typing
  const transactions: Transaction[] = [
    {
      id: "1",
      type: "purchase",
      title: "Wireless Earbuds",
      amount: 89.99,
      date: "Apr 15, 2023",
      status: "completed",
      image: "/placeholder.svg?height=50&width=50",
    },
    {
      id: "2",
      type: "sale",
      title: "Designer Handbag",
      amount: 199.99,
      date: "Apr 12, 2023",
      status: "completed",
      image: "/placeholder.svg?height=50&width=50",
      fees: 15.99,
      netAmount: 184.0,
    },
    {
      id: "3",
      type: "auction",
      title: "Vintage Camera",
      amount: 250.0,
      date: "Mar 18, 2023",
      status: "completed",
      image: "/placeholder.svg?height=50&width=50",
    },
    {
      id: "4",
      type: "withdrawal",
      title: "Bank Transfer",
      amount: 500.0,
      date: "Mar 10, 2023",
      status: "completed",
      description: "Withdrawal to Bank Account ****1234",
    },
    {
      id: "5",
      type: "purchase",
      title: "Bluetooth Speaker",
      amount: 79.99,
      date: "Feb 28, 2023",
      status: "failed",
      image: "/placeholder.svg?height=50&width=50",
    },
  ]

  // Group transactions by month
  const groupedTransactions = transactions.reduce((groups: Record<string, Transaction[]>, transaction) => {
    const date = new Date(transaction.date)
    const month = date.toLocaleString("default", { month: "long", year: "numeric" })

    if (!groups[month]) {
      groups[month] = []
    }

    groups[month].push(transaction)
    return groups
  }, {})

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "purchase":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case "sale":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      case "auction":
        return <Gavel className="h-4 w-4 text-amber-500" />
      case "withdrawal":
        return <Download className="h-4 w-4 text-blue-500" />
      case "refund":
        return <ArrowDownLeft className="h-4 w-4 text-purple-500" />
      default:
        return <ShoppingCart className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: Transaction["status"]) => {
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
      case "cancelled":
        return (
          <Badge variant="outline" className="text-gray-500 border-gray-200 bg-gray-50">
            Cancelled
          </Badge>
        )
      default:
        return null
    }
  }

  const handleWithdraw = async (request: WithdrawRequest) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("Withdrawal request:", request)
      // In real app, this would call your API
    } catch (error) {
      console.error("Withdrawal failed:", error)
      throw error
    }
  }

  const renderTransactionList = (transactionList: Transaction[]) => (
    <div className="space-y-3">
      {transactionList.map((transaction) => (
        <Card key={transaction.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {transaction.image ? (
                <div className="w-10 h-10 rounded-md overflow-hidden">
                  <img
                    src={transaction.image || "/placeholder.svg"}
                    alt={transaction.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-medium">{transaction.title}</h3>
                  <div className="ml-2">{getTransactionIcon(transaction.type)}</div>
                </div>
                <p className="text-sm text-gray-500">{transaction.date}</p>
                {transaction.description && <p className="text-xs text-gray-400">{transaction.description}</p>}
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {transaction.type === "purchase" || transaction.type === "withdrawal" ? "-" : "+"}$
                  {transaction.amount.toFixed(2)}
                </p>
                {transaction.netAmount && (
                  <p className="text-xs text-gray-500">Net: XAF{transaction.netAmount.toFixed(2)}</p>
                )}
                {getStatusBadge(transaction.status)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  if (!user) return null

  return (
    <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
      <header className="mb-6">
        <div className="flex items-center mb-4">
          <Link href="/profile" className="mr-2">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Transactions</h1>
        </div>
        <p className="text-gray-500">View your transaction history and manage your balance</p>
      </header>

      {/* Balance Card - Only for creators */}
      {user.isCreator && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Balance</span>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">XAF{financialStats.currentBalance.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Available for withdrawal</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold">XAF{financialStats.monthlyEarnings.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">This Month</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">XAF{financialStats.pendingPayouts.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>

              <WithdrawDialog
                currentBalance={financialStats.currentBalance}
                pendingWithdrawals={1}
                onWithdraw={handleWithdraw}
              />
            </div>
          </CardContent>
        </Card>
      )}

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
          {user.isCreator && (
            <TabsTrigger value="sales" className="flex-1">
              Sales
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all">
          {Object.entries(groupedTransactions).map(([month, monthTransactions]) => (
            <div key={month} className="mb-6">
              <h2 className="text-lg font-semibold mb-3">{month}</h2>
              {renderTransactionList(monthTransactions)}
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
                {renderTransactionList(purchases)}
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
                {renderTransactionList(auctions)}
              </div>
            )
          })}
        </TabsContent>

        {user.isCreator && (
          <TabsContent value="sales">
            {Object.entries(groupedTransactions).map(([month, monthTransactions]) => {
              const sales = monthTransactions.filter((t) => t.type === "sale")
              if (sales.length === 0) return null

              return (
                <div key={month} className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">{month}</h2>
                  {renderTransactionList(sales)}
                </div>
              )
            })}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
