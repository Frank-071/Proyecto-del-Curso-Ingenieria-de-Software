export interface ValidationResult {
  isValid: boolean
  error?: string
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: "Por favor ingresa tu correo electrónico" }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Por favor ingresa un correo electrónico válido" }
  }
  
  return { isValid: true }
}

export interface PasswordValidationResult extends ValidationResult {
  criteria?: {
    hasMinLength: boolean
    hasUpperCase: boolean
    hasLowerCase: boolean
    hasNumber: boolean
  }
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const hasMinLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  
  const isValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber
  
  return {
    isValid,
    error: isValid ? undefined : "La contraseña debe cumplir con todos los criterios",
    criteria: { hasMinLength, hasUpperCase, hasLowerCase, hasNumber }
  }
}

export const validateDocument = (document: string): ValidationResult => {
  const validLengths = [8, 11, 12]
  const lengthLabels: Record<number, string> = {
    8: 'DNI',
    11: 'RUC',
    12: 'CE/Pasaporte'
  }
  
  if (!document.trim()) {
    return { isValid: false, error: "Por favor ingresa tu documento" }
  }
  
  if (!validLengths.includes(document.length)) {
    const labels = Object.values(lengthLabels).join(', ')
    return { 
      isValid: false, 
      error: `Documento inválido. Debe ser ${labels}` 
    }
  }
  
  return { isValid: true }
}

