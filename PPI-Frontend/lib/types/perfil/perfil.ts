import { UserRank } from "../auth/user"

// Tipos para el perfil del cliente
export interface ProximoEvento {
  nombre: string
  fecha: string
  hora: string
}

export interface UserInfoPanelProps {
  userId: string
  email: string
  currentPoints: number
  rank: UserRank
  validTicketsCount: number
  profileImage?: string | null
  proximoEvento: ProximoEvento | null
  pointsLoading: boolean
}

export interface UserStatsCardsProps {
  totalPointsEarned: number
  discount: number
  totalTickets: number
  pointsLoading: boolean
}

