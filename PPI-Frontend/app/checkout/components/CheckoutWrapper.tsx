"use client"

import { Header } from "@/components/header"
import CheckoutClient from "./CheckoutClient"

export function CheckoutWrapper() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CheckoutClient />
    </div>
  )
}
