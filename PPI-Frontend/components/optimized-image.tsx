"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
}

export function OptimizedImage({ 
  src, 
  alt, 
  className,
  fallbackSrc = "/placeholder-event.jpg"
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc)
      setHasError(false)
    } else {
      setHasError(true)
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Imagen no disponible</p>
          </div>
        </div>
      ) : (
        <img
          src={imgSrc}
          alt={alt}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
        />
      )}
    </div>
  )
}