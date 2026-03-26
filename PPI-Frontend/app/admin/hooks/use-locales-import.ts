import { useState, useCallback } from 'react'
import { localesService } from '@/lib/api/services/locales'
import type { LocalesImportInsertado } from '@/lib/types/entities/local'

interface UseLocalesImportReturn {
  isOpen: boolean
  file: File | null
  isValid: boolean
  validationErrors: string[] | null
  insertedRows: string[] | null
  isLoading: boolean
  openModal: () => void
  closeModal: () => void
  setFile: (file: File | null) => void
  handleImport: () => Promise<void>
  resetState: () => void
}

export function useLocalesImport(): UseLocalesImportReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isValid, setIsValid] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[] | null>(null)
  const [insertedRows, setInsertedRows] = useState<string[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const resetState = useCallback(() => {
    setIsValid(false)
    setValidationErrors(null)
    setInsertedRows(null)
    setFile(null)
    setIsLoading(false)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setIsValid(false)
    setValidationErrors(null)
    setInsertedRows(null)
    setFile(null)
    setIsLoading(false)
  }, [])

  const handleSetFile = useCallback((file: File | null) => {
    setFile(file)
    if (file) {
      setIsValid(false)
      setValidationErrors(null)
      setInsertedRows(null)
      setIsLoading(false)
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (!file || isLoading) return

    const formData = new FormData()
    formData.append("file", file)

    setIsLoading(true)
    setValidationErrors(null)
    setInsertedRows(null)
    setIsValid(false)

    try {
      const result = await localesService.importar(formData)

      if (!result.success) {
        setValidationErrors([result.detail])
        setIsValid(false)
        return
      }

      const errores = result.data.errores
      const insertados = result.data.insertados

      const toMessage = (item: string | LocalesImportInsertado) => {
        if (typeof item === 'string') {
          return item
        }

        if (item.mensaje) return item.mensaje
        if (item.message) return item.message

        const fila = item.fila !== undefined ? `Fila ${item.fila}` : 'Registro'
        const nombre = item.nombre ? `: ${item.nombre}` : ''
        return `${fila}${nombre} procesado`
      }

      const insertadosMessages = insertados.map(toMessage)

      setInsertedRows(insertadosMessages.length > 0 ? insertadosMessages : null)
      setValidationErrors(errores.length > 0 ? errores : null)
      setIsValid(errores.length === 0)
    } catch (err) {
      const errorMessage = err instanceof Error
        ? (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')
          ? 'Error de conexión: No se pudo conectar con el servidor'
          : err.message)
        : 'Error al procesar la validación'
      setValidationErrors([errorMessage])
      setIsValid(false)
    } finally {
      setIsLoading(false)
    }
  }, [file, isLoading])

  return {
    isOpen,
    file,
    isValid,
    validationErrors,
    insertedRows,
    isLoading,
    openModal,
    closeModal,
    setFile: handleSetFile,
    handleImport,
    resetState,
  }
}

