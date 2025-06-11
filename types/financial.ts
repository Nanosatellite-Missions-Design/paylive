export interface FinancialStats {
  currentBalance: number
  monthlyEarnings: number
  totalEarnings: number
  pendingPayouts: number
  totalSales: number
  totalPurchases: number
}

export interface WithdrawRequest {
  amount: number
  method: "bank" | "paypal" | "stripe"
  accountDetails?: string
}

export interface Transaction {
  id: string
  type: "purchase" | "sale" | "auction" | "withdrawal" | "refund"
  title: string
  amount: number
  date: string
  status: "completed" | "pending" | "failed" | "cancelled"
  image?: string
  description?: string
  fees?: number
  netAmount?: number
}
