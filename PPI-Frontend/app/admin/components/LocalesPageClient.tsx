"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { useTiposLocales } from "@/lib/hooks/locales"
import { useDistritos } from "@/lib/hooks/geografia"
import { useLocalesAdmin, useLocalesStats, useLocalStatusDialog, useLocalesImport } from "@/app/admin/hooks"
import { AdminPageHeader, AdminStatsGrid, AdminFiltersCard, AdminPagination } from "."
import { LocalesTable } from "./LocalesTable"
import { LocalesStatusDialog } from "./LocalesStatusDialog"
import { LocalesImportModal } from "@/app/admin/locales/components/LocalesImportModal"
import { PageSpinner } from "@/components/ui/page-spinner"
import { buildLocalesFilterOptions } from "../utils/locales-filter-options"
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Plus, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

const LocalMapView = dynamic(() => import('@/app/admin/locales/components/LocalMapView'), {
  ssr: false,
  loading: () => <PageSpinner message="Cargando mapa..." />
})

export function LocalesPageClient() {
  const router = useRouter()

  const localesAdmin = useLocalesAdmin()
  const { distritos } = useDistritos()
  const { tiposLocales } = useTiposLocales()
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const statsData = useLocalesStats(localesAdmin.locales)

  const statusDialog = useLocalStatusDialog(
    localesAdmin.locales,
    localesAdmin.toggleLocalStatus
  )

  const importModal = useLocalesImport()

  const mapItems = useMemo(() => {
    return (localesAdmin.filteredLocales || []).filter((l) => l.latitud != null && l.longitud != null)
  }, [localesAdmin.filteredLocales])

  const handleRowClick = useCallback((id: number) => {
    setSelectedId(id)
    setViewMode('map')
    setTimeout(() => {
      const el = document.getElementById('local-map')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
  }, [])

  const handleMarkerSelect = useCallback((id: number) => {
    setSelectedId(id)
  }, [])

  const filterOptions = useMemo(() =>
    buildLocalesFilterOptions(
      localesAdmin.filterTipo,
      localesAdmin.setFilterTipo,
      localesAdmin.filterEstado,
      localesAdmin.setFilterEstado,
      localesAdmin.filterDistrito,
      localesAdmin.setFilterDistrito,
      tiposLocales,
      distritos
    ),
    [
      localesAdmin.filterTipo,
      localesAdmin.filterEstado,
      localesAdmin.filterDistrito,
      tiposLocales,
      distritos
    ]
  )


  if (!localesAdmin.isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PageSpinner message="Cargando locales..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {localesAdmin.error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>Error: {localesAdmin.error}</p>
            <button
              onClick={() => localesAdmin.setError(null)}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* -------- HEADER PRINCIPAL -------- */}
        {/* Usamos items-start para alinear todo al tope superior */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
          
          {/* GRUPO IZQUIERDO: Flecha + Título */}
          <div className="flex items-start gap-4">
            <Link href="/admin" className="shrink-0">
              <Button 
                size="icon" 
                className="bg-primary hover:bg-primary/90 cursor-pointer h-10 w-10 border-0" 
                title="Volver al panel"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
            </Link>
            
            {/* Ajustamos el margen superior (mt-1) para que el texto "Gestión..." coincida con la flecha */}
            <div className="mt-1"> 
              <AdminPageHeader
                title="Gestión de Locales"
                description="Administra los locales registrados en el sistema"
              />
            </div>
          </div>

          {/* GRUPO DERECHO: Botones de Acción (Importar + Agregar) */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={importModal.openModal}
              variant="outline"
              className="cursor-pointer bg-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Carga Masiva
            </Button>

            {/* Aquí está el botón Agregar Local, subido al header */}
            <Button
              onClick={() => router.push("/admin/locales/crear")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Local
            </Button>
          </div>
        </div>

        {/* -------- ESTADÍSTICAS (Arriba) -------- */}
        <div className="mb-8">
          <AdminStatsGrid stats={statsData} />
        </div>

        {/* -------- FILTROS (Abajo) -------- */}
        <AdminFiltersCard
          searchTerm={localesAdmin.searchTerm}
          onSearchChange={localesAdmin.setSearchTerm}
          searchPlaceholder="Buscar locales..."
          filters={filterOptions}
          onClearFilters={localesAdmin.handleClearFilters}
          hasActiveFilters={localesAdmin.hasActiveFilters}
        />

        {/* -------- TABS TABLA/MAPA -------- */}
        <div className="mb-4 mt-6 inline-flex items-center rounded-md bg-transparent p-1">
          <div
            role="tablist"
            aria-label="Vista locales"
            className="inline-flex rounded-md bg-transparent p-1"
          >
            <button
              type="button"
              role="tab"
              aria-pressed={viewMode === 'table'}
              onClick={() => setViewMode('table')}
              title="Ver en tabla"
              aria-label="Ver en tabla"
              className={`px-4 py-2 text-sm rounded-md flex items-center gap-2 transition-colors duration-150 focus:outline-none ${viewMode === 'table'
                ? 'bg-white shadow-sm text-slate-800'
                : 'text-slate-600 hover:bg-gray-50 hover:shadow-md'
                } cursor-pointer transition-colors duration-150`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
                <rect x="3" y="4" width="18" height="3" rx="1" fill="currentColor" opacity="0.9" />
                <rect x="3" y="10.5" width="18" height="3" rx="1" fill="currentColor" opacity="0.9" />
                <rect x="3" y="17" width="18" height="3" rx="1" fill="currentColor" opacity="0.9" />
              </svg>
              <span>Tabla</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-pressed={viewMode === 'map'}
              onClick={() => setViewMode('map')}
              title="Ver en mapa"
              aria-label="Ver en mapa"
              className={`px-4 py-2 text-sm rounded-md flex items-center gap-2 transition-colors duration-150 focus:outline-none ml-2 ${viewMode === 'map'
                ? 'bg-white shadow-sm text-slate-800'
                : 'text-slate-600 hover:bg-gray-50 hover:shadow-md'
                } cursor-pointer transition-colors duration-150`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
                <path d="M12 2l8 4-8 4-8-4 8-4z" fill="currentColor" opacity="0.95" />
                <path d="M4 10l8 4 8-4" stroke="currentColor" strokeWidth="0" fill="currentColor" opacity="0.9" />
                <path d="M4 18l8 4 8-4" stroke="currentColor" strokeWidth="0" fill="currentColor" opacity="0.9" />
              </svg>
              <span>Mapa</span>
            </button>
          </div>
        </div>

        {viewMode === 'table' && (
          <LocalesTable
            locales={localesAdmin.filteredLocales}
            onAction={statusDialog.handleAction}
            sortConfig={localesAdmin.sortConfig}
            onSort={localesAdmin.handleSort}
            onRowClick={handleRowClick}
            selectedId={selectedId}
          />
        )}

        {viewMode === 'map' && (
          <div id="local-map" style={{ width: '100%', height: 520 }}>
            <LocalMapView items={mapItems} selectedId={selectedId} onSelect={handleMarkerSelect} />
          </div>
        )}

        <AdminPagination
          pagination={localesAdmin.pagination}
          onPageChange={localesAdmin.goToPage}
          onPrev={localesAdmin.prevPage}
          onNext={localesAdmin.nextPage}
        />

        <LocalesImportModal
          isOpen={importModal.isOpen}
          onClose={importModal.closeModal}
          file={importModal.file}
          isValid={importModal.isValid}
          validationErrors={importModal.validationErrors}
          insertedRows={importModal.insertedRows}
          isLoading={importModal.isLoading}
          onFileChange={importModal.setFile}
          onImport={importModal.handleImport}
        />

        <LocalesStatusDialog
          open={statusDialog.dialogState.open}
          onOpenChange={(open) => {
            if (!open) statusDialog.closeDialog()
          }}
          localId={statusDialog.dialogState.localId}
          nombre={statusDialog.dialogState.nombre}
          locales={localesAdmin.locales || []}
          onConfirm={statusDialog.handleConfirmStatusChange}
          isLoading={statusDialog.isLoading}
        />
      </main>
    </div>
  )
}
