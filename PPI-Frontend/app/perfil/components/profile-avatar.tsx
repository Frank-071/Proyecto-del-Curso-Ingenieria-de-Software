"use client"

import { useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Camera, Loader2, X } from "lucide-react"
import { useProfilePhoto } from "@/lib/hooks/profile"
import { getInitials } from "@/lib/utils/user-helpers"
import { getRankStyles, getAvatarStyles } from "@/lib/utils/rank-styles"

interface ProfileAvatarProps {
  userId: string
  email: string
  rank: string
  profileImage?: string | null
}

export function ProfileAvatar({ userId, email, rank, profileImage }: ProfileAvatarProps) {
  const {
    isUploading,
    showDeleteDialog,
    setShowDeleteDialog,
    fileInputRef,
    handlePhotoUpload,
    handleIconClick,
    handleDeleteConfirm,
    triggerFileInput
  } = useProfilePhoto(userId)

  const handleAvatarClick = useCallback(() => {
    if (!isUploading) {
      triggerFileInput()
    }
  }, [isUploading, triggerFileInput])

  const handleActionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!profileImage) {
      triggerFileInput()
      return
    }
    
    handleIconClick(e)
  }, [profileImage, triggerFileInput, handleIconClick])

  return (
    <>
      <div className="flex flex-col items-center text-center">
        <div className="relative group">
          <div
            onClick={handleAvatarClick}
            className={`relative ${isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            role="button"
            tabIndex={0}
            aria-label="Cambiar foto de perfil"
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
                e.preventDefault()
                triggerFileInput()
              }
            }}
          >
            <div className={`w-32 h-32 mb-4 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden transition-opacity ${getAvatarStyles(rank)} ${isUploading ? 'opacity-50' : 'hover:opacity-90'}`}>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(email)
              )}
            </div>

            <button
              onClick={handleActionClick}
              disabled={isUploading}
              className="absolute bottom-4 right-0 rounded-full p-2.5 shadow-lg transition-colors bg-emerald-600 hover:bg-emerald-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={profileImage ? "Eliminar foto de perfil" : "Agregar foto de perfil"}
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : profileImage ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        <Badge className={`mt-2 px-4 py-1.5 text-sm font-bold uppercase tracking-wide ${getRankStyles(rank)}`}>
          ✦ {rank.charAt(0).toUpperCase() + rank.slice(1)} ✦
        </Badge>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar foto de perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente tu foto de perfil. Podrás subir una nueva foto cuando quieras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer hover:bg-gray-100">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 cursor-pointer">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

