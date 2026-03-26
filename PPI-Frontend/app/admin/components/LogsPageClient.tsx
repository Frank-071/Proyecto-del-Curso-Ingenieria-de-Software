"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AdminPageHeader } from "./AdminPageHeader"
import { LogsFilters, ALL_OPTION_VALUE } from "./LogsFilters"
import { LogsExportCard } from "./LogsExportCard"
import { LogsTable } from "./LogsTable"
import { AdminPagination } from "./AdminPagination"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { getLogErrors, exportLogErrors } from "@/lib/api/auditoria"
import { useToast } from "@/components/ui/use-toast"
import type {
  LogErrorFilters,
  LogErrorItem,
  LogExportFormat,
  LogExportParams,
  LogTipoError,
  LogModuloSistema,
} from "@/lib/types/auditoria/logs"
import type { PaginationMetadata } from "@/lib/types/shared/api-responses"

const PAGE_SIZE = 20

const toIsoDate = (value: string, endOfDay = false) => {
  if (!value) return undefined
  return `${value}T${endOfDay ? "23:59:59" : "00:00:00"}Z`
}

export function LogsPageClient() {
  const [logs, setLogs] = useState<LogErrorItem[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null)
  const [page, setPage] = useState(1)
  const [tipoError, setTipoError] = useState<LogTipoError | typeof ALL_OPTION_VALUE>(ALL_OPTION_VALUE)
  const [modulo, setModulo] = useState<LogModuloSistema | typeof ALL_OPTION_VALUE>(ALL_OPTION_VALUE)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [usuarioId, setUsuarioId] = useState("")
  const [exportFormat, setExportFormat] = useState<LogExportFormat>("csv")
  const [refreshToken, setRefreshToken] = useState(0)

  const { toast } = useToast()

  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1))
  }, [tipoError, modulo, fechaDesde, fechaHasta, searchTerm, usuarioId])

  const parsedUsuarioId = useMemo(() => {
    const numeric = Number(usuarioId)
    return Number.isNaN(numeric) || numeric <= 0 ? undefined : numeric
  }, [usuarioId])

  const filtersPayload = useMemo(() => {
    const payload: LogErrorFilters = {
      skip: Math.max(0, (page - 1) * PAGE_SIZE),
      limit: PAGE_SIZE,
    }

    if (tipoError !== ALL_OPTION_VALUE) payload.tipo_error = tipoError
    if (modulo !== ALL_OPTION_VALUE) payload.modulo = modulo
    if (searchTerm) payload.busqueda = searchTerm
    if (fechaDesde) payload.fecha_desde = toIsoDate(fechaDesde)
    if (fechaHasta) payload.fecha_hasta = toIsoDate(fechaHasta, true)
    if (parsedUsuarioId) payload.usuario_id = parsedUsuarioId

    return payload
  }, [page, tipoError, modulo, searchTerm, fechaDesde, fechaHasta, parsedUsuarioId])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getLogErrors(filtersPayload)
      setLogs(response.data ?? [])
      setPagination(response.pagination)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar los logs'
      setError(message)
      setLogs([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [filtersPayload])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs, refreshToken])

  const handleExport = async () => {
    setExporting(true)
    try {
      const exportFilters: LogExportParams = {
        formato: exportFormat,
        tipo_error: tipoError === ALL_OPTION_VALUE ? undefined : tipoError,
        modulo: modulo === ALL_OPTION_VALUE ? undefined : modulo,
        busqueda: searchTerm || undefined,
        fecha_desde: fechaDesde ? toIsoDate(fechaDesde) : undefined,
        fecha_hasta: fechaHasta ? toIsoDate(fechaHasta, true) : undefined,
        usuario_id: parsedUsuarioId,
      }

      const file = await exportLogErrors(exportFilters)
      const url = URL.createObjectURL(file.blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = file.filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)

      toast({
        title: "Exportación lista",
        description: `Se descargó ${file.filename}`,
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo exportar",
        description: err instanceof Error ? err.message : 'Intenta nuevamente en unos minutos.',
      })
    } finally {
      setExporting(false)
    }
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setSearchInput("")
    setTipoError(ALL_OPTION_VALUE)
    setModulo(ALL_OPTION_VALUE)
    setFechaDesde("")
    setFechaHasta("")
    setUsuarioId("")
  }

  const hasActiveFilters = Boolean(
    searchTerm || tipoError !== ALL_OPTION_VALUE || modulo !== ALL_OPTION_VALUE || fechaDesde || fechaHasta || usuarioId
  )

  const handleManualRefresh = () => {
    setRefreshToken((prev) => prev + 1)
  }

  const handleSearchSubmit = () => {
    const normalized = searchInput.trim()
    setSearchInput(normalized)
    setSearchTerm((prev) => (prev === normalized ? prev : normalized))
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <Link href="/admin" className="shrink-0">
          <Button
            size="icon"
            className="bg-primary hover:bg-primary/90 cursor-pointer h-10 w-10 border-0"
            title="Volver al panel"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </Link>
        <div className="flex-1">
          <AdminPageHeader
            title="Logs de errores"
            description="Consulta, filtra y exporta los eventos de error registrados en el backend."
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(240px,1fr)]">
        <LogsFilters
          searchTerm={searchInput}
          onSearchTermChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
          tipoError={tipoError}
          onTipoErrorChange={setTipoError}
          modulo={modulo}
          onModuloChange={setModulo}
          fechaDesde={fechaDesde}
          onFechaDesdeChange={setFechaDesde}
          fechaHasta={fechaHasta}
          onFechaHastaChange={setFechaHasta}
          usuarioId={usuarioId}
          onUsuarioIdChange={(value) => setUsuarioId(value.replace(/[^0-9]/g, ""))}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          disableControls={loading}
        />

        <LogsExportCard
          exportFormat={exportFormat}
          onExportFormatChange={setExportFormat}
          onExport={handleExport}
          exporting={exporting}
          disableControls={loading}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al cargar los datos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-start">
        <Card className="w-full lg:max-w-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Resumen de resultados</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-muted/40 bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">Registros totales</p>
            <p className="text-2xl font-semibold">{pagination?.total ?? 0}</p>
          </div>
          <div className="rounded-lg border border-muted/40 bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">Página actual</p>
            <p className="text-xl font-semibold">{pagination?.currentPage ?? 1}</p>
          </div>
          <div className="rounded-lg border border-muted/40 bg-muted/30 p-4 flex items-center justify-center">
            <Button variant="outline" onClick={handleManualRefresh} disabled={loading} className="gap-2 w-full sm:w-auto">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardContent>
        </Card>
      </div>

      <LogsTable logs={logs} loading={loading} />

      {pagination && (
        <AdminPagination
          pagination={pagination}
          onPageChange={setPage}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => (pagination.hasNext ? prev + 1 : prev))}
          showIfSinglePage
        />
      )}
    </div>
  )
}
