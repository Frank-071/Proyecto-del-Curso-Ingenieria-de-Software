// Tipos para la página Mi Cuenta

export interface ProfileData {
  nombres: string | null
  apellidos: string | null
  email: string
  genero: string | null
  telefono: string | null
  numero_documento: string
  tipo_documento_nombre: string
  recibir_informacion_eventos?: boolean
}

export interface ProfileUpdateData {
  nombres?: string
  apellidos?: string
  email?: string
  genero?: string
  telefono?: string
  recibir_informacion_eventos?: boolean
}

export interface ProfileFormData {
  nombres: string
  apellidos: string
  email: string
  genero: string
  telefono: string
  recibir_informacion_eventos: boolean
}

export interface PasswordUpdateData {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface ProfileFormErrors {
  nombres?: string
  apellidos?: string
  email?: string
  genero?: string
  telefono?: string
}

export interface PasswordFormErrors {
  current_password?: string
  new_password?: string
  confirm_password?: string
}

export type LoadingState = "idle" | "loading" | "success" | "error"

export type GeneroOption = "Masculino" | "Femenino" | "Prefiero no especificar"

export const GENERO_OPTIONS: GeneroOption[] = [
  "Masculino",
  "Femenino", 
  "Prefiero no especificar"
]

// Props para componentes
export interface ProfileFormProps {
  initialData?: ProfileData
  onSubmit: (data: ProfileUpdateData) => Promise<void>
  loading?: boolean
  errors?: ProfileFormErrors
}

export interface PasswordFormProps {
  onSubmit: (data: PasswordUpdateData) => Promise<void>
  loading?: boolean
  errors?: PasswordFormErrors
}

export interface DeleteAccountProps {
  onDelete: () => Promise<void>
  onDeactivate: () => Promise<void>
  loading?: boolean
}
