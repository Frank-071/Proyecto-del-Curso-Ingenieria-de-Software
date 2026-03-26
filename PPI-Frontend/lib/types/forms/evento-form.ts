export interface TipoEntrada {
  id: string
  nombre: string
  descripcion: string
  precio: number
  capacidad: number
  zonaAsignada: string
}

export type PageMode = 'create' | 'edit' | 'view'

export interface EventoFormData {
  nombre: string
  descripcion: string
  categoria: string
  organizadores: string
  fechaEvento: Date | undefined
  horaEvento: string
  horaFin: string
  esNominal: boolean
  departamento: string
  provincia: string
  distrito: string
  localId: string
  imagenEvento: string | null
  mapaDistribucion: string | null
  estadoEvento: string
  tiposEntrada: TipoEntrada[]
}

