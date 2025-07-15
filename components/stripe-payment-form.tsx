"use client"

import type React from "react"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Lock, AlertCircle, Loader2 } from "lucide-react"

// OLD
// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// NEW
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

/**
 * Only load Stripe when a publishable key is present.
 * When the key is missing we resolve to `null` so the rest
 * of the component can render a graceful error message.
 */
const stripePromise = publishableKey
  ? loadStripe(publishableKey)
  : Promise.resolve(null as unknown as import("@stripe/stripe-js").Stripe | null)

interface StripePaymentFormProps {
  amount: number
  songId: string
  songTitle: string
  tier: string
  includeLicense: boolean
  onSuccess: () => void
  onCancel: () => void
}

function PaymentForm({ amount, songId, songTitle, tier, includeLicense, onSuccess, onCancel }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Create payment intent
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          songId,
          songTitle,
          tier,
          includeLicense,
          email,
          name,
        }),
      })

      const { clientSecret, error: serverError } = await response.json()

      if (serverError) {
        throw new Error(serverError)
      }

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name,
            email,
          },
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      if (paymentIntent?.status === "succeeded") {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "transparent",
        "::placeholder": {
          color: "#6b7280",
        },
      },
      invalid: {
        color: "#ef4444",
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-green-300">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-black/40 border-green-500/30 text-green-100"
            placeholder="John Doe"
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-green-300">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-black/40 border-green-500/30 text-green-100"
            placeholder="john@example.com"
          />
        </div>
      </div>

      {/* Card Information */}
      <div>
        <Label className="text-green-300 mb-2 block">Card Information</Label>
        <div className="bg-black/40 border border-green-500/30 rounded-md p-3">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-green-400/60 text-sm">
        <Lock className="w-4 h-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 border-gray-500/30 text-gray-300 hover:bg-gray-500/10 bg-transparent"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing || !email || !name}
          className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  if (!publishableKey) {
    return (
      <div className="border border-red-500/30 bg-red-500/10 text-red-300 p-4 rounded-lg text-sm">
        ⚠️ Stripe publishable key is not set. Add <code className="font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{" "}
        to your environment variables to enable payments.
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}
