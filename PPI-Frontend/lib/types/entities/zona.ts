export interface ZonaRequest {
  evento_id: number
  nombre: string
  descripcion: string
  precio: number
  stock_entradas: number
  entradas_disponible: number // Cambio: sin 's' al final según documentación
}

export interface ZonaResponse {
  id: number
  evento_id: number
  nombre: string
  descripcion: string
  precio: number
  stock_entradas: number
  entradas_disponible: number
}