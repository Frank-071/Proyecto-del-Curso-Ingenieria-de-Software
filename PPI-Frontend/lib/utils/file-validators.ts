export const FILE_VALIDATION = {
  MAX_SIZE: 5 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
} as const

export interface FileValidationResult {
  valid: boolean
  error?: {
    title: string
    description: string
  }
}

export const validateImageFile = (file: File): FileValidationResult => {
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: {
        title: 'Solo se permiten imágenes',
        description: 'Por favor selecciona un archivo de imagen (JPG, PNG, etc.)'
      }
    }
  }

  if (file.size > FILE_VALIDATION.MAX_SIZE) {
    return {
      valid: false,
      error: {
        title: 'Imagen muy grande',
        description: 'El tamaño máximo permitido es 5MB'
      }
    }
  }

  return { valid: true }
}

