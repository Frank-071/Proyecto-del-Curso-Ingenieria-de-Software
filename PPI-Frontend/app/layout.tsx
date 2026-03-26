import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { CartNotification } from '@/components/cart-notification'
import { CartSidebar } from '@/components/cart-sidebar'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'PatasPepasSoft',
  description: 'Sistema de gestión de eventos y entradas',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Providers>
          {children}
        </Providers>
        <CartSidebar />
        <CartNotification />
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
