"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { useEventosAdmin, useEventoEstadoDialog } from "@/app/admin/hooks"
import { useCategoriasEvento } from "@/lib/hooks/eventos"
import { Calendar, Users, Ticket, DollarSign, ArrowLeft, Plus } from "lucide-react"
import { EventosTable } from "./EventosTable"
import { EventosActionDialog } from "./EventosActionDialog"
import { AdminPageHeader, AdminStatsGrid, AdminFiltersCard, AdminPagination } from "."
import { PageSpinner } from "@/components/ui/page-spinner"
import { getCategoriaNombre } from "../utils/eventos-helpers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { buildEventosFilterOptions } from "../utils/eventos-filter-options"

export function EventosPageClient() {
  const router = useRouter()
  
  const {
    eventos,
    filteredEventos,
    pagination,
    loading,
    error,
    isInitialized,
    searchTerm,
    setSearchTerm,
    filterCategoria,
    setFilterCategoria,
    filterEstado,
    setFilterEstado,
    filterPeriodo,
    setFilterPeriodo,
    sortConfig,
    handleSort,
    totalEventos,
    eventosPublicados,
    ticketsVendidos,
    ingresosEstimados,
    setEventos,
    handleClearFilters,
    hasActiveFilters,
    goToPage,
    nextPage,
    prevPage
  } = useEventosAdmin()
  
  const { categoriasEvento } = useCategoriasEvento()

  const formatCurrency = (value: number) => {
    return `S/ ${value.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const ticketsVendidosFormatted = ticketsVendidos.toLocaleString('es-PE')
  const ingresosEstimadosFormatted = formatCurrency(ingresosEstimados)
  
  const estadoDialog = useEventoEstadoDialog(eventos, setEventos)

  const filterOptions = useMemo(() => 
    buildEventosFilterOptions(
      filterCategoria,
      setFilterCategoria,
      filterEstado,
      setFilterEstado,
      filterPeriodo,
      setFilterPeriodo,
      categoriasEvento
    ),
    [filterCategoria, filterEstado, filterPeriodo, categoriasEvento]
  )

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PageSpinner message="Cargando eventos..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        
        {/* -------- HEADER PRINCIPAL (Alineado) -------- */}
        {/* Usamos items-start para poder bajar el texto manualmente con margen */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
          
          {/* GRUPO IZQUIERDO: Flecha + Título */}
          <div className="flex items-start gap-4">
            <Link href="/admin" className="shrink-0">
              <Button 
                size="icon" 
                className="bg-primary hover:bg-primary/90 cursor-pointer h-10 w-10 border-0 shadow-sm"
                title="Volver al panel"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
            </Link>
            
            {/* AQUÍ ESTÁ EL AJUSTE: mt-1.5 baja el texto un poco más para centrarlo con la flecha */}
            <div className="mt-1.5">
              <AdminPageHeader
                title="Gestión de Eventos" 
                description="Administra los eventos disponibles en la plataforma"
              />
            </div>
          </div>

          {/* GRUPO DERECHO: Botón Crear Evento */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/admin/eventos/crear")}
              style={{ cursor: 'pointer' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Evento
            </Button>
          </div>
        </div>

        {/* -------- ESTADÍSTICAS (Arriba) -------- */}
        <div className="mb-8">
          <AdminStatsGrid stats={[
            { 
              icon: Calendar, 
              title: "Total Eventos", 
              value: totalEventos.toString(), 
              iconColor: "text-primary" 
            },
            { 
              icon: Users, 
              title: "Eventos Publicados", 
              value: eventosPublicados.toString(), 
              iconColor: "text-accent" 
            },
            {
              icon: Ticket,
              title: "Tickets Vendidos",
              value: ticketsVendidosFormatted,
              iconColor: "text-chart-3"
            },
            {
              icon: DollarSign,
              title: "Ingresos Est.",
              value: ingresosEstimadosFormatted,
              iconColor: "text-chart-4"
            }
          ]} />
        </div>

        {/* -------- FILTROS (Abajo) -------- */}
        <AdminFiltersCard 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar eventos..."
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          filters={filterOptions}
        />

        <EventosTable 
          eventos={filteredEventos}
          handleAction={estadoDialog.handleAction}
          getCategoriaNombre={(id) => getCategoriaNombre(id, categoriasEvento)}
          sortConfig={sortConfig}
          onSort={handleSort}
        />

        <AdminPagination
          pagination={pagination}
          onPageChange={goToPage}
          onPrev={prevPage}
          onNext={nextPage}
        />

        <EventosActionDialog
          open={estadoDialog.dialogEstado.open}
          onOpenChange={(open) => {
            if (!open) estadoDialog.handleCloseDialog()
          }}
          eventoId={estadoDialog.dialogEstado.eventoId}
          nombre={estadoDialog.dialogEstado.nombre}
          nuevoEstado={estadoDialog.nuevoEstado}
          onNuevoEstadoChange={estadoDialog.setNuevoEstado}
          motivoCancelacion={estadoDialog.motivoCancelacion}
          onMotivoCancelacionChange={estadoDialog.setMotivoCancelacion}
          onConfirm={estadoDialog.handleConfirmDialog}
          tieneEntradasVendidas={estadoDialog.tieneEntradasVendidas}
          isLoadingEntradas={estadoDialog.isLoadingEntradas}
          onCheckEntradas={estadoDialog.checkEntradasVendidas}
        />
      </main>
    </div>
  )
}