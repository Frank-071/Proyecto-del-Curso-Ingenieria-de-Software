"use client"

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useEventosStore } from '@/lib/stores/eventos-store'

export function Providers({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore(state => state.initializeAuth)
  const authInitialized = useAuthStore(state => state.initialized)
  
  const cargarEventos = useEventosStore(state => state.cargarEventos)
  const eventosInitialized = useEventosStore(state => state.initialized)
  
  useEffect(() => {
    if (!authInitialized) {
      initializeAuth()
    }
  }, [authInitialized, initializeAuth])
  
  useEffect(() => {
    if (!eventosInitialized) {
      cargarEventos()
    }
  }, [eventosInitialized, cargarEventos])
  
  return <>{children}</>
}

