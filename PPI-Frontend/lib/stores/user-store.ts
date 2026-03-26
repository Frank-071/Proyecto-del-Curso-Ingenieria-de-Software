"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { type UserRank, type UserProfile, type SavedPaymentMethod, type PurchasedTicket } from "@/lib/types/auth"
import { tokenUtils } from "@/lib/auth/token"

interface UserStore {
  user: UserProfile | null
  logout: () => void
  setUser: (user: UserProfile) => void
  addPoints: (points: number) => void
  usePoints: (points: number) => boolean
  calculateRank: (totalPoints: number) => { rank: UserRank; discount: number }
  getRankBenefits: (rank: UserRank) => { discount: number; benefits: string[] }
  updateProfileImage: (url: string | null) => void
  updateUserEmail: (email: string) => void
  savePaymentMethod: (method: Omit<SavedPaymentMethod, "id" | "createdAt">) => void
  removePaymentMethod: (methodId: string) => void
  setDefaultPaymentMethod: (methodId: string) => void
  addPurchasedTickets: (tickets: Omit<PurchasedTicket, "id">[]) => void
  markTicketAsUsed: (ticketId: string) => void
  getValidTickets: () => PurchasedTicket[]
  getExpiredTickets: () => PurchasedTicket[]
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,

      logout: () => {
        set({
          user: null,
        })
      },

      setUser: (user) => set({ user }),

      updateProfileImage: (url) => {
        const currentUser = get().user
        if (!currentUser) return

        set({
          user: {
            ...currentUser,
            profileImage: url,
          },
        })
      },

      updateUserEmail: (email) => {
        const currentUser = get().user
        if (!currentUser) return

        set({
          user: {
            ...currentUser,
            email,
          },
        })
      },

      addPoints: (points) => {
        const currentUser = get().user
        if (!currentUser) return

        const newTotalPoints = currentUser.totalPointsEarned + points
        const newCurrentPoints = currentUser.currentPoints + points
        const { rank, discount } = get().calculateRank(newTotalPoints)

        set({
          user: {
            ...currentUser,
            currentPoints: newCurrentPoints,
            totalPointsEarned: newTotalPoints,
            rank,
            rankDiscount: discount,
          },
        })
      },

      usePoints: (points) => {
        const currentUser = get().user
        if (!currentUser || currentUser.currentPoints < points) return false

        set({
          user: {
            ...currentUser,
            currentPoints: currentUser.currentPoints - points,
          },
        })
        return true
      },

      calculateRank: (totalPoints) => {
        if (totalPoints >= 10000) return { rank: "platino" as UserRank, discount: 25 }
        if (totalPoints >= 5000) return { rank: "oro" as UserRank, discount: 15 }
        if (totalPoints >= 2000) return { rank: "plata" as UserRank, discount: 10 }
        return { rank: "bronce" as UserRank, discount: 5 }
      },

      getRankBenefits: (rank) => {
        const benefits = {
          bronce: { discount: 5, benefits: ["5% descuento en compras"] },
          plata: { discount: 10, benefits: ["10% descuento en compras", "Acceso a preventas"] },
          oro: { discount: 15, benefits: ["15% descuento en compras", "Acceso a preventas", "Promociones exclusivas"] },
          platino: {
            discount: 25,
            benefits: [
              "25% descuento en compras",
              "Acceso VIP a preventas",
              "Promociones exclusivas",
              "Soporte prioritario",
            ],
          },
        }
        return benefits[rank]
      },

      savePaymentMethod: (method) => {
        const currentUser = get().user
        if (!currentUser) return

        const newMethod: SavedPaymentMethod = {
          ...method,
          id: `pm-${Date.now()}`,
          createdAt: new Date(),
        }

        if (currentUser.savedPaymentMethods.length === 0 || method.isDefault) {
          currentUser.savedPaymentMethods.forEach((pm) => (pm.isDefault = false))
        }

        set({
          user: {
            ...currentUser,
            savedPaymentMethods: [...currentUser.savedPaymentMethods, newMethod],
          },
        })
      },

      removePaymentMethod: (methodId) => {
        const currentUser = get().user
        if (!currentUser) return

        set({
          user: {
            ...currentUser,
            savedPaymentMethods: currentUser.savedPaymentMethods.filter((pm) => pm.id !== methodId),
          },
        })
      },

      setDefaultPaymentMethod: (methodId) => {
        const currentUser = get().user
        if (!currentUser) return

        const updatedMethods = currentUser.savedPaymentMethods.map((pm) => ({
          ...pm,
          isDefault: pm.id === methodId,
        }))

        set({
          user: {
            ...currentUser,
            savedPaymentMethods: updatedMethods,
          },
        })
      },

      addPurchasedTickets: (tickets) => {
        const currentUser = get().user
        if (!currentUser) return

        const newTickets: PurchasedTicket[] = tickets.map((ticket) => ({
          ...ticket,
          id: `ticket-${Date.now()}-${Math.random()}`,
        }))

        set({
          user: {
            ...currentUser,
            purchasedTickets: [...currentUser.purchasedTickets, ...newTickets],
          },
        })
      },

      markTicketAsUsed: (ticketId) => {
        const currentUser = get().user
        if (!currentUser) return

        const updatedTickets = currentUser.purchasedTickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, isUsed: true, canTransfer: false } : ticket,
        )

        set({
          user: {
            ...currentUser,
            purchasedTickets: updatedTickets,
          },
        })
      },

      getValidTickets: () => {
        const currentUser = get().user
        if (!currentUser) return []

        const now = new Date()
        return currentUser.purchasedTickets.filter((ticket) => !ticket.isUsed && new Date(ticket.eventDate) > now)
      },

      getExpiredTickets: () => {
        const currentUser = get().user
        if (!currentUser) return []

        const now = new Date()
        return currentUser.purchasedTickets.filter((ticket) => ticket.isUsed || new Date(ticket.eventDate) <= now)
      },
    }),
    {
      name: "user-storage-v3", // Incrementado para forzar reset de datos corruptos
    },
  ),
)
