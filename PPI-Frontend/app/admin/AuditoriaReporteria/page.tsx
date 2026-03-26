"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  Ticket, 
  ArrowRightLeft, 
  AlertTriangle, 
  Filter, 
  Download, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Users,
  MapPin,
  Calendar,
  Star,
  BarChart3,
  RefreshCw,
  Upload
} from "lucide-react"
import Link from "next/link"
import * as XLSX from "xlsx"
import {
  getDashboardCompleto,
  getDatosExportacion,
  obtenerRangoUltimosMeses,
  type DashboardCompleto as DashboardData,
  type DatosExportacion
} from "@/lib/api/auditoria"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
}  from "recharts"

// Tipos ya no necesarios con la API
// type ReportRow = { ... }

// Mock data eliminado - ahora usamos la API real
// const eventos = [ ... ]
// const locales = [ ... ]
// const mockData: ReportRow[] = [ ... ]

const COLORS = ['#2563eb', '#059669', '#7c3aed', '#ea580c', '#0891b2', '#dc2626']

export default function AuditoriaReporteriaPage() {
  // Estados para la API
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  
  // Estados para filtros
  const [mesesPeriodo, setMesesPeriodo] = useState(12)
  const [fechaDesde, setFechaDesde] = useState<string>("")
  const [fechaHasta, setFechaHasta] = useState<string>("")
  
  // Estados para UI
  const [activeTab, setActiveTab] = useState("overview")
  
  // Estados para el carrusel de KPIs
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  // Función para cargar datos del backend
  const cargarDatosDashboard = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Determinar rango de fechas
      let filtros: any = {}
      
      if (fechaDesde && fechaHasta) {
        // Usar fechas personalizadas
        filtros = {
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta
        }
      } else {
        // Usar período de meses
        filtros = obtenerRangoUltimosMeses(mesesPeriodo)
      }

      // Llamar a la API
      const response = await getDashboardCompleto(filtros)

      if (response.success && response.data) {
        setDashboardData(response.data)
      } else {
        setError(response.message || 'Error al cargar los datos')
      }
    } catch (err) {
      console.error('Error cargando dashboard:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    cargarDatosDashboard()
  }, [mesesPeriodo, fechaDesde, fechaHasta])

  // Transformar datos de la API para los gráficos
  const monthlyData = useMemo(() => {
    if (!dashboardData) return []
    
    return dashboardData.datos_mensuales.map(dato => ({
      month: dato.mes_nombre,
      ventas: Number(dato.ventas),
      ventasEstimadas: Number(dato.ventas_estimadas),
      tickets: dato.tickets,
      incidencias: dato.incidencias,
    }))
  }, [dashboardData])

  const topEventos = useMemo(() => {
    if (!dashboardData) return []
    
    return dashboardData.top_eventos.map(evento => ({
      id: evento.id,
      nombre: evento.nombre,
      ventas: Number(evento.ventas),
      tickets: evento.tickets,
    }))
  }, [dashboardData])

  const topUsuarios = useMemo(() => {
    if (!dashboardData) return []
    
    return dashboardData.top_usuarios.map(usuario => ({
      id: usuario.id,
      nombre: usuario.nombre_completo,
      email: usuario.email,
      ventas: Number(usuario.total_compras),
      compras: usuario.cantidad_compras,
      rango_nombre: usuario.rango_nombre,
      puntos_disponibles: usuario.puntos_disponibles,
    }))
  }, [dashboardData])

  const topLocales = useMemo(() => {
    if (!dashboardData) return []
    
    return dashboardData.top_locales.map(local => ({
      id: local.id,
      nombre: local.nombre,
      direccion: local.direccion,
      ventas: Number(local.total_ingresos),
      eventos: local.cantidad_eventos,
    }))
  }, [dashboardData])

  const ventasPorCategoria = useMemo(() => {
    if (!dashboardData) return []
    
    return dashboardData.distribucion_categorias.map(dist => ({
      name: dist.categoria_nombre,
      value: Number(dist.total_ventas),
      eventos: dist.cantidad_eventos,
      porcentaje: dist.porcentaje,
    }))
  }, [dashboardData])

  // Función para determinar la escala apropiada basada en el valor máximo
  const getScaleFormatter = (maxValue: number) => {
    if (maxValue >= 1000000) {
      // Escala en millones
      return {
        format: (value: number) => `${(value / 1000000).toFixed(1)}M`,
        formatCurrency: (value: number) => `S/ ${(value / 1000000).toFixed(1)}M`
      }
    } else if (maxValue >= 1000) {
      // Escala en miles
      return {
        format: (value: number) => `${(value / 1000).toFixed(1)}K`,
        formatCurrency: (value: number) => `S/ ${(value / 1000).toFixed(1)}K`
      }
    } else {
      // Escala normal
      return {
        format: (value: number) => value.toLocaleString('en-US'),
        formatCurrency: (value: number) => `S/ ${value.toLocaleString('en-US')}`
      }
    }
  }

  // Calcular valores máximos para determinar la escala de cada gráfico
  const maxVentas = useMemo(() => {
    if (!monthlyData.length) return 0
    return Math.max(...monthlyData.map(d => Math.max(d.ventas, d.ventasEstimadas)))
  }, [monthlyData])

  const maxTickets = useMemo(() => {
    if (!monthlyData.length) return 0
    return Math.max(...monthlyData.map(d => d.tickets))
  }, [monthlyData])

  // Obtener formateadores basados en los valores máximos
  const ventasFormatter = useMemo(() => getScaleFormatter(maxVentas), [maxVentas])
  const ticketsFormatter = useMemo(() => getScaleFormatter(maxTickets), [maxTickets])

  const formatCurrency = (value: number) => {
    // Formato: coma para miles, punto para decimales (ej: 5,762,756.95)
    return `S/ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPercentage = (value: number) => {
    // Formato consistente: punto para decimales (ej: 137.4%)
    return `${value.toFixed(1)}%`
  }

  // Formato para números grandes en gráficos (K = miles, M = millones)
  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}K`
    }
    return value.toLocaleString('es-PE')
  }

  const formatCurrencyShort = (value: number) => {
    return `S/ ${formatNumber(value)}`
  }

  const toCsv = (rows: (string | number)[][]) =>
    rows
      .map((r) =>
        r
          .map((c) => {
            const s = String(c ?? "")
            const escaped = s.replace(/"/g, '""')
            return `"${escaped}"`
          })
          .join(","),
      )
      .join("\n")

  // Estado para controlar la exportación
  const [isExporting, setIsExporting] = useState(false)

  const exportToExcel = async () => {
    if (isExporting) return
    
    setIsExporting(true)
    
    try {
      // Obtener datos completos del backend (sin límites)
      const rango = obtenerRangoUltimosMeses(mesesPeriodo)
      const response = await getDatosExportacion({
        fecha_desde: rango.fecha_desde,
        fecha_hasta: rango.fecha_hasta
      })
      
      if (!response.success || !response.data) {
        alert("Error al obtener datos para exportación")
        return
      }
      
      const datos = response.data
      
      // Crear libro de Excel
      const wb = XLSX.utils.book_new()
      
      // ==================== HOJA 1: TRANSACCIONES (Detalle) ====================
      // Esta hoja permite calcular todos los KPIs con fórmulas de Excel
      const transaccionesData = datos.transacciones.map((t) => ({
        pago_id: t.pago_id,
        cliente_id: t.cliente_id,
        cliente_nombre: t.cliente_nombre,
        evento_id: t.evento_id,
        evento_nombre: t.evento_nombre,
        fecha_transaccion: t.fecha_transaccion.split('T')[0], // Solo YYYY-MM-DD
        total: Number(t.total),
        metodo_pago: t.metodo_pago,
        cantidad_tickets: t.cantidad_tickets
      }))
      const wsTransacciones = XLSX.utils.json_to_sheet(transaccionesData)
      XLSX.utils.book_append_sheet(wb, wsTransacciones, "Transacciones")
      
      // ==================== HOJA 2: RESUMEN MENSUAL ====================
      const resumenData = datos.datos_mensuales.map((r) => ({
        periodo: r.mes,
        mes_nombre: r.mes_nombre,
        ventas: Number(r.ventas),
        ventas_estimadas: Number(r.ventas_estimadas),
        tickets: r.tickets,
        incidencias: r.incidencias,
        tasa_conversion: r.ventas_estimadas > 0 
          ? Number(((Number(r.ventas) / Number(r.ventas_estimadas)) * 100).toFixed(2)) 
          : 0
      }))
      const wsResumen = XLSX.utils.json_to_sheet(resumenData)
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Mensual")
      
      // ==================== HOJA 3: EVENTOS (Todos) ====================
      const eventosData = datos.eventos.map((e, idx) => ({
        ranking: idx + 1,
        evento_id: e.id,
        nombre: e.nombre,
        ventas: Number(e.ventas),
        tickets: e.tickets,
        ticket_promedio: e.tickets > 0 ? Number((Number(e.ventas) / e.tickets).toFixed(2)) : 0
      }))
      const wsEventos = XLSX.utils.json_to_sheet(eventosData)
      XLSX.utils.book_append_sheet(wb, wsEventos, "Eventos")
      
      // ==================== HOJA 4: USUARIOS (Todos) ====================
      const usuariosData = datos.usuarios.map((u, idx) => ({
        ranking: idx + 1,
        cliente_id: u.id,
        nombre_completo: u.nombre_completo,
        email: u.email,
        total_compras: Number(u.total_compras),
        cantidad_compras: u.cantidad_compras,
        ticket_promedio: u.cantidad_compras > 0 ? Number((Number(u.total_compras) / u.cantidad_compras).toFixed(2)) : 0,
        rango: u.rango_nombre || 'Sin rango',
        puntos_disponibles: u.puntos_disponibles || 0
      }))
      const wsUsuarios = XLSX.utils.json_to_sheet(usuariosData)
      XLSX.utils.book_append_sheet(wb, wsUsuarios, "Usuarios")
      
      // ==================== HOJA 5: LOCALES (Todos) ====================
      const localesData = datos.locales.map((l, idx) => ({
        ranking: idx + 1,
        local_id: l.id,
        nombre: l.nombre,
        direccion: l.direccion,
        total_ingresos: Number(l.total_ingresos),
        cantidad_eventos: l.cantidad_eventos,
        ingreso_por_evento: l.cantidad_eventos > 0 ? Number((Number(l.total_ingresos) / l.cantidad_eventos).toFixed(2)) : 0
      }))
      const wsLocales = XLSX.utils.json_to_sheet(localesData)
      XLSX.utils.book_append_sheet(wb, wsLocales, "Locales")
      
      // ==================== HOJA 6: CATEGORÍAS ====================
      const categoriasData = datos.categorias.map((c) => ({
        categoria_id: c.categoria_id,
        categoria_nombre: c.categoria_nombre,
        total_ventas: Number(c.total_ventas),
        cantidad_eventos: c.cantidad_eventos,
        porcentaje: c.porcentaje
      }))
      const wsCategorias = XLSX.utils.json_to_sheet(categoriasData)
      XLSX.utils.book_append_sheet(wb, wsCategorias, "Categorias")
      
      // Generar archivo y descargar
      const ts = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `Reporte_Auditoria_${ts}.xlsx`)
      
    } catch (error) {
      console.error("Error al exportar:", error)
      alert("Error al generar el archivo Excel")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Grupo izquierdo: Botón Volver + Título */}
          <div className="flex items-start gap-3">
            <Link href="/admin">
              <Button
                variant="ghost"
                size="icon"
                className="bg-primary hover:bg-primary/90 cursor-pointer h-10 w-10 border-0"
                title="Volver al panel"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
            </Link>

            <div className="mt-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                Auditoría y Reportería
              </h1>
              <p className="text-gray-600 mt-2">Dashboard analítico y métricas de negocio</p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3 shrink-0">
            <Button 
              variant="outline" 
              className="bg-white cursor-pointer"
              onClick={cargarDatosDashboard}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 cursor-pointer" 
              onClick={exportToExcel}
              disabled={isLoading || isExporting}
            >
              <Download className={`w-4 h-4 mr-2 ${isExporting ? 'animate-pulse' : ''}`} /> 
              {isExporting ? 'Exportando...' : 'Exportar Excel'}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando datos del dashboard...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="shadow-sm border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800">Error al cargar los datos</h3>
                  <p className="text-red-600 mt-1">{error}</p>
                  <Button
                    onClick={cargarDatosDashboard}
                    className="mt-4 bg-red-600 hover:bg-red-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Content - Solo mostrar si hay datos y no está cargando */}
        {!isLoading && !error && dashboardData && (
          <>
            {/* KPIs Principales - Carrusel */}
            <div className="mb-8">
              <div 
                ref={carouselRef}
                className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  userSelect: 'none',
                }}
                onMouseDown={(e) => {
                  setIsDragging(true)
                  setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0))
                  setScrollLeft(carouselRef.current?.scrollLeft || 0)
                }}
                onMouseLeave={() => setIsDragging(false)}
                onMouseUp={() => setIsDragging(false)}
                onMouseMove={(e) => {
                  if (!isDragging) return
                  e.preventDefault()
                  const x = e.pageX - (carouselRef.current?.offsetLeft || 0)
                  const walk = (x - startX) * 2
                  if (carouselRef.current) {
                    carouselRef.current.scrollLeft = scrollLeft - walk
                  }
                }}
              >
                <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
                  {/* KPI: Ventas Totales */}
                  <Card className="shadow-sm flex-shrink-0" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", width: "280px" }}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Ventas Totales</p>
                          <p className="text-2xl font-bold text-gray-900">
                            S/ {Number(dashboardData.kpis.ventas_totales).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                        <span className="text-xs text-green-600 font-medium">
                          {formatPercentage(dashboardData.kpis.tasa_conversion)} vs estimado
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Estimado: S/ {Number(dashboardData.kpis.ventas_estimadas).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>

                  {/* KPI: Tickets Emitidos */}
                  <Card className="shadow-sm flex-shrink-0" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", width: "280px" }}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Tickets Emitidos</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.kpis.tickets_emitidos.toLocaleString('es-PE')}
                          </p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Ticket className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {dashboardData.kpis.tickets_transferidos} transferidos
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Ticket Promedio: S/ {dashboardData.kpis.tickets_emitidos > 0 ? (Number(dashboardData.kpis.ventas_totales) / dashboardData.kpis.tickets_emitidos).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* KPI: Aforo Vendido */}
                  <Card className="shadow-sm flex-shrink-0" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", width: "280px" }}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Aforo Vendido</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatPercentage(dashboardData.kpis.aforo_vendido || 0)}
                          </p>
                        </div>
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <Users className="h-5 w-5 text-indigo-600" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(dashboardData.kpis.aforo_vendido || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Sobre stock total disponible
                      </p>
                    </CardContent>
                  </Card>

                  {/* KPI: Velocidad de Venta */}
                  <Card className="shadow-sm flex-shrink-0" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", width: "280px" }}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Velocidad de Venta</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {(dashboardData.kpis.velocidad_venta || 0).toFixed(1)}
                          </p>
                        </div>
                        <div className="p-2 bg-cyan-50 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-cyan-600" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Tickets por día
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Período: 3 meses
                      </p>
                    </CardContent>
                  </Card>

                  {/* KPI: Transferencias */}
                  <Card className="shadow-sm flex-shrink-0" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", width: "280px" }}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Transferencias</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.kpis.tickets_transferidos.toLocaleString('es-PE')}
                          </p>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {formatPercentage((dashboardData.kpis.tickets_transferidos / dashboardData.kpis.tickets_emitidos) * 100)} del total
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Tickets emitidos: {dashboardData.kpis.tickets_emitidos.toLocaleString('es-PE')}
                      </p>
                    </CardContent>
                  </Card>

                  {/* KPI: Incidencias */}
                  <Card className="shadow-sm flex-shrink-0" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", width: "280px" }}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Incidencias</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.kpis.incidencias}
                          </p>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                        </div>
                      </div>
                      <div className="mt-1">
                        {dashboardData.kpis.incidencias > 5 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Alto
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Bajo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Nivel de riesgo operacional
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

        {/* Barra de Filtros */}
        <Card className="shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
          <CardContent className="py-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5" />
              <h3 className="text-lg font-semibold text-gray-900">Filtros y Búsqueda</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por período predefinido */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Período
                </label>
                <Select
                  value={mesesPeriodo.toString()}
                  onValueChange={(value) => {
                    setMesesPeriodo(parseInt(value))
                    setFechaDesde("")
                    setFechaHasta("")
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Último mes</SelectItem>
                    <SelectItem value="3">Últimos 3 meses</SelectItem>
                    <SelectItem value="6">Últimos 6 meses</SelectItem>
                    <SelectItem value="12">Últimos 12 meses</SelectItem>
                    <SelectItem value="24">Últimos 2 años</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha desde */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Fecha Desde (opcional)
                </label>
                <Input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="bg-white"
                  placeholder="Fecha inicial"
                />
              </div>

              {/* Fecha hasta */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Fecha Hasta (opcional)
                </label>
                <Input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="bg-white"
                  placeholder="Fecha final"
                />
              </div>
            </div>

            {fechaDesde && fechaHasta && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Rango personalizado:</strong> {new Date(fechaDesde).toLocaleDateString('es-ES')} - {new Date(fechaHasta).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs de Visualizaciones */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 mt-6">
          <TabsList className="inline-flex gap-3 bg-transparent p-0 h-auto">
            <TabsTrigger 
              value="overview"
              className="px-6 py-2 rounded-lg font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-[inset_0_0_12px_rgba(0,0,0,0.25)] data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-300 data-[state=inactive]:hover:bg-gray-50"
            >
              Resumen
            </TabsTrigger>
            <TabsTrigger 
              value="trends"
              className="px-6 py-2 rounded-lg font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-[inset_0_0_12px_rgba(0,0,0,0.25)] data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-300 data-[state=inactive]:hover:bg-gray-50"
            >
              Tendencias
            </TabsTrigger>
            <TabsTrigger 
              value="rankings"
              className="px-6 py-2 rounded-lg font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-[inset_0_0_12px_rgba(0,0,0,0.25)] data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-300 data-[state=inactive]:hover:bg-gray-50"
            >
              Rankings
            </TabsTrigger>
            {/* Tab de Detalle temporalmente deshabilitada - requiere endpoint adicional
            <TabsTrigger 
              value="details"
              className="px-6 py-2 rounded-lg font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-[inset_0_0_12px_rgba(0,0,0,0.25)] data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 data-[state=inactive]:border data-[state=inactive]:border-gray-300 data-[state=inactive]:hover:bg-gray-50"
            >
              Detalle
            </TabsTrigger>
            */}
          </TabsList>

          {/* Tab: Resumen */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ventas Mensuales vs Estimadas */}
              <Card className="shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                <CardHeader>
                  <CardTitle className="text-lg">Ventas vs Estimado (Mensual)</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value: any) => ventasFormatter.formatCurrency(value)} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="ventas" fill="#2563eb" name="Ventas Reales" />
                      <Bar dataKey="ventasEstimadas" fill="#93c5fd" name="Ventas Estimadas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribución de Ventas por Categoría */}
              <Card className="shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                <CardHeader>
                  <CardTitle className="text-lg">Distribución por Categoría de Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={ventasPorCategoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => {
                          if (!entry) return ''
                          const porcentaje = entry.porcentaje || 0
                          const name = (entry.name || '').split(' ')[0]
                          return `${name} ${formatPercentage(porcentaje)}`
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ventasPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => formatCurrency(value)}
                        labelFormatter={(label: string) => `Categoría: ${label}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {ventasPorCategoria.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{cat.name}</span>
                          <span className="text-gray-500">({cat.eventos} eventos)</span>
                        </div>
                        <span className="text-gray-600">{formatPercentage(cat.porcentaje)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tendencia de Incidencias */}
              <Card className="shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                <CardHeader>
                  <CardTitle className="text-lg">Incidencias Mensuales</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="incidencias" 
                        stroke="#059669" 
                        strokeWidth={2}
                        name="Incidencias"
                        dot={{ fill: '#059669', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tickets Emitidos */}
              <Card className="shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                <CardHeader>
                  <CardTitle className="text-lg">Tickets Emitidos por Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value: any) => ticketsFormatter.format(value)} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                        formatter={(value: any) => value.toLocaleString('es-PE')}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="tickets" 
                        stroke="#059669" 
                        fill="#86efac" 
                        name="Tickets"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Tendencias */}
          <TabsContent value="trends" className="space-y-6">
            <Card className="shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
              <CardHeader>
                <CardTitle>Tendencia de Ventas y Conversión</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Análisis comparativo de ventas reales vs estimadas por mes
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fill: '#6b7280' }} />
                    <YAxis tick={{ fill: '#6b7280' }} tickFormatter={(value: any) => ventasFormatter.formatCurrency(value)} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ventas" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      name="Ventas Reales"
                      dot={{ fill: '#2563eb', r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ventasEstimadas" 
                      stroke="#93c5fd" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Ventas Estimadas"
                      dot={{ fill: '#93c5fd', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {monthlyData.slice(-3).map((month, idx) => {
                const tasaMes = (month.ventas / month.ventasEstimadas) * 100
                const isPositive = tasaMes >= 90
                
                return (
                  <Card key={idx} className="shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-500">{month.month}</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Ventas</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(month.ventas)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Conversión</p>
                          <div className="flex items-center gap-2">
                            <p className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-orange-600'}`}>
                              {formatPercentage(tasaMes)}
                            </p>
                            {isPositive ? (
                              <TrendingUp className="w-5 h-5 text-green-600" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-orange-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Tab: Rankings */}
          <TabsContent value="rankings" className="space-y-6">
            {/* Grid de 3 columnas para las secciones de rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ranking de Eventos */}
              <Card className="shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Top Eventos
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">Eventos con mayor volumen de ventas</p>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {topEventos.map((evento, idx) => (
                    <Card key={evento.id} className="shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2.5">
                          {/* Ranking Badge y Nombre */}
                          <div className="flex items-start gap-2.5">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-sm ${
                              idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-500' : 'bg-blue-500'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm line-clamp-2">{evento.nombre}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{evento.tickets.toLocaleString('es-PE')} tickets vendidos</p>
                            </div>
                          </div>

                          {/* Métricas */}
                          <div className="space-y-2 border-t pt-2.5">
                            <div>
                              <p className="text-xs text-gray-500">Ingresos</p>
                              <p className="text-base font-bold text-green-600">{formatCurrency(evento.ventas)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-gray-500">Ticket promedio</p>
                                <p className="font-semibold text-gray-900">
                                  {evento.tickets > 0 ? formatCurrency(evento.ventas / evento.tickets) : 'S/ 0.00'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Velocidad</p>
                                <p className="font-semibold text-cyan-600">
                                  {dashboardData.kpis.velocidad_venta ? `${dashboardData.kpis.velocidad_venta.toFixed(1)}/día` : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                              <div>
                                <p className="text-gray-500">% Aforo</p>
                                <p className="font-semibold text-indigo-600 mt-1">
                                  {dashboardData.kpis.aforo_vendido ? formatPercentage(dashboardData.kpis.aforo_vendido) : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Incidencias</p>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                                  {idx === 1 ? '4 - Medio' : 'Bajo'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Ranking de Usuarios */}
              <Card className="shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Top Usuarios
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">Clientes con mayor actividad de compra</p>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {topUsuarios.map((usuario, idx) => (
                    <Card key={usuario.id} className="shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2.5">
                          {/* Ranking Badge y Nombre */}
                          <div className="flex items-start gap-2.5">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-sm ${
                              idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-500' : 'bg-blue-500'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm line-clamp-1">{usuario.nombre}</p>
                              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{usuario.email}</p>
                            </div>
                          </div>

                          {/* Métricas */}
                          <div className="space-y-2 border-t pt-2.5">
                            <div>
                              <p className="text-xs text-gray-500">Total gastado</p>
                              <p className="text-base font-bold text-green-600">{formatCurrency(usuario.ventas)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-gray-500">Nº compras</p>
                                <p className="font-semibold text-gray-900">{usuario.compras}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Ticket promedio</p>
                                <p className="font-semibold text-gray-900">
                                  {usuario.compras > 0 ? formatCurrency(usuario.ventas / usuario.compras) : 'S/ 0.00'}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                              <div>
                                <p className="text-gray-500">Rango</p>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                                  {usuario.rango_nombre}
                                </span>
                              </div>
                              <div>
                                <p className="text-gray-500">Puntos</p>
                                <p className="font-semibold text-orange-600 mt-1">
                                  {usuario.puntos_disponibles.toLocaleString('es-PE')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Ranking de Locales */}
              <Card className="shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Top Locales
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">Locales con mayor generación de ingresos</p>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {topLocales.map((local, idx) => (
                    <Card key={local.id} className="shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2.5">
                          {/* Ranking Badge y Nombre */}
                          <div className="flex items-start gap-2.5">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-sm ${
                              idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-500' : 'bg-blue-500'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm line-clamp-1">{local.nombre}</p>
                              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{local.direccion}</p>
                            </div>
                          </div>

                          {/* Métricas */}
                          <div className="space-y-2 border-t pt-2.5">
                            <div>
                              <p className="text-xs text-gray-500">Ingresos totales</p>
                              <p className="text-base font-bold text-green-600">{formatCurrency(local.ventas)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-gray-500">Nº eventos</p>
                                <p className="font-semibold text-gray-900">{local.eventos}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Ingreso/evento</p>
                                <p className="font-semibold text-gray-900">
                                  {local.eventos > 0 ? formatCurrency(local.ventas / local.eventos) : 'S/ 0.00'}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                              <div>
                                <p className="text-gray-500">% Aforo prom.</p>
                                <p className="font-semibold text-indigo-600 mt-1">
                                  {dashboardData.kpis.aforo_vendido ? formatPercentage(dashboardData.kpis.aforo_vendido) : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Velocidad</p>
                                <p className="font-semibold text-cyan-600 mt-1">
                                  {dashboardData.kpis.velocidad_venta ? `${dashboardData.kpis.velocidad_venta.toFixed(1)}/día` : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Detalle - Temporalmente deshabilitada
          <TabsContent value="details">
            <Card className="shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
              <CardHeader>
                <CardTitle className="text-lg">Detalle de Transacciones</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Funcionalidad en desarrollo - Requiere endpoint /detalle
                </p>
              </CardHeader>
            </Card>
          </TabsContent>
          */}
        </Tabs>
        </>
        )}
      </main>
    </div>
  )
}