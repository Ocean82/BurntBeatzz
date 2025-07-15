"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, X, AlertCircle, User, Mail, Lock, Shield, CheckCircle } from "lucide-react"

interface PasswordValidation {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

interface FormData {
  email: string
  username: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  [key: string]: string
}

export function UserRegistration() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  // Password validation function
  const validatePassword = (password: string): PasswordValidation => {
    return {
      minLength: password.length >= 5,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }
  }

  const passwordValidation = validatePassword(formData.password)
  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Username validation
  const validateUsername = (username: string): boolean => {
    return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username)
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Username validation
    if (!formData.username) {
      newErrors.username = "Username is required"
    } else if (!validateUsername(formData.username)) {
      newErrors.username = "Username must be 3+ characters, letters, numbers, and underscores only"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (!isPasswordValid) {
      newErrors.password = "Password must meet all security requirements"
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // Terms agreement
    if (!agreedToTerms) {
      newErrors.terms = "You must agree to the terms and conditions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          agreedToTerms,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Success - show success message
        setRegistrationSuccess(true)
        console.log("Registration successful:", data)

        // Reset form
        setFormData({
          email: "",
          username: "",
          password: "",
          confirmPassword: "",
        })
        setAgreedToTerms(false)

        // Redirect after 3 seconds
        setTimeout(() => {
          window.location.href = "/"
        }, 3000)
      } else {
        // Handle API errors
        if (data.details) {
          // Handle validation errors from API
          const apiErrors: FormErrors = {}
          data.details.forEach((detail: any) => {
            apiErrors[detail.field] = detail.message
          })
          setErrors(apiErrors)
        } else {
          setErrors({ submit: data.error || "Registration failed" })
        }
      }
    } catch (error) {
      console.error("Registration error:", error)
      setErrors({ submit: "Network error. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPasswordStrengthColor = (): string => {
    const validCount = Object.values(passwordValidation).filter(Boolean).length
    if (validCount >= 5) return "text-green-400"
    if (validCount >= 3) return "text-yellow-400"
    if (validCount >= 2) return "text-orange-400"
    return "text-red-400"
  }

  const getPasswordStrengthText = (): string => {
    const validCount = Object.values(passwordValidation).filter(Boolean).length
    if (validCount >= 5) return "Strong"
    if (validCount >= 3) return "Good"
    if (validCount >= 2) return "Fair"
    return "Weak"
  }

  const userAgreementText = `🔥 Burnt Beats Contributor Acknowledgment & Usage Agreement
Effective: January 2025

By accessing or contributing to the Burnt Beats platform, users acknowledge and agree to the following terms. This agreement is designed to protect both the contributors and the platform while encouraging a fair, respectful, and creative environment.

1. Usage Rights
Burnt Beats and its affiliates retain the irrevocable right to use, modify, distribute, and display any content, code, assets, vocal samples, or feedback submitted to the platform ("Contributions") for any purpose deemed appropriate, including commercial use, without additional compensation—unless otherwise agreed in writing.

2. Ownership & Licensing
Users who purchase a full license to content they create through Burnt Beats (e.g. beats, vocals, lyrics, tracks) retain 100% ownership of that content. Burnt Beats will not sell, license, or share such content with any third party or affiliate without explicit written consent from the creator.

However, contributors acknowledge and grant Burnt Beats the right to:
- Feature content in charts, promotional assets, community competitions, and curated playlists (e.g. "Top 10 of the Month", "Featured Remixes").
- Anonymously store cloned vocal models from users in a shared vocal bank, accessible by others, without revealing the source user's identity.
- Use short excerpts or visuals in platform demos, onboarding materials, or promotional previews without affecting ownership.

These rights exist solely to support platform functionality, creative discovery, and community building.

3. Copyright & Compliance
All submitted content must be original or lawfully sourced. Users agree not to submit, upload, or incorporate any material that violates copyright laws, trademarks, patents, third-party licenses, or any applicable intellectual property regulations.

4. Indemnification
You agree to indemnify, defend, and hold harmless Burnt Beats, its founders, contributors, and affiliates from and against any and all claims, damages, liabilities, legal actions, or losses arising from your Contributions, use of the platform, or violation of this agreement.

5. Acknowledgment of Terms
By proceeding, you confirm that you've read and understood this agreement in full. Claims of "I didn't know" are not a valid defense—because, well, we wrote this exact line.

6. Disclaimers, Liability & Arbitration

6.1 No Blame Game
You release Burnt Beats and everyone ever even remotely involved—including the founder, devs, collaborators, and that one intern who maybe tweaked the color scheme—from any past, present, or future legal claims caused by your actions, another user's actions, or anything weird the internet might do.

6.2 You Can't Sue Us
Even if we do something unexpectedly dumb (which we try very hard not to), you agree not to bring legal action against us—for the next 5,631 years.

6.3 I Actually Read This
By continuing, you agree that you truly read this agreement. You didn't just skim. You're nodding your head right now. See? That's binding.

6.4 In the Unlikely Event of Drama...
Should a legal dispute arise, you agree to resolve it via binding arbitration before pursuing any court action. Burnt Beats will select the arbitrator. The user shall cover all related fees, including legal representation, filing fees, vending machine snacks, and the babysitter.

You also agree not to sue us for our house. But if you try, we reserve the right to rename it The Burnt Bungalow.`

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-orange-900/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/60 border-green-500/30 backdrop-blur-sm">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-green-300">Welcome to Burnt Beats! 🔥</h2>
            <p className="text-gray-300">
              Your account has been created successfully. You've received 100 free credits to get started!
            </p>
            <p className="text-sm text-gray-400">Redirecting you to the app in a few seconds...</p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              Go to App Now
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-orange-900/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/60 border-orange-500/30 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src="/logos/burnt-beats-cute-fox.jpeg" alt="Burnt Beats" className="w-20 h-20 rounded-lg shadow-lg" />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-300">Join Burnt Beats</CardTitle>
          <p className="text-gray-400">Create your account and start making music</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-orange-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="bg-black/40 border-orange-500/30 text-white focus:border-orange-400"
                placeholder="your@email.com"
                disabled={isSubmitting}
              />
              {formData.email && (
                <div className="flex items-center gap-2 text-sm">
                  {validateEmail(formData.email) ? (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  ) : (
                    <X className="w-3 h-3 text-red-400" />
                  )}
                  <span className={validateEmail(formData.email) ? "text-green-400" : "text-red-400"}>
                    {validateEmail(formData.email) ? "Valid email format" : "Invalid email format"}
                  </span>
                </div>
              )}
              {errors.email && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-orange-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="bg-black/40 border-orange-500/30 text-white focus:border-orange-400"
                placeholder="your_username"
                disabled={isSubmitting}
              />
              {formData.username && (
                <div className="flex items-center gap-2 text-sm">
                  {validateUsername(formData.username) ? (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  ) : (
                    <X className="w-3 h-3 text-red-400" />
                  )}
                  <span className={validateUsername(formData.username) ? "text-green-400" : "text-red-400"}>
                    {validateUsername(formData.username)
                      ? "Valid username"
                      : "3+ chars, letters, numbers, underscore only"}
                  </span>
                </div>
              )}
              {errors.username && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-orange-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="bg-black/40 border-orange-500/30 text-white pr-10 focus:border-orange-400"
                  placeholder="Create a secure password"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          Object.values(passwordValidation).filter(Boolean).length >= 4
                            ? "bg-green-500"
                            : Object.values(passwordValidation).filter(Boolean).length >= 3
                              ? "bg-yellow-500"
                              : Object.values(passwordValidation).filter(Boolean).length >= 2
                                ? "bg-orange-500"
                                : "bg-red-500"
                        }`}
                        style={{
                          width: `${(Object.values(passwordValidation).filter(Boolean).length / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <Badge variant="outline" className={`text-xs ${getPasswordStrengthColor()} border-current`}>
                      {getPasswordStrengthText()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-1 text-xs">
                    {Object.entries(passwordValidation).map(([key, isValid]) => {
                      const labels = {
                        minLength: "At least 5 characters",
                        hasUppercase: "One uppercase letter",
                        hasLowercase: "One lowercase letter",
                        hasNumber: "One number",
                        hasSpecialChar: "One special character",
                      }

                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-1 ${isValid ? "text-green-400" : "text-red-400"}`}
                        >
                          {isValid ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {labels[key as keyof typeof labels]}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-orange-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className="bg-black/40 border-orange-500/30 text-white pr-10 focus:border-orange-400"
                  placeholder="Confirm your password"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>

              {formData.confirmPassword && (
                <div className="flex items-center gap-2 text-sm">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 text-red-400" />
                      <span className="text-red-400">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}

              {errors.confirmPassword && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className="mt-1 border-orange-500/50 data-[state=checked]:bg-orange-500"
                  disabled={isSubmitting}
                />
                <div className="text-sm text-gray-300">
                  <Label htmlFor="terms" className="cursor-pointer">
                    I agree to the{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-orange-300 underline hover:text-orange-200"
                      onClick={() => setShowTermsDialog(true)}
                      disabled={isSubmitting}
                    >
                      Terms and Conditions
                    </Button>
                  </Label>
                </div>
              </div>

              {errors.terms && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.terms}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !isPasswordValid || !agreedToTerms}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </Button>

            {/* Submit Error */}
            {errors.submit && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">{errors.submit}</AlertDescription>
              </Alert>
            )}
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-orange-300 underline hover:text-orange-200"
                onClick={() => (window.location.href = "/auth/login")}
              >
                Sign In
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Terms Modal */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-black/90 border-orange-500/30">
          <DialogHeader>
            <DialogTitle className="text-orange-300 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Terms and Conditions
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm text-gray-300">
              <pre className="whitespace-pre-wrap font-sans">{userAgreementText}</pre>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowTermsDialog(false)}
              className="border-gray-500/30 text-gray-300 hover:bg-gray-800"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setAgreedToTerms(true)
                setShowTermsDialog(false)
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Accept Terms
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
