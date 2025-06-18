"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { auth, db } from "@/functions/firebase";
import { RecaptchaVerifier } from "firebase/auth";

interface FormErrors {
  name: string
  phone: string
  otp: string
}

export default function SignupPage() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [verificationId, setVerificationId] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({
    name: "",
    phone: "",
    otp: "",
  })
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)

  const { loginWithPhoneNumber, confirmOtp, loading } = useAuth()
  const { toast } = useToast()

  const validatePhone = (): boolean => {
    // Basic phone validation - can be enhanced
    if (!phone) {
      setErrors((prev) => ({ ...prev, phone: "Phone number is required" }))
      return false
    }

    // Remove spaces and check if it's a valid phone format
    const cleanPhone = phone.replace(/\s/g, "")
    if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
      setErrors((prev) => ({ ...prev, phone: "Enter a valid phone number" }))
      return false
    }

    setErrors((prev) => ({ ...prev, phone: "" }))
    return true
  }

  const validateName = (): boolean => {
    if (!name.trim()) {
      setErrors((prev) => ({ ...prev, name: "Name is required" }))
      return false
    }

    setErrors((prev) => ({ ...prev, name: "" }))
    return true
  }

  const validateOTP = (): boolean => {
    if (!otp) {
      setErrors((prev) => ({ ...prev, otp: "Verification code is required" }))
      return false
    }

    if (!/^\d{6}$/.test(otp)) {
      setErrors((prev) => ({ ...prev, otp: "Enter a valid 6-digit code" }))
      return false
    }

    setErrors((prev) => ({ ...prev, otp: "" }))
    return true
  }

  const handleSendCode = async () => {
  const isPhoneValid = validatePhone();
  const isNameValid = validateName();

  if (!isPhoneValid || !isNameValid) return;

  setSendingCode(true);

  try {
    // Init recaptchaVerifier only once
    if (typeof window !== "undefined" && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => console.log("reCAPTCHA solved"),
        }
      );

      await window.recaptchaVerifier.render();
    }

    // 🔥 Call your custom login function with the verifier
    const result = await loginWithPhoneNumber(phone, window.recaptchaVerifier);
    setVerificationId(result.verificationId); // if you use this later
    setCodeSent(true);

    toast({ title: "Code sent!", description: "Check your phone." });
  } catch (error: any) {
    console.error(error);
    toast({
      title: "Error",
      description: error.message || "Failed to send code",
    });
  } finally {
    setSendingCode(false);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateOTP()) return;

    setVerifyingCode(true);
    try {
      await confirmOtp(otp, name); // This should create the user in Firestore in your context
      toast({ title: "Account created", description: "Welcome to PayLive!" });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Verification failed" });
    } finally {
      setVerifyingCode(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-4 bg-gradient-to-b from-primary/5 to-secondary/5">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">PayLive</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Create your account to start selling or buying</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-950 p-6 rounded-xl shadow-sm space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex space-x-2">
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={errors.phone ? "border-red-500" : ""}
                disabled={codeSent}
              />
              <Button type="button" onClick={handleSendCode} disabled={sendingCode || codeSent} variant="outline">
                {sendingCode ? "Sending..." : codeSent ? "Sent" : "Send Code"}
              </Button>
            </div>
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
          </div>

          {codeSent && (
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className={errors.otp ? "border-red-500" : ""}
                maxLength={6}
              />
              {errors.otp && <p className="text-red-500 text-sm">{errors.otp}</p>}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || verifyingCode || !codeSent}>
            {verifyingCode ? "Creating account..." : "Create account"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
            <Link href="/auth/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>
        </form>
      </div>

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </div>
  )
}