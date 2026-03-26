"use client"

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Setear timeout para actualizar el valor después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Limpiar timeout si value cambia antes de que expire el delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

