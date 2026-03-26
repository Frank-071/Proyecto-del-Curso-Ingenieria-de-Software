"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import type { LogExportFormat } from "@/lib/types/auditoria/logs"

interface LogsExportCardProps {
  exportFormat: LogExportFormat
  onExportFormatChange: (value: LogExportFormat) => void
  onExport: () => void
  exporting: boolean
  disableControls?: boolean
}

export function LogsExportCard({
  exportFormat,
  onExportFormatChange,
  onExport,
  exporting,
  disableControls,
}: LogsExportCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Exportación de logs</CardTitle>
        <p className="text-sm text-muted-foreground">
          Descarga los registros aplicando los filtros activos.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Formato</Label>
          <Select
            value={exportFormat}
            onValueChange={(value) => onExportFormatChange(value as LogExportFormat)}
            disabled={disableControls || exporting}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          onClick={onExport}
          disabled={disableControls || exporting}
          className="w-full gap-2"
        >
          <Download className={`w-4 h-4 ${exporting ? "animate-bounce" : ""}`} />
          {exporting ? "Generando archivo..." : "Exportar"}
        </Button>

        <p className="text-xs text-muted-foreground">
          La exportación incluye todos los filtros aplicados y respeta el orden actual.
        </p>
      </CardContent>
    </Card>
  )
}
