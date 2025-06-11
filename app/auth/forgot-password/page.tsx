"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const validateForm = () => {
    if (!email) {
      setError("Email is required")
      return false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email is invalid")
      return false
    }
    setError("")
    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
      toast({
        title: "Reset link sent",
        description: "Check your email for password reset instructions.",
      })
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center p-4 bg-gradient-to-b from-primary/5 to-secondary/5">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">PayLive</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Reset your password</p>
        </div>

        <div className="bg-white dark:bg-gray-950 p-6 rounded-xl shadow-sm">
          {!isSubmitted ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Forgot your password?</h2>
                <p className="text-gray-500 text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={error ? "border-red-500" : ""}
                  />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-1">Check your email</h3>
                <p className="text-sm">
                  We've sent a password reset link to <span className="font-medium">{email}</span>
                </p>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                Try Again
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-sm text-primary hover:underline inline-flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
