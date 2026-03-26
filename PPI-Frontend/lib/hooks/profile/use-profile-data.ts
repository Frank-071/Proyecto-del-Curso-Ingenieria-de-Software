import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { profileService } from "@/lib/api/services/profile"
import { useUserStore } from "@/lib/stores/user-store"
import type { 
  ProfileData, 
  ProfileUpdateData, 
  PasswordUpdateData,
  LoadingState 
} from "@/lib/types/perfil/micuenta"

export function useProfileData(userId: string) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState<LoadingState>("idle")
  const [updating, setUpdating] = useState<LoadingState>("idle")
  const [passwordUpdating, setPasswordUpdating] = useState<LoadingState>("idle")

  // Cargar datos del perfil
  const loadProfile = useCallback(async () => {
    if (!userId) return

    setLoading("loading")
    try {
      const response = await profileService.getProfile(userId)
      setProfileData(response.data)
      setLoading("success")
    } catch (error) {
      console.error("Error loading profile:", error)
      setLoading("error")
      toast.error("Error", {
        description: error instanceof Error ? error.message : "No se pudo cargar el perfil"
      })
    }
  }, [userId])

  // Actualizar datos del perfil
  const updateProfile = useCallback(async (data: ProfileUpdateData) => {
    if (!userId) return

    setUpdating("loading")
    try {
      const response = await profileService.updateProfile(userId, data)
      setProfileData(response.data)
      setUpdating("success")
      toast.success("Éxito", {
        description: "Tus datos han sido actualizados correctamente"
      })
      
      if (data.email && data.email !== profileData?.email) {
        useUserStore.getState().updateUserEmail(data.email)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setUpdating("error")
      toast.error("Error", {
        description: error instanceof Error ? error.message : "No se pudo actualizar el perfil"
      })
      throw error
    }
  }, [userId, profileData?.email])

  // Cambiar contraseña
  const updatePassword = useCallback(async (data: PasswordUpdateData) => {
    if (!userId) return

    setPasswordUpdating("loading")
    try {
      await profileService.updatePassword(userId, data)
      setPasswordUpdating("success")
      toast.success("Éxito", {
        description: "Tu contraseña ha sido actualizada correctamente"
      })
    } catch (error) {
      console.error("Error updating password:", error)
      setPasswordUpdating("error")
      toast.error("Error", {
        description: error instanceof Error ? error.message : "No se pudo cambiar la contraseña"
      })
      throw error
    }
  }, [userId])

  // Desactivar cuenta
  const deactivateAccount = useCallback(async () => {
    if (!userId) return

    try {
      await profileService.deactivateAccount(userId)
      toast.success("Éxito", {
        description: "Podrás reactivarla iniciando sesión nuevamente"
      })
    } catch (error) {
      console.error("Error deactivating account:", error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "No se pudo desactivar la cuenta"
      })
      throw error
    }
  }, [userId])

  // Eliminar cuenta permanentemente
  const deleteAccount = useCallback(async () => {
    if (!userId) return

    try {
      await profileService.deleteAccount(userId)
      toast.success("Éxito", {
        description: "Procesaremos la eliminación de tu cuenta"
      })
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "No se pudo eliminar la cuenta"
      })
      throw error
    }
  }, [userId])

  // Cargar datos al montar el componente
  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Reset loading states después de un tiempo
  useEffect(() => {
    if (updating === "success" || updating === "error") {
      const timer = setTimeout(() => setUpdating("idle"), 2000)
      return () => clearTimeout(timer)
    }
  }, [updating])

  useEffect(() => {
    if (passwordUpdating === "success" || passwordUpdating === "error") {
      const timer = setTimeout(() => setPasswordUpdating("idle"), 2000)
      return () => clearTimeout(timer)
    }
  }, [passwordUpdating])

  return {
    // Data
    profileData,
    
    // Loading states
    loading,
    updating,
    passwordUpdating,
    
    // Actions
    loadProfile,
    updateProfile,
    updatePassword,
    deactivateAccount,
    deleteAccount,
    
    // Computed
    isLoading: loading === "loading",
    isUpdating: updating === "loading",
    isPasswordUpdating: passwordUpdating === "loading",
    hasError: loading === "error"
  }
}
