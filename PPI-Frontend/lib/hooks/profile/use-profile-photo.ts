import { useState, useRef } from "react"
import { toast } from "sonner"
import { userService } from "@/lib/api/services/auth"
import { useUserStore } from "@/lib/stores/user-store"
import { validateImageFile } from "@/lib/utils/file-validators"

export function useProfilePhoto(userId: string) {
  const [isUploading, setIsUploading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid && validation.error) {
      toast.error(validation.error.title, {
        description: validation.error.description
      })
      return
    }

    setIsUploading(true)

    try {
      const result = await userService.uploadProfilePhoto(userId, file)
      const urlWithTimestamp = `${result.data.url}?t=${Date.now()}`
      useUserStore.getState().updateProfileImage(urlWithTimestamp)
      toast.success('Foto actualizada', {
        description: 'Tu foto de perfil se actualizó correctamente'
      })
    } catch (error) {
      toast.error('Error al subir foto', {
        description: (error as Error).message
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!showDeleteDialog) {
      setShowDeleteDialog(true)
    }
  }

  const handleDeleteConfirm = async () => {
    setShowDeleteDialog(false)
    setIsUploading(true)

    try {
      await userService.deleteProfilePhoto(userId)
      useUserStore.getState().updateProfileImage(null)
      toast.success('Foto eliminada', {
        description: 'Tu foto de perfil se eliminó correctamente'
      })
    } catch (error) {
      toast.error('Error al eliminar foto', {
        description: (error as Error).message
      })
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return {
    isUploading,
    showDeleteDialog,
    setShowDeleteDialog,
    fileInputRef,
    handlePhotoUpload,
    handleIconClick,
    handleDeleteConfirm,
    triggerFileInput
  }
}

