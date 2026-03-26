"use client"

import { cn } from "@/lib/utils"

interface ElegantSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  message?: string
  className?: string
}

export function ElegantSpinner({ 
  size = "md", 
  message = "Cargando...", 
  className 
}: ElegantSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-4",
      className
    )}>
      {/* Spinner principal con gradiente */}
      <div className="relative">
        {/* Círculo de fondo */}
        <div className={cn(
          "rounded-full border-4 border-muted animate-spin",
          sizeClasses[size]
        )} style={{
          borderTopColor: '#50bfa0',
          borderRightColor: '#f97316',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent'
        }} />
        
        {/* Círculo interno con pulso */}
        <div className={cn(
          "absolute rounded-full bg-primary/20 animate-pulse",
          size === "sm" ? "inset-1" : size === "lg" ? "inset-3" : size === "xl" ? "inset-4" : "inset-2"
        )} />
      </div>
      
      {/* Mensaje */}
      {message && (
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}
