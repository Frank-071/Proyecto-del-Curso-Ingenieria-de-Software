import { useState, useEffect, useCallback, useRef } from 'react'
import { organizadoresService } from '@/lib/api/services/organizadores'
import { OrganizadorResponse } from '@/lib/types/entities/organizador'

export const useOrganizadores = () => {
  const [organizadores, setOrganizadores] = useState<OrganizadorResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const fetchOrganizadores = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await organizadoresService.listar()
      if (result.success) {
        setOrganizadores(result.data)
      } else {
        if (isMountedRef.current) {
          setError(result.detail || 'Error al cargar organizadores')
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error al cargar organizadores')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganizadores()
  }, [fetchOrganizadores])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    organizadores,
    loading,
    error,
    fetchOrganizadores,
    setError
  }
}

