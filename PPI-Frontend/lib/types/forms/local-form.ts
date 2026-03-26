import { DepartamentoResponse } from '../entities/departamento'
import { ProvinciaResponse } from '../entities/provincia'
import { DistritoResponse } from '../entities/distrito'
import { TipoLocalResponse } from '../entities/tipo-local'

export interface LocalFormData {
  nombre: string
  direccion: string
  departamento: string
  provincia: string
  distrito: string
  capacidad: string
  tipo: string
  estado: boolean
  latitud?: number | null
  longitud?: number | null
}

export interface LocalFormErrors {
  departamento: string
  provincia: string
  distrito: string
  tipo: string
}

export interface LocalFormDependencies {
  departamentos: DepartamentoResponse[]
  provincias: ProvinciaResponse[]
  distritos: DistritoResponse[]
  tiposLocales: TipoLocalResponse[]
  todasLasProvincias: ProvinciaResponse[]
  todosLosDistritos: DistritoResponse[]
}

export type LocalPageMode = 'create' | 'edit' | 'view'

// Props para los componentes
export interface LocalBasicoCardProps {
  formData: Pick<LocalFormData, 'nombre' | 'capacidad' | 'tipo'>
  tiposLocales: TipoLocalResponse[]
  errors: Pick<LocalFormErrors, 'tipo'>
  pageMode: LocalPageMode
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectChange: (name: string, value: string) => void
  onErrorClear: (field: string) => void
  errorNombre: string
  maxLengthNombre: number
}

export interface LocalUbicacionCardProps {
  formData: Pick<LocalFormData, 'departamento' | 'provincia' | 'distrito'>
  departamentos: DepartamentoResponse[]
  provincias: ProvinciaResponse[]
  distritos: DistritoResponse[]
  errors: Pick<LocalFormErrors, 'departamento' | 'provincia' | 'distrito'>
  pageMode: LocalPageMode
  onSelectChange: (name: string, value: string) => void
  onErrorClear: (field: string) => void
  onDepartamentoChange?: (departamentoId: string) => void
  onProvinciaChange?: (provinciaId: string) => void
}

export interface LocalEstadoCardProps {
  formData: Pick<LocalFormData, 'estado'>
  pageMode: LocalPageMode
  onSelectChange: (name: string, value: boolean) => void
}

export interface LocalDireccionCardProps {
  formData: Pick<LocalFormData, 'direccion'>
  pageMode: LocalPageMode
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onErrorClear: (field: string) => void
  errorDireccion: string
  maxLengthDireccion: number
}

export interface LocalFormFooterProps {
  pageMode: LocalPageMode
  isLoading: boolean
}

export interface LocalDataFromAPI {
  nombre?: string
  direccion?: string
  departamento?: string
  provincia?: string
  distrito?: string
  capacidad?: string
  tipo?: string
  estado?: boolean
  latitud?: number | null
  longitud?: number | null
}

