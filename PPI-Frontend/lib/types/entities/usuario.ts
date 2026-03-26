export interface UsuarioRequest {
  nombres: string
  apellidos: string
  numero_documento: string
  telefono: string 
  email: string
  activo?: boolean
}

export interface UsuarioResponse {
  id: number
  nombres: string
  apellidos: string
  numero_documento: string
  telefono: string 
  email: string
  activo: boolean
  fecha_creacion: string
}

export interface UsuarioDisplay extends UsuarioResponse {
  nombreCompleto: string
  estado: string
  fechaRegistro: string
}
