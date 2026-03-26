import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Upload, X, Save } from "lucide-react"
import type { useEventoForm } from "../hooks/use-evento-form"

interface EventoSidebarCardProps {
  form: ReturnType<typeof useEventoForm>
}

export function EventoSidebarCard({ form }: EventoSidebarCardProps) {
  const {
    pageMode,
    isLoading,
    imagenEventoPreview,
    mapaDistribucionPreview,
    estadoEvento,
    nombre,
    descripcion,
    categoria,
    organizadores,
    fechaEvento,
    horaEvento,
    horaFin,
    departamento,
    provincia,
    distrito,
    localId,
    tiposEntrada,
    clearImagenEvento,
    clearMapaDistribucion,
    setEstadoEvento,
    handleImageUpload,
    handleMapaUpload,
    handleGuardar,
    loadingEvento,
    loadingZonas,
    errorEvento,
    router
  } = form

  return (
    <div className="space-y-6">
      {/* Imagen del Evento */}
      <Card className="" style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1 } : {}}>
        <CardHeader>
          <CardTitle className="text-xl">Imagen del Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-4 text-center" style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1 } : {}}>
            {imagenEventoPreview ? (
              <div className="relative">
                <img 
                  src={imagenEventoPreview} 
                  alt="Vista previa del banner" 
                  className="w-full h-auto rounded-lg"
                />
                {pageMode !== 'view' && (
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2"
                    style={{ cursor: 'pointer' }}
                    onClick={clearImagenEvento}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : pageMode === 'view' ? (
              <div className="py-10">
                <div className="relative rounded-md overflow-hidden h-[200px] bg-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-sm">Sin imagen</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-1">PNG, JPG o WEBP</p>
                <p className="text-xs text-muted-foreground">Máximo 4MB</p>
                
                <div className="mt-4">
                  <label htmlFor="banner-upload">
                    <div className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium cursor-pointer hover:bg-primary/90 inline-block">
                      Subir Imagen
                    </div>
                    <input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Se recomienda una imagen con proporción 16:9 y resolución mínima de 1200x675 píxeles.
          </p>
        </CardContent>
      </Card>
      
      {/* Imagen del Mapa de Distribución */}
      <Card className="" style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1 } : {}}>
        <CardHeader>
          <CardTitle className="text-xl">Imagen del Mapa de Distribución</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-4 text-center" style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1 } : {}}>
            {mapaDistribucionPreview ? (
              <div className="relative">
                <img 
                  src={mapaDistribucionPreview} 
                  alt="Vista previa del mapa de distribución" 
                  className="w-full h-auto rounded-lg"
                />
                {pageMode !== 'view' && (
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2"
                    style={{ cursor: 'pointer' }}
                    onClick={clearMapaDistribucion}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : pageMode === 'view' ? (
              <div className="py-10">
                <div className="relative rounded-md overflow-hidden h-[200px] bg-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p className="text-sm">Sin mapa</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-1">PNG, JPG o WEBP</p>
                <p className="text-xs text-muted-foreground">Máximo 4MB</p>
                
                <div className="mt-4">
                  <label htmlFor="mapa-upload">
                    <div className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium cursor-pointer hover:bg-primary/90 inline-block">
                      Subir Imagen
                    </div>
                    <input
                      id="mapa-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleMapaUpload}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
          </p>
        </CardContent>
      </Card>
      
      {/* Configuración */}
      <Card className="" style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1 } : {}}>
        <CardHeader>
          <CardTitle className="text-xl">Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Select 
              value={estadoEvento} 
              onValueChange={setEstadoEvento}
              disabled={pageMode === 'view' || isLoading}
            >
              <SelectTrigger id="estado-evento" className="" style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1, color: 'black', cursor: 'pointer' } : { cursor: 'pointer' }}>
                <SelectValue placeholder="Seleccionar estado">
                  {pageMode === 'view' ? estadoEvento : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Borrador">Borrador (No visible al público)</SelectItem>
                <SelectItem value="Próximamente">Próximamente (Visible pero sin venta)</SelectItem>
                <SelectItem value="Publicado">Publicado (Visible con venta activa)</SelectItem>
                <SelectItem value="Finalizado">Finalizado (Evento completado)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground pt-1">
              {estadoEvento === "Borrador" && "El evento no será visible para los usuarios"}
              {estadoEvento === "Próximamente" && "El evento será visible pero no permitirá la compra de tickets"}
              {estadoEvento === "Publicado" && "El evento será visible y permitirá la compra de tickets"}
              {estadoEvento === "Finalizado" && "El evento se mostrará como completado, visible pero sin permitir más compras"}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Acciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Acciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pageMode !== 'view' ? (
            <Button 
              onClick={handleGuardar} 
              className="w-full"
              style={{ cursor: 'pointer' }}
              disabled={
                loadingEvento ||
                !nombre || 
                !descripcion || 
                !categoria || 
                !organizadores ||
                !fechaEvento || 
                !horaEvento || 
                !horaFin ||
                !departamento ||
                !provincia ||
                !distrito ||
                !localId ||
                tiposEntrada.length === 0 ||
                !imagenEventoPreview
              }
            >
              {(loadingEvento || loadingZonas || isLoading) ? (
                <>Guardando...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {pageMode === 'edit' ? 'Actualizar Evento' : 'Guardar Evento'}
                </>
              )}
            </Button>
          ) : null}
          
          {errorEvento && (
            <p className="text-sm text-red-600">{errorEvento}</p>
          )}
          
          <Button 
            variant="outline" 
            className="w-full h-12 text-base" 
            onClick={() => router.back()}
            style={{ cursor: 'pointer' }}
          >
            {pageMode === 'view' ? 'Volver' : 'Cancelar'}
          </Button>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          * Campos obligatorios
        </CardFooter>
      </Card>
    </div>
  )
}
