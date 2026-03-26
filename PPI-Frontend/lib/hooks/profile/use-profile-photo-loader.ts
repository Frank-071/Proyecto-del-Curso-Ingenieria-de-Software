import { useState, useEffect, useRef } from 'react'
import { userService } from '@/lib/api/services/auth'
import { useUserStore } from '@/lib/stores/user-store'

export function useProfilePhotoLoader(userId: string | undefined) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)
  
  const profileImage = useUserStore(state => state.user?.profileImage)
  const updateProfileImage = useUserStore(state => state.updateProfileImage)

  useEffect(() => {
    const loadPhoto = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      if (profileImage && !profileImage.includes('?t=')) {
        setLoading(false)
        return
      }

      try {
        const response = await userService.getProfilePhoto(userId)
        if (response.data.url) {
          updateProfileImage(response.data.url)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al cargar foto'
        setError(errorMsg)
        console.error('Error al cargar foto de perfil:', err)
      } finally {
        setLoading(false)
      }
    }

    if (!initialized.current) {
      initialized.current = true
      loadPhoto()
    }
  }, [userId])

  return { loading, error }
}

