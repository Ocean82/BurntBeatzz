import type { Metadata } from 'next'
import './globals.css'
import QueryClientProviderWrapper from "@/components/query-client-provider"
import { ThemeProvider } from "next-themes"

export const metadata: Metadata = {
  title: 'Beatzz Music Generator',
  description: 'AI-powered music generation with MIDI processing and vocal synthesis',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <QueryClientProviderWrapper>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </QueryClientProviderWrapper>
      </body>
    </html>
  )
}