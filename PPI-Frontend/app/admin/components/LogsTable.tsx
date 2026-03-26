"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { LogErrorItem, LogModuloSistema, LogTipoError } from "@/lib/types/auditoria/logs"

interface LogsTableProps {
  logs: LogErrorItem[]
  loading: boolean
}

const tipoErrorStyles: Record<LogTipoError, string> = {
  DATABASE: "bg-rose-100 text-rose-700",
  API: "bg-sky-100 text-sky-700",
  VALIDATION: "bg-amber-100 text-amber-700",
  AUTHENTICATION: "bg-indigo-100 text-indigo-700",
  AUTHORIZATION: "bg-purple-100 text-purple-700",
  SYSTEM: "bg-slate-200 text-slate-800",
}

const moduloStyles: Record<LogModuloSistema, string> = {
  EVENTOS: "bg-emerald-100 text-emerald-700",
  ZONAS: "bg-lime-100 text-lime-700",
  LOCALES: "bg-blue-100 text-blue-700",
  USUARIOS: "bg-teal-100 text-teal-700",
  ENTRADAS: "bg-orange-100 text-orange-700",
  PAGOS: "bg-pink-100 text-pink-700",
  SISTEMA: "bg-gray-200 text-gray-800",
}

const formatDateTime = (value: string) => {
  if (!value) return "";
  return new Date(value).toLocaleString("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function LogsTable({ logs, loading }: LogsTableProps) {
  const hasData = logs.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registros encontrados ({logs.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ minWidth: 140 }}>Fecha</TableHead>
                  <TableHead style={{ minWidth: 130 }}>Tipo</TableHead>
                  <TableHead style={{ minWidth: 130 }}>Módulo</TableHead>
                  <TableHead style={{ minWidth: 220 }}>Descripción</TableHead>
                  <TableHead style={{ minWidth: 200 }}>Usuario</TableHead>
                  <TableHead style={{ minWidth: 200 }}>Correo</TableHead>
                  <TableHead style={{ minWidth: 200 }}>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading &&
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      {Array.from({ length: 7 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {!loading && hasData &&
                  logs.map((log) => {
                    const detalles = log.detalles_adicionales
                      ? JSON.stringify(log.detalles_adicionales)
                      : null

                    return (
                      <TableRow key={log.log_id}>
                        <TableCell className="font-medium">{formatDateTime(log.timestamp)}</TableCell>
                        <TableCell>
                          <Badge className={`${tipoErrorStyles[log.tipo_error]} font-semibold`}>{log.tipo_error}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${moduloStyles[log.modulo]} font-semibold`}>{log.modulo}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground line-clamp-2" title={log.descripcion_tecnica}>
                            {log.descripcion_tecnica}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">
                            {log.usuario_nombres || "No asignado"}
                          </p>
                          <p className="text-xs text-muted-foreground">ID: {log.usuario_id ?? "—"}</p>
                        </TableCell>
                        <TableCell>
                          {log.usuario_email ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm text-foreground line-clamp-1 cursor-help">
                                  {log.usuario_email}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{log.usuario_email}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {detalles ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs font-mono line-clamp-2 block cursor-help">
                                  {detalles}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-lg">
                                <pre className="text-xs whitespace-pre-wrap break-words">
                                  {JSON.stringify(log.detalles_adicionales, null, 2)}
                                </pre>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-sm text-muted-foreground">Sin detalles</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}

                {!loading && !hasData && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      No se encontraron registros con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  )
}
