"use client"

import { ElegantSpinner } from "./elegant-spinner"

interface PageSpinnerProps {
  message?: string
  className?: string
}

export function PageSpinner({ 
  message = "Cargando contenido...", 
  className 
}: PageSpinnerProps) {
  return (
    <div className={`h-screen flex items-center justify-center ${className}`}>
      <ElegantSpinner 
        size="lg" 
        message={message}
        className="space-y-6"
      />
    </div>
  )
}
