"use client"

import { Button } from "@/components/ui/button"
import { ElegantSpinner } from "@/components/ui/elegant-spinner"
import { ArrowLeft } from "lucide-react"
import { useEventoForm } from "../hooks/use-evento-form"
import { EventoSidebarCard } from "./EventoSidebarCard"
import { EventoInfoCard } from "./EventoInfoCard"
import { EventoZonasCard } from "./EventoZonasCard"

export function CrearEventoForm() {
  const form = useEventoForm()
  const { pageMode, router, isLoading, loadingEvento, loadingZonas } = form

  const isProcessing = isLoading || loadingEvento || loadingZonas
  
  // Determinar mensaje del loader según el estado
  const getLoadingMessage = () => {
    if (loadingEvento) return "Cargando evento..."
    if (loadingZonas) return "Creando zonas..."
    if (isLoading) return pageMode === 'edit' ? "Actualizando evento..." : "Guardando evento..."
    return "Procesando..."
  }

  return (
    <>
      {isProcessing && (
        <div className="min-h-screen bg-white">
          <div className="flex justify-center items-center h-screen">
            <ElegantSpinner 
              size="md"
              message={getLoadingMessage()} 
            />
          </div>
        </div>
      )}
      <main className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="p-3 h-12 w-12"
          style={{ cursor: 'pointer' }}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {pageMode === 'create' && 'Crear Nuevo Evento'}
            {pageMode === 'edit' && 'Editar Evento'}
            {pageMode === 'view' && 'Detalles del Evento'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {pageMode === 'create' && 'Completa el formulario para registrar un nuevo evento'}
            {pageMode === 'edit' && 'Modifica los detalles del evento según sea necesario'}
            {pageMode === 'view' && 'Visualización detallada de la información del evento'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Información principal */}
        <div className="lg:col-span-2 space-y-6">
          <EventoInfoCard form={form} />
          <EventoZonasCard form={form} />
        </div>
        
        {/* Columna derecha - Imagen y Configuración */}
        <EventoSidebarCard form={form} />
      </div>
    </main>
    </>
  )
}
