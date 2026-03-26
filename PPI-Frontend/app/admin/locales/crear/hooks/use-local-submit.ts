"use client"

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { LocalFormData, LocalFormErrors, LocalPageMode } from '@/lib/types/forms'
import { useLocales } from '@/lib/hooks/locales'
import { toast } from 'sonner'

export function useLocalSubmit() {
  const router = useRouter()
  const { crearLocal, actualizarLocal, fetchLocalById, toggleLocalStatus } = useLocales()

  const validateForm = useCallback((formData: LocalFormData): LocalFormErrors => {
    const errors: LocalFormErrors = {
      departamento: "",
      provincia: "",
      distrito: "",
      tipo: ""
    }

    if (!formData.departamento) errors.departamento = "Debe seleccionar un departamento."
    if (!formData.provincia) errors.provincia = "Debe seleccionar una provincia."
    if (!formData.distrito) errors.distrito = "Debe seleccionar un distrito."
    if (!formData.tipo) errors.tipo = "Debe seleccionar un tipo de local."

    return errors
  }, [])

  const handleSubmit = useCallback(async (
    formData: LocalFormData,
    pageMode: LocalPageMode,
    localId: number | null,
    setErrors: (errors: LocalFormErrors) => void,
    setIsLoading: (loading: boolean) => void
  ) => {
    // Validaciones previas
    const newErrors = validateForm(formData)
    const hasErrors = Object.values(newErrors).some(error => error !== "")

    if (hasErrors) {
      setErrors(newErrors)
      return false
    }

    setIsLoading(true)

    try {
      const payload = {
        nombre: formData.nombre,
        direccion: formData.direccion,
        distrito_id: parseInt(formData.distrito),
        aforo: parseInt(formData.capacidad),
        tipo_local_id: parseInt(formData.tipo),
        activo: formData.estado
      }

      let result

      if (pageMode === 'edit' && localId) {
        // Verificar si se está intentando desactivar un local con eventos activos
        if (!formData.estado) {
          // Obtener el estado actual del local
          const localResult = await fetchLocalById(localId)
          if (localResult?.success && localResult.data) {
            const estadoActual = localResult.data.activo
            
            // Si el local estaba activo y ahora se quiere desactivar, verificar eventos activos
            if (estadoActual && !formData.estado) {
              // Intentar desactivar temporalmente para verificar si hay eventos activos
              // Esto nos permitirá capturar el error del backend si existe
              const toggleResult = await toggleLocalStatus(localId, false)
              
              if (!toggleResult.success) {
                // Si hay error, probablemente es por eventos activos
                const errorMessage = toggleResult.error || 'No se puede desactivar el local'
                
                // Verificar si el error menciona eventos activos
                const errorLower = errorMessage.toLowerCase()
                if (errorLower.includes('evento') || 
                    errorLower.includes('activo') ||
                    errorLower.includes('asociado') ||
                    errorLower.includes('no se puede')) {
                  toast.error('No se puede desactivar el local', {
                    description: errorMessage || 'El local tiene eventos activos asociados. Debe desactivar o eliminar los eventos antes de desactivar el local.'
                  })
                  setIsLoading(false)
                  return false
                }
              } else {
                // Si no hay error, reactivar el local para mantener el estado original
                // y luego proceder con la actualización normal
                await toggleLocalStatus(localId, true)
              }
            }
          }
        }
        
        // Actualizar local existente
        result = await actualizarLocal(localId, payload)
      } else {
        // Crear nuevo local
        result = await crearLocal(payload)
      }

      if (result.success) {
        toast.success(pageMode === 'edit' ? 'Local actualizado' : 'Local creado', {
          description: `El local se ha ${pageMode === 'edit' ? 'actualizado' : 'creado'} correctamente`
        })
        router.push("/admin/locales")
        return true
      } else {
        toast.error('Error al guardar', {
          description: result.detail || 'Error desconocido'
        })
        return false
      }
    } catch (error) {
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor'
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [validateForm, crearLocal, actualizarLocal, router, fetchLocalById, toggleLocalStatus])

  return {
    validateForm,
    handleSubmit
  }
}
