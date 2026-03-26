"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import type { LogModuloSistema, LogTipoError } from "@/lib/types/auditoria/logs"

export const ALL_OPTION_VALUE = "all" as const

const tipoErrorOptions: { value: LogTipoError; label: string }[] = [
  { value: "DATABASE", label: "Base de datos" },
  { value: "API", label: "API" },
  { value: "VALIDATION", label: "Validación" },
  { value: "AUTHENTICATION", label: "Autenticación" },
  { value: "AUTHORIZATION", label: "Autorización" },
  { value: "SYSTEM", label: "Sistema" },
]

const moduloOptions: { value: LogModuloSistema; label: string }[] = [
  { value: "EVENTOS", label: "Eventos" },
  { value: "ZONAS", label: "Zonas" },
  { value: "LOCALES", label: "Locales" },
  { value: "USUARIOS", label: "Usuarios" },
  { value: "ENTRADAS", label: "Entradas" },
  { value: "PAGOS", label: "Pagos" },
  { value: "SISTEMA", label: "Sistema" },
]

interface LogsFiltersProps {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  onSearchSubmit: () => void
  tipoError: LogTipoError | typeof ALL_OPTION_VALUE
  onTipoErrorChange: (value: LogTipoError | typeof ALL_OPTION_VALUE) => void
  modulo: LogModuloSistema | typeof ALL_OPTION_VALUE
  onModuloChange: (value: LogModuloSistema | typeof ALL_OPTION_VALUE) => void
  fechaDesde: string
  onFechaDesdeChange: (value: string) => void
  fechaHasta: string
  onFechaHastaChange: (value: string) => void
  usuarioId: string
  onUsuarioIdChange: (value: string) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  disableControls?: boolean
}

export function LogsFilters({
  searchTerm,
  onSearchTermChange,
  onSearchSubmit,
  tipoError,
  onTipoErrorChange,
  modulo,
  onModuloChange,
  fechaDesde,
  onFechaDesdeChange,
  fechaHasta,
  onFechaHastaChange,
  usuarioId,
  onUsuarioIdChange,
  onClearFilters,
  hasActiveFilters,
  disableControls,
}: LogsFiltersProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-2 lg:col-span-2">
            <Label className="text-sm font-medium text-muted-foreground">Búsqueda</Label>
            <div className="mt-1 flex gap-2">
              <Input
                placeholder="Busca por descripción o detalle"
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    onSearchSubmit()
                  }
                }}
                disabled={disableControls}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={onSearchSubmit}
                disabled={disableControls}
                variant="outline"
                className="gap-2 shrink-0"
              >
                <Search className="w-4 h-4" />
                Buscar
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Tipo de error</Label>
            <Select
              value={tipoError}
              onValueChange={(value) => onTipoErrorChange(value as LogTipoError | typeof ALL_OPTION_VALUE)}
              disabled={disableControls}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTION_VALUE}>Todos</SelectItem>
                {tipoErrorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Módulo</Label>
            <Select
              value={modulo}
              onValueChange={(value) => onModuloChange(value as LogModuloSistema | typeof ALL_OPTION_VALUE)}
              disabled={disableControls}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTION_VALUE}>Todos</SelectItem>
                {moduloOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Desde</Label>
            <Input
              type="date"
              value={fechaDesde}
              onChange={(event) => onFechaDesdeChange(event.target.value)}
              disabled={disableControls}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Hasta</Label>
            <Input
              type="date"
              value={fechaHasta}
              onChange={(event) => onFechaHastaChange(event.target.value)}
              disabled={disableControls}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">ID de usuario</Label>
            <Input
              type="number"
              min={1}
              placeholder="Ej. 1024"
              value={usuarioId}
              onChange={(event) => onUsuarioIdChange(event.target.value)}
              disabled={disableControls}
              className="mt-1"
            />
          </div>

          <div className="flex items-end justify-end">
            <Button
              variant="ghost"
              type="button"
              onClick={onClearFilters}
              disabled={!hasActiveFilters || disableControls}
              className="text-muted-foreground hover:text-foreground"
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
