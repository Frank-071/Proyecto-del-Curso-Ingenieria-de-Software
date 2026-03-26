import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Gift } from "lucide-react"

interface PointsRedemptionProps {
  usePoints: boolean
  pointsToUse: number
  maxPointsToUse: number
  onUsePointsChange: (value: boolean) => void
  onPointsAmountChange: (value: number) => void
}

export function PointsRedemption({
  usePoints,
  pointsToUse,
  maxPointsToUse,
  onUsePointsChange,
  onPointsAmountChange,
}: PointsRedemptionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
        <Label className="text-sm sm:text-base font-medium">Canjear puntos</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="usePoints"
          checked={usePoints}
          onCheckedChange={(checked) => {
            onUsePointsChange(checked as boolean)
            if (!checked) onPointsAmountChange(0)
          }}
          className="cursor-pointer flex-shrink-0"
        />
        <Label htmlFor="usePoints" className="cursor-pointer text-xs sm:text-sm">Usar mis puntos para descuento</Label>
      </div>
      {usePoints && (
        <div className="space-y-2">
          <Label htmlFor="pointsAmount" className="text-xs sm:text-sm">Cantidad de puntos (máximo {maxPointsToUse.toLocaleString()})</Label>
          <Input
            id="pointsAmount"
            type="number"
            min="0"
            max={maxPointsToUse}
            value={pointsToUse}
            onChange={(e) => onPointsAmountChange(Math.min(Number(e.target.value) || 0, maxPointsToUse))}
            placeholder="0"
            className="w-full"
          />
          <p className="text-xs sm:text-sm text-muted-foreground">
            Descuento: S/{(pointsToUse * 0.1).toFixed(2)} (1 punto = S/0.10)
          </p>
        </div>
      )}
    </div>
  )
}
