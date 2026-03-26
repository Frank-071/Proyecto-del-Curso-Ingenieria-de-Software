export interface UploadPhotoResponse {
  success: boolean
  message: string
  data: {
    url: string
    filename: string
  }
}

export interface GetPhotoResponse {
  success: boolean
  message: string
  data: {
    url: string | null
  }
}

export interface DeletePhotoResponse {
  success: boolean
  message: string
}

export interface ApiResponse {
  success: boolean
  message: string
}

// Interfaces genéricas para responses de API
export interface ApiSuccessResponse<T> {
  success: true
  message?: string
  data: T
}

export interface ApiErrorResponse {
  success: false
  detail: string
  message?: string
}

export type ApiResult<T> = ApiSuccessResponse<T> | ApiErrorResponse

// Paginación
export interface PaginationMetadata {
  skip: number
  limit: number
  total: number
  hasNext: boolean
  hasPrev: boolean
  currentPage: number
  totalPages: number
}

export interface PaginatedApiResponse<T> {
  success: boolean
  message: string
  data: T[]
  pagination: PaginationMetadata
}

// Response para listas simples
export interface ListApiResponse<T> {
  success: boolean
  message: string
  data: T[]
}

