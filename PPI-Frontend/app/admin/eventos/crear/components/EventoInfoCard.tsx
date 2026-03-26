import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Clock } from "lucide-react"
import type { useEventoForm } from "../hooks/use-evento-form"

interface EventoInfoCardProps {
  form: ReturnType<typeof useEventoForm>
}

export function EventoInfoCard({ form }: EventoInfoCardProps) {
  const {
    pageMode,
    isLoading,
    nombre,
    descripcion,
    categoria,
    organizadores,
    fechaEvento,
    horaEvento,
    horaFin,
    esNominal,
    departamento,
    provincia,
    distrito,
    localId,
    setNombre,
    setDescripcion,
    setCategoria,
    setOrganizadores,
    setFechaEvento,
    setHoraEvento,
    setHoraFin,
    setEsNominal,
    setLocalId,
    categoriasEvento,
    listaOrganizadores,
    departamentos,
    provincias,
    distritos,
    localesPorDistrito,
    loadingCategorias,
    loadingOrganizadores,
    loadingDepartamentos,
    loadingLocales,
    errorCategorias,
    errorOrganizadores,
    handleDepartamentoChange,
    handleProvinciaChange,
    handleDistritoChange
  } = form

  // Función para obtener el texto del local seleccionado
  const getLocalDisplayText = () => {
    if (!localId) return null
    
    if (localesPorDistrito.length === 0) return null
    
    const local = localesPorDistrito.find(l => l.id.toString() === localId)
    
    if (local) {
      return `${local.nombre} (${local.aforo} personas)`
    }
    
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Información del Evento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre del Evento <span className="text-red-400">*</span></Label>
          <div className="relative">
            <Input
              id="nombre"
              placeholder="Ej. Concierto de Rock en Vivo"
              value={nombre}
              onChange={(e) => {
                if (e.target.value.length <= 50) {
                  setNombre(e.target.value)
                }
              }}
              disabled={isLoading || pageMode === 'view'}
              style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1, color: 'black' } : {}}
              className=""
              maxLength={50}
            />
            <span className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs ${
              nombre.length >= 50 ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {nombre.length}/50
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción <span className="text-red-400">*</span></Label>
          <div className="relative">
            <Textarea
              id="descripcion"
              placeholder="Describe los detalles del evento..."
              value={descripcion}
              onChange={(e) => {
                if (e.target.value.length <= 400) {
                  setDescripcion(e.target.value)
                }
              }}
              rows={5}
              disabled={isLoading || pageMode === 'view'}
              style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1, color: 'black', resize: 'none' } : { resize: 'none' }}
              className=""
              maxLength={400}
            />
            <span className={`absolute right-3 bottom-3 text-xs ${
              descripcion.length >= 400 ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {descripcion.length}/400
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría <span className="text-red-400">*</span></Label>
            <Select value={categoria} onValueChange={setCategoria} disabled={pageMode === 'view' || isLoading || loadingCategorias}>
              <SelectTrigger id="categoria" className="" style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1, color: 'black', cursor: 'pointer' } : { cursor: 'pointer' }}>
                <SelectValue placeholder={loadingCategorias ? "Cargando categorías..." : "Selecciona una categoría"}>
                  {pageMode === 'view' && categoria ?
                    categoriasEvento.find(cat => cat.categoria_evento_id.toString() === categoria)?.nombre || categoria :
                    undefined
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent style={{ color: "#1f2937", backgroundColor: "#ffffff" }}>
                {categoriasEvento.map((cat) => (
                  <SelectItem key={cat.categoria_evento_id} value={cat.categoria_evento_id.toString()} style={{ color: "#1f2937" }}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errorCategorias && (
              <p className="text-sm text-red-600">{errorCategorias}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="organizadores">Organizadores <span className="text-red-400">*</span></Label>
            <Select value={organizadores} onValueChange={setOrganizadores} disabled={pageMode === 'view' || isLoading || loadingOrganizadores}>
              <SelectTrigger id="organizadores" className="" style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1, color: 'black', cursor: 'pointer' } : { cursor: 'pointer' }}>
                <SelectValue placeholder={loadingOrganizadores ? "Cargando organizadores..." : "Selecciona un organizador"}>
                  {pageMode === 'view' && organizadores ?
                    listaOrganizadores.find(org => org.id.toString() === organizadores)?.nombre || organizadores :
                    undefined
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent style={{ color: "#1f2937", backgroundColor: "#ffffff" }}>
                {listaOrganizadores.map((org) => (
                  <SelectItem key={org.id} value={org.id.toString()} style={{ color: "#1f2937" }}>
                    {org.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errorOrganizadores && (
              <p className="text-sm text-red-600">{errorOrganizadores}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="departamento">Departamento <span className="text-red-400">*</span></Label>
            <Select 
              value={departamento} 
              onValueChange={handleDepartamentoChange} 
              disabled={isLoading || loadingDepartamentos || pageMode === 'view'}
            >
              <SelectTrigger id="departamento" className="" style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1, color: 'black', cursor: 'pointer' } : { cursor: 'pointer' }}>
                <SelectValue placeholder={loadingDepartamentos ? "Cargando..." : "Seleccionar departamento"}>
                  {pageMode === 'view' && departamento ?
                    departamentos.find(dept => dept.id.toString() === departamento)?.nombre || departamento :
                    undefined
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent style={{ color: "#1f2937", backgroundColor: "#ffffff" }}>
                {departamentos.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()} style={{ color: "#1f2937" }}>
                    {dept.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="provincia">Provincia <span className="text-red-400">*</span></Label>
            <Select 
              value={provincia} 
              onValueChange={handleProvinciaChange} 
              disabled={isLoading || !departamento || pageMode === 'view'}
            >
              <SelectTrigger id="provincia" className="" style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1, color: 'black', cursor: 'pointer' } : { cursor: 'pointer' }}>
                <SelectValue placeholder={departamento ? "Seleccionar provincia" : "Primero seleccione un departamento"}>
                  {pageMode === 'view' && provincia ?
                    provincias.find(prov => prov.id.toString() === provincia)?.nombre || provincia :
                    undefined
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent style={{ color: "#1f2937", backgroundColor: "#ffffff" }}>
                {provincias.map((prov) => (
                  <SelectItem key={prov.id} value={prov.id.toString()} style={{ color: "#1f2937" }}>
                    {prov.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="distrito">Distrito <span className="text-red-400">*</span></Label>
            <Select 
              value={distrito} 
              onValueChange={handleDistritoChange} 
              disabled={isLoading || !provincia || pageMode === 'view'}
            >
              <SelectTrigger id="distrito" className="" style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1, color: 'black', cursor: 'pointer' } : { cursor: 'pointer' }}>
                <SelectValue placeholder={provincia ? "Seleccionar distrito" : "Primero seleccione una provincia"}>
                  {pageMode === 'view' && distrito ?
                    distritos.find(dist => dist.distrito_id.toString() === distrito)?.nombre || distrito :
                    undefined
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent style={{ color: "#1f2937", backgroundColor: "#ffffff" }}>
                {distritos.map((dist) => (
                  <SelectItem key={dist.distrito_id} value={dist.distrito_id.toString()} style={{ color: "#1f2937" }}>
                    {dist.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="local">Local/Venue <span className="text-red-400">*</span></Label>
            <Select 
              value={localId} 
              onValueChange={setLocalId} 
              disabled={pageMode === 'view' || isLoading || !distrito || loadingLocales}
            >
              <SelectTrigger id="local" className="" style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1, color: 'black', cursor: 'pointer' } : { cursor: 'pointer' }}>
                <SelectValue placeholder={
                  !distrito ? "Primero seleccione un distrito" :
                  loadingLocales ? "Cargando locales..." :
                  localesPorDistrito.length === 0 ? "No hay locales disponibles" :
                  "Seleccionar un local disponible"
                }>
                  {getLocalDisplayText()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent style={{ color: "#1f2937", backgroundColor: "#ffffff" }}>
                {localesPorDistrito.map((local) => (
                  <SelectItem 
                    key={local.id} 
                    value={local.id.toString()}
                    style={{ color: "#1f2937" }}
                  >
                    {local.nombre} ({local.aforo} personas)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Fecha del Evento <span className="text-red-400">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={isLoading || pageMode === 'view'}
                  style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1, color: 'black', cursor: 'pointer' } : { cursor: 'pointer' }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaEvento ? (
                    format(fechaEvento, "PPP", { locale: es })
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fechaEvento}
                  onSelect={pageMode === 'view' ? undefined : setFechaEvento}
                  autoFocus
                  disabled={(date) => pageMode === 'view' || date < new Date()}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hora">Hora de inicio <span className="text-red-400">*</span></Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="hora"
                type="time"
                className="pl-10"
                value={horaEvento}
                onChange={(e) => setHoraEvento(e.target.value)}
                disabled={isLoading || pageMode === 'view'}
                style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1, color: 'black' } : {}}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="horaFin">Hora de fin <span className="text-red-400">*</span></Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="horaFin"
                type="time"
                className="pl-10"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                disabled={isLoading || pageMode === 'view'}
                style={pageMode === 'view' ? { backgroundColor: 'white', opacity: 1, color: 'black' } : {}}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="esNominal">Evento Nominal <span className="text-red-400">*</span></Label>
            <div className="flex items-center h-10">
              <Switch
                id="esNominal"
                checked={esNominal}
                onCheckedChange={setEsNominal}
                disabled={pageMode === 'view' || isLoading}
                className="data-[state=checked]:bg-green-600! data-[state=unchecked]:bg-gray-400! cursor-pointer"
              />
              <span className="ml-2 text-sm text-muted-foreground">
                {esNominal ? 'Activado' : 'Desactivado'}
              </span> 
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
