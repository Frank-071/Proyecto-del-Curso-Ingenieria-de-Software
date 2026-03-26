"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({ isLoading, message = "Cargando...", className }: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm",
      className
    )}>
      <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-lg font-medium text-gray-900">{message}</p>
      </div>
    </div>
  )
}
