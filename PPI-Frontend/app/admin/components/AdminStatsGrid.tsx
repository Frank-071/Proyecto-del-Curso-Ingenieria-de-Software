import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatCard {
  icon: LucideIcon
  title: string
  value: string | number
  iconColor: string
}

interface AdminStatsGridProps {
  stats: StatCard[]
}

export function AdminStatsGrid({ stats }: AdminStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <Card key={index} className="w-full">
            <CardContent className="p-6">
              <div className="flex items-center">
                <IconComponent className={`h-8 w-8 ${stat.iconColor}`} />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}