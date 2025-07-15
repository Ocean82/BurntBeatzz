<<<<<<< HEAD
import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import QueryClientProviderWrapper from "@/components/query-client-provider"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
=======
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
<<<<<<< HEAD
      <body>
        <QueryClientProviderWrapper>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </QueryClientProviderWrapper>
      </body>
=======
      <body>{children}</body>
>>>>>>> ac05bde066e7c465bf6cf291993fec9ae72ff6fd
    </html>
  )
}
