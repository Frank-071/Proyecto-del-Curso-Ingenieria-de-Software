"use client"

import { useRequireAdmin } from "@/lib/hooks/auth"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isValidating } = useRequireAdmin()

  if (isValidating) {
    return null;
  }

  return (
    <>
      {children}
    </>
  )
}