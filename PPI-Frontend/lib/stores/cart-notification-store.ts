import { create } from 'zustand'

export interface CartNotification {
  id: string
  eventName: string
  zone: string
  quantity: number
  price: number
  visible: boolean
}

interface CartNotificationStore {
  notifications: CartNotification[]
  addNotification: (notification: Omit<CartNotification, 'id' | 'visible'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useCartNotificationStore = create<CartNotificationStore>((set, get) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = `${Date.now()}-${Math.random()}`
    const newNotification: CartNotification = {
      ...notification,
      id,
      visible: true
    }
    
    set({ notifications: [...get().notifications, newNotification] })
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
      set({ 
        notifications: get().notifications.map(n => 
          n.id === id ? { ...n, visible: false } : n
        )
      })
      
      // Remover completamente después de la animación (300ms)
      setTimeout(() => {
        set({ notifications: get().notifications.filter(n => n.id !== id) })
      }, 300)
    }, 3000)
  },
  
  removeNotification: (id) => {
    set({ notifications: get().notifications.filter(n => n.id !== id) })
  },
  
  clearNotifications: () => {
    set({ notifications: [] })
  }
}))

