import { useState, useCallback, useEffect } from 'react'

export function useEventoImagenes() {
  // Guardar archivos File directamente en lugar de Base64
  const [imagenEventoFile, setImagenEventoFile] = useState<File | null>(null)
  const [mapaDistribucionFile, setMapaDistribucionFile] = useState<File | null>(null)
  
  // URLs para preview (usando createObjectURL)
  const [imagenEventoPreview, setImagenEventoPreview] = useState<string | null>(null)
  const [mapaDistribucionPreview, setMapaDistribucionPreview] = useState<string | null>(null)

  // Limpiar URLs cuando el componente se desmonte para evitar memory leaks
  useEffect(() => {
    return () => {
      // Solo revocar URLs que fueron creadas con createObjectURL (archivos locales)
      if (imagenEventoPreview && imagenEventoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagenEventoPreview)
      }
      if (mapaDistribucionPreview && mapaDistribucionPreview.startsWith('blob:')) {
        URL.revokeObjectURL(mapaDistribucionPreview)
      }
    }
  }, [imagenEventoPreview, mapaDistribucionPreview])

  // Handler para subir imagen del evento
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido')
        return
      }
      
      // Limpiar preview anterior si existe (solo URLs de blob)
      if (imagenEventoPreview && imagenEventoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagenEventoPreview)
      }
      
      // Crear preview con createObjectURL (más eficiente que Base64)
      const previewUrl = URL.createObjectURL(file)
      setImagenEventoFile(file)
      setImagenEventoPreview(previewUrl)
    }
  }, [imagenEventoPreview])

  // Handler para subir mapa de distribución
  const handleMapaUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido')
        return
      }
      
      // Limpiar preview anterior si existe (solo URLs de blob)
      if (mapaDistribucionPreview && mapaDistribucionPreview.startsWith('blob:')) {
        URL.revokeObjectURL(mapaDistribucionPreview)
      }
      
      // Crear preview con createObjectURL
      const previewUrl = URL.createObjectURL(file)
      setMapaDistribucionFile(file)
      setMapaDistribucionPreview(previewUrl)
    }
  }, [mapaDistribucionPreview])

  // Limpiar imagen del evento
  const clearImagenEvento = useCallback(() => {
    if (imagenEventoPreview && imagenEventoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagenEventoPreview)
    }
    setImagenEventoFile(null)
    setImagenEventoPreview(null)
  }, [imagenEventoPreview])

  // Limpiar mapa de distribución
  const clearMapaDistribucion = useCallback(() => {
    if (mapaDistribucionPreview && mapaDistribucionPreview.startsWith('blob:')) {
      URL.revokeObjectURL(mapaDistribucionPreview)
    }
    setMapaDistribucionFile(null)
    setMapaDistribucionPreview(null)
  }, [mapaDistribucionPreview])

  return {
    // Archivos File (para enviar al backend)
    imagenEventoFile,
    mapaDistribucionFile,
    
    // URLs de preview (para mostrar en UI)
    imagenEventoPreview,
    mapaDistribucionPreview,
    
    // Setters (para cargar datos desde el backend)
    setImagenEventoPreview,
    setMapaDistribucionPreview,
    
    // Handlers
    handleImageUpload,
    handleMapaUpload,
    clearImagenEvento,
    clearMapaDistribucion,
  }
}
