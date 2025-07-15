import { UserRegistration } from "@/components/user-registration"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Join Burnt Beats - Create Your Account",
  description: "Sign up for Burnt Beats and start creating amazing music with AI. Free to use, pay only for downloads.",
}

export default function RegisterPage() {
  return <UserRegistration />
}
