// Tipo que viene del backend (con 'id')
export interface DistritoBackend {
  id: number
  nombre: string
  provincia_id: number
}

// Tipo normalizado para uso interno del frontend (con 'distrito_id')
export interface Distrito {
  distrito_id: number
  nombre: string
  provincia_id: number
}

// Alias para compatibilidad
export interface DistritoResponse extends Distrito {}

// Función helper para normalizar distrito del backend
export function normalizarDistrito(distrito: DistritoBackend): Distrito {
  return {
    distrito_id: distrito.id,
    nombre: distrito.nombre,
    provincia_id: distrito.provincia_id
  }
}