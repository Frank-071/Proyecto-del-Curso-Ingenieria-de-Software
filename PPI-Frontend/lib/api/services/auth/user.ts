import { apiRequest, buildApiUrl } from '../../config'
import { tokenUtils } from '@/lib/auth/token'
import type { UploadPhotoResponse, GetPhotoResponse, DeletePhotoResponse } from '@/lib/types/shared/api-responses'

export const userService = {
  async uploadProfilePhoto(userId: string, file: File): Promise<UploadPhotoResponse> {
    const formData = new FormData()
    formData.append('file', file)
    
    const token = await tokenUtils.getToken()
    if (!token) {
      throw new Error('No hay sesión activa')
    }
    
    const url = buildApiUrl(`/clientes/${userId}/foto-perfil`)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al subir foto' }))
      throw new Error(error.message || 'Error al subir foto')
    }
    
    return response.json()
  },

  async getProfilePhoto(userId: string): Promise<GetPhotoResponse> {
    const token = await tokenUtils.getToken()
    if (!token) {
      throw new Error('No hay sesión activa')
    }
    
    const url = buildApiUrl(`/clientes/${userId}/foto-perfil`)
    
    return await apiRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  async deleteProfilePhoto(userId: string): Promise<DeletePhotoResponse> {
    const token = await tokenUtils.getToken()
    if (!token) {
      throw new Error('No hay sesión activa')
    }
    
    const url = buildApiUrl(`/clientes/${userId}/foto-perfil`)
    
    return await apiRequest(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  }
}

