export type UserRank = "bronce" | "plata" | "oro" | "platino"

export interface SavedPaymentMethod {
  id: string
  type: "card" | "qr"
  cardNumber?: string
  cardHolder?: string
  expiryDate?: string
  isDefault: boolean
  createdAt: Date
}

export interface PurchasedTicket {
  id: string
  eventId: string
  eventName: string
  eventDate: Date
  eventImage: string
  ticketType: string
  zone: string
  quantity: number
  price: number
  purchaseDate: Date
  isUsed: boolean
  canTransfer: boolean
}

export interface UserProfile {
  id: string
  name: string
  email: string
  currentPoints: number
  totalPointsEarned: number
  rank: UserRank
  rankDiscount: number
  profileImage?: string | null
  savedPaymentMethods: SavedPaymentMethod[]
  purchasedTickets: PurchasedTicket[]
}

