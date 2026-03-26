import { apiRequest, buildApiUrl } from '../config'
import type { ProfileData, ProfileUpdateData, PasswordUpdateData } from '@/lib/types/perfil/micuenta'
import type { ApiResponse } from '@/lib/types/shared/api-responses'

export interface ProfileResponse extends ApiResponse {
  data: ProfileData
}

export interface ProfileUpdateResponse extends ApiResponse {
  data: ProfileData
}

export interface PasswordUpdateResponse extends ApiResponse {
  data: { message: string }
}

export const profileService = {
  async getProfile(userId: string): Promise<ProfileResponse> {
    const url = buildApiUrl(`/clientes/${userId}/perfil`)
    return await apiRequest(url)
  },

  async updateProfile(userId: string, data: ProfileUpdateData): Promise<ProfileUpdateResponse> {
    const url = buildApiUrl(`/clientes/${userId}/perfil`)
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  async updatePassword(userId: string, data: PasswordUpdateData): Promise<PasswordUpdateResponse> {
    const url = buildApiUrl(`/clientes/${userId}/password`)
    return await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify({
        current_password: data.current_password,
        new_password: data.new_password
      })
    })
  },

  async deactivateAccount(userId: string): Promise<ApiResponse> {
    const url = buildApiUrl(`/clientes/${userId}/deactivate`)
    return await apiRequest(url, {
      method: 'POST'
    })
  },

  async deleteAccount(userId: string): Promise<ApiResponse> {
    const url = buildApiUrl(`/clientes/${userId}/delete`)
    return await apiRequest(url, {
      method: 'DELETE'
    })
  }
}
