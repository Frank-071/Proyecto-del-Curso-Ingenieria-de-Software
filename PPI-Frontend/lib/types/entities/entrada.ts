export interface EntradaRequest {
  cliente_id: number
  pago_detalle_id?: number | null
  zona_id: number
  codigo_qr: string | null
  escaneada: boolean
  fecha_escaneo?: string | null
  fecha_creacion?: string
  fue_transferida: boolean
  estado_nominacion: string
  numero_documento_nominado: string
  nombres_nominado: string
  apellidos_nominado: string
  puntos_generados: number
}

export interface EntradaBulkMultiItem {
  zona_id: number
  cantidad: number
}

export interface EntradaBulkMultiRequest {
  cliente_id?: number
  items: EntradaBulkMultiItem[]
  total_entradas_checkout: number
  descuento_total: number
  puntos_canjeados: number
  payment_method?: string
  metodo_pago_id?: number
  descuento_rango?: number
  payment_ref?: string
}

export interface EntradaBulkMultiResponse {
  success: boolean
  entries?: any[]
  points_remaining?: number
  pago_id?: number
  total_pagado?: number
  message?: string
}
