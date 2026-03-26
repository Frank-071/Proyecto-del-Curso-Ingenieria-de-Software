import { useState, useCallback, useEffect } from "react"
import type { 
  ProfileData, 
  ProfileFormData, 
  ProfileFormErrors,
  PasswordFormErrors
} from "@/lib/types/perfil/micuenta"
import { GENERO_OPTIONS } from "@/lib/types/perfil/micuenta"

export function useProfileForm(initialData?: ProfileData) {
  // Estado del formulario de perfil
  const [formData, setFormData] = useState<ProfileFormData>({
    nombres: initialData?.nombres || "",
    apellidos: initialData?.apellidos || "",
    email: initialData?.email || "",
    genero: initialData?.genero || "",
    telefono: initialData?.telefono || "",
    recibir_informacion_eventos: initialData?.recibir_informacion_eventos || false
  })

  const [errors, setErrors] = useState<ProfileFormErrors>({})

  // Actualizar formulario cuando cambien los datos iniciales
  useEffect(() => {
    if (initialData) {
      setFormData({
        nombres: initialData.nombres || "",
        apellidos: initialData.apellidos || "",
        email: initialData.email || "",
        genero: initialData.genero || "",
        telefono: initialData.telefono || "",
        recibir_informacion_eventos: initialData.recibir_informacion_eventos || false
      })
    }
  }, [initialData])

  // Validaciones del formulario de perfil
  const validateProfileForm = useCallback((): boolean => {
    const newErrors: ProfileFormErrors = {}

    // Validar nombres
    if (!formData.nombres.trim()) {
      newErrors.nombres = "El nombre es requerido"
    } else if (formData.nombres.length > 60) {
      newErrors.nombres = "El nombre no puede exceder 60 caracteres"
    }

    // Validar apellidos
    if (!formData.apellidos.trim()) {
      newErrors.apellidos = "El apellido es requerido"
    } else if (formData.apellidos.length > 60) {
      newErrors.apellidos = "El apellido no puede exceder 60 caracteres"
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Formato de email inválido"
    }

    // Validar teléfono
    const phoneRegex = /^\d{9}$/
    if (formData.telefono && !phoneRegex.test(formData.telefono)) {
      newErrors.telefono = "El teléfono debe tener exactamente 9 dígitos"
    }

    // Validar género
    if (formData.genero && !GENERO_OPTIONS.includes(formData.genero as any)) {
      newErrors.genero = "Selecciona un género válido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Actualizar campo del formulario
  const updateField = useCallback((field: keyof ProfileFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo si existe (solo para campos con validación)
    if (field !== 'recibir_informacion_eventos' && errors[field as keyof ProfileFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  // Reset del formulario
  const resetForm = useCallback((data?: ProfileData) => {
    setFormData({
      nombres: data?.nombres || "",
      apellidos: data?.apellidos || "",
      email: data?.email || "",
      genero: data?.genero || "",
      telefono: data?.telefono || "",
      recibir_informacion_eventos: data?.recibir_informacion_eventos || false
    })
    setErrors({})
  }, [])

  // Obtener datos para enviar (solo campos que cambiaron)
  const getChangedData = useCallback((originalData?: ProfileData) => {
    if (!originalData) return formData

    const changes: Partial<ProfileFormData> = {}
    
    if (formData.nombres !== (originalData.nombres || "")) {
      changes.nombres = formData.nombres
    }
    if (formData.apellidos !== (originalData.apellidos || "")) {
      changes.apellidos = formData.apellidos
    }
    if (formData.email !== originalData.email) {
      changes.email = formData.email
    }
    if (formData.genero !== (originalData.genero || "")) {
      changes.genero = formData.genero
    }
    if (formData.telefono !== (originalData.telefono || "")) {
      changes.telefono = formData.telefono
    }
    if (formData.recibir_informacion_eventos !== (originalData.recibir_informacion_eventos || false)) {
      changes.recibir_informacion_eventos = formData.recibir_informacion_eventos
    }

    return changes
  }, [formData])

  return {
    // Estado
    formData,
    errors,
    
    // Acciones
    updateField,
    validateProfileForm,
    resetForm,
    getChangedData,
    
    // Computed
    hasChanges: (originalData?: ProfileData) => {
      const changes = getChangedData(originalData)
      return Object.keys(changes).length > 0
    },
    isValid: Object.keys(errors).length === 0
  }
}

export function usePasswordForm() {
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  })

  const [passwordErrors, setPasswordErrors] = useState<PasswordFormErrors>({})

  // Validaciones del formulario de contraseña
  const validatePasswordForm = useCallback((): boolean => {
    const newErrors: PasswordFormErrors = {}

    // Validar contraseña actual
    if (!passwordData.current_password) {
      newErrors.current_password = "Ingresa tu contraseña actual"
    }

    // Validar nueva contraseña
    if (!passwordData.new_password) {
      newErrors.new_password = "Ingresa la nueva contraseña"
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = "La contraseña debe tener al menos 8 caracteres"
    } else if (!/[A-Za-z]/.test(passwordData.new_password) || !/\d/.test(passwordData.new_password)) {
      newErrors.new_password = "Debe contener al menos 1 letra y 1 número"
    }

    // Validar confirmación
    if (passwordData.confirm_password !== passwordData.new_password) {
      newErrors.confirm_password = "Las contraseñas no coinciden"
    }

    setPasswordErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [passwordData])

  // Actualizar campo de contraseña
  const updatePasswordField = useCallback((field: keyof typeof passwordData, value: string | boolean) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo si existe
    if (passwordErrors[field as keyof PasswordFormErrors]) {
      setPasswordErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [passwordErrors])

  // Reset del formulario de contraseña
  const resetPasswordForm = useCallback(() => {
    setPasswordData({
      current_password: "",
      new_password: "",
      confirm_password: ""
    })
    setPasswordErrors({})
  }, [])

  return {
    // Estado
    passwordData,
    passwordErrors,
    
    // Acciones
    updatePasswordField,
    validatePasswordForm,
    resetPasswordForm,
    
    // Computed
    isPasswordValid: Object.keys(passwordErrors).length === 0
  }
}
