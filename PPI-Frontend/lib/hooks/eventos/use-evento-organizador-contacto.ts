import { useCallback, useEffect, useMemo, useState } from 'react'
import { eventosService } from '@/lib/api/services/eventos'
import type { OrganizadorResponse } from '@/lib/types/entities/organizador'

interface UseEventoOrganizadorContactoOptions {
  enabled?: boolean
}

interface UseEventoOrganizadorContactoResult {
  contacto: OrganizadorResponse | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useEventoOrganizadorContacto(
  eventoId?: number,
  options: UseEventoOrganizadorContactoOptions = {}
): UseEventoOrganizadorContactoResult {
  const { enabled = true } = options
  const [contacto, setContacto] = useState<OrganizadorResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canFetch = useMemo(() => enabled && !!eventoId && eventoId > 0, [enabled, eventoId])

  const fetchContacto = useCallback(async () => {
    if (!canFetch) {
      setContacto(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await eventosService.obtenerOrganizadorContacto(eventoId as number)
      if (result.success) {
        setContacto(result.data || null)
      } else {
        setContacto(null)
        setError(result.detail || 'No se pudo obtener la información del organizador')
      }
    } catch (err) {
      setContacto(null)
      setError((err as Error).message || 'Error al obtener la información del organizador')
    } finally {
      setLoading(false)
    }
  }, [canFetch, eventoId])

  useEffect(() => {
    fetchContacto()
  }, [fetchContacto])

  return {
    contacto,
    loading,
    error,
    refetch: fetchContacto,
  }
}
