"use client"

import { useState, useEffect } from 'react'
import { tokenUtils } from '@/lib/auth/token'

interface ProximoEvento {
  nombre: string
  fecha: string
  hora: string
}

interface ClientPoints {
  currentPoints: number
  totalPointsEarned: number
  totalTickets: number
  proximoEvento: ProximoEvento | null
  loading: boolean
  error: string | null
}

export function useClientPoints(): ClientPoints & { reload: () => Promise<void> } {
  const [data, setData] = useState<ClientPoints>({
    currentPoints: 0,
    totalPointsEarned: 0,
    totalTickets: 0,
    proximoEvento: null,
    loading: true,
    error: null
  })

  const fetchClientPoints = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))
      
      const token = await tokenUtils.getToken()
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${base}/clientes/perfil`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()
      
      setData({
        currentPoints: responseData.data.puntos_disponibles || 0,
        totalPointsEarned: responseData.data.puntos_historicos || 0,
        totalTickets: responseData.data.total_tickets || 0,
        proximoEvento: responseData.data.proximo_evento || null,
        loading: false,
        error: null
      })

    } catch (error) {
      console.error('Error fetching client points:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }))
    }
  }

  useEffect(() => {
    fetchClientPoints()
  }, []) // Solo se ejecuta una vez al montar el componente

  return {
    ...data,
    reload: fetchClientPoints
  }
}