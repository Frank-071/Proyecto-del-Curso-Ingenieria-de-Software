import { Badge } from "@/components/ui/badge"
import { Crown, Star } from "lucide-react"

interface UserPointsCardProps {
  rank: string
  rankDiscount: number
  currentPoints: number
}

export function UserPointsCard({ rank, rankDiscount, currentPoints }: UserPointsCardProps) {
  const getRankIcon = (rank: string) => {
    switch (rank) {
      case "platino":
        return <Crown className="h-4 w-4 text-purple-500" />
      case "oro":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "plata":
        return <Star className="h-4 w-4 text-gray-400" />
      default:
        return <Star className="h-4 w-4 text-amber-600" />
    }
  }

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "platino":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "oro":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "plata":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-amber-100 text-amber-800 border-amber-200"
    }
  }

  return (
    <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {getRankIcon(rank)}
          <span className="font-medium text-sm sm:text-base">Rango {rank.charAt(0).toUpperCase() + rank.slice(1)}</span>
          <Badge className={`${getRankColor(rank)} text-xs`}>{rankDiscount}% descuento</Badge>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs sm:text-sm text-muted-foreground">Puntos disponibles</p>
          <p className="font-semibold text-sm sm:text-base">{currentPoints.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
