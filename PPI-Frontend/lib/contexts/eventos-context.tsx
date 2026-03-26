"use client"

import { createContext, useContext, ReactNode } from 'react'
import { useEventosConLocales, EventoConLocal } from '@/lib/hooks/eventos'

interface EventosContextType {
  eventosConLocales: EventoConLocal[]
  loading: boolean
  error: string | null
}

const EventosContext = createContext<EventosContextType | undefined>(undefined)

export function EventosProvider({ children }: { children: ReactNode }) {
  const { eventosConLocales, loading, error } = useEventosConLocales()

  return (
    <EventosContext.Provider value={{ eventosConLocales, loading, error }}>
      {children}
    </EventosContext.Provider>
  )
}

export function useEventosContext() {
  const context = useContext(EventosContext)
  if (context === undefined) {
    throw new Error('useEventosContext must be used within an EventosProvider')
  }
  return context
}