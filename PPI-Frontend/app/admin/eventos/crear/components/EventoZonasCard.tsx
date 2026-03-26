import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Save, X, Edit } from "lucide-react"
import type { useEventoForm } from "../hooks/use-evento-form"

interface EventoZonasCardProps {
  form: ReturnType<typeof useEventoForm>
}

export function EventoZonasCard({ form }: EventoZonasCardProps) {
  const {
    pageMode,
    localId,
    tiposEntrada,
    nuevoTipo,
    editandoTipo,
    tipoEditado,
    localesPorDistrito,
    setNuevoTipo,
    setTipoEditado,
    handleAgregarTipoEntrada,
    handleEliminarTipoEntrada,
    handleEditarTipoEntrada,
    handleGuardarEdicionTipo,
    handleCancelarEdicionTipo,
    calcularCapacidadDisponible
  } = form

  const getStockDisponible = calcularCapacidadDisponible

  // Si estamos en modo view, no permitir edición
  const isViewMode = pageMode === 'view'
  const isEditMode = pageMode === 'edit'

  return (
    <Card className={isViewMode ? 'bg-muted/20' : ''}>
      <CardHeader>
        <CardTitle className="text-xl">Zonas del evento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {localId || (isViewMode && tiposEntrada.length > 0) ? (
          <>
            {!isViewMode && (
              <div className="text-sm text-muted-foreground">
                Stock disponible: <span className="font-semibold">{getStockDisponible()}</span> de {
                  localesPorDistrito.find(l => l.id === parseInt(localId))?.aforo || 0
                } personas
              </div>
            )}

            {tiposEntrada.length > 0 && (
              <Table className={isViewMode ? 'bg-muted/30' : ''}>
                <TableHeader>
                  <TableRow className={isViewMode ? 'bg-muted/50' : ''}>
                    <TableHead style={{ color: "#1f2937", backgroundColor: isViewMode ? "#e5e7eb" : "#f9fafb" }}>Zona</TableHead>
                    <TableHead style={{ color: "#1f2937", backgroundColor: isViewMode ? "#e5e7eb" : "#f9fafb" }}>Descripción</TableHead>
                    <TableHead style={{ color: "#1f2937", backgroundColor: isViewMode ? "#e5e7eb" : "#f9fafb" }}>Precio (S/)</TableHead>
                    <TableHead style={{ color: "#1f2937", backgroundColor: isViewMode ? "#e5e7eb" : "#f9fafb" }}>Stock</TableHead>
                    {!isViewMode && <TableHead style={{ color: "#1f2937", backgroundColor: isViewMode ? "#e5e7eb" : "#f9fafb", textAlign: "center" }}>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiposEntrada.map((tipo) => (
                    <TableRow key={tipo.id} className={`h-16 ${isViewMode ? 'bg-muted/20' : ''}`}>
                      {editandoTipo === tipo.id && tipoEditado ? (
                        // Modo edición
                        <>
                          <TableCell className="align-middle">
                            <Input
                              value={tipoEditado.nombre}
                              onChange={(e) => setTipoEditado({ ...tipoEditado, nombre: e.target.value })}
                              className="w-full h-10 text-sm"
                            />
                          </TableCell>
                          <TableCell className="align-middle">
                            <Input
                              value={tipoEditado.descripcion}
                              onChange={(e) => setTipoEditado({ ...tipoEditado, descripcion: e.target.value })}
                              className="w-full h-10 text-sm"
                              placeholder="Descripción de la zona"
                            />
                          </TableCell>
                          <TableCell className="align-middle">
                            <Input
                              type="number"
                              value={tipoEditado.precio}
                              onChange={(e) => setTipoEditado({ ...tipoEditado, precio: parseFloat(e.target.value) })}
                              className="w-full h-10 text-sm"
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell className="align-middle">
                            <Input
                              type="number"
                              value={tipoEditado.capacidad}
                              onChange={(e) => setTipoEditado({ ...tipoEditado, capacidad: parseInt(e.target.value) })}
                              className="w-full h-10 text-sm"
                              min="0"
                              max={getStockDisponible() + tipo.capacidad}
                            />
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex gap-1 justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                style={{ cursor: 'pointer' }}
                                onClick={handleGuardarEdicionTipo}
                                disabled={
                                  !tipoEditado.nombre ||
                                  !tipoEditado.precio ||
                                  !tipoEditado.capacidad ||
                                  tipoEditado.capacidad > (getStockDisponible() + tipo.capacidad)
                                }
                              >
                                <Save className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                style={{ cursor: 'pointer' }}
                                onClick={handleCancelarEdicionTipo}
                              >
                                <X className="h-4 w-4 text-gray-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        // Modo visualización
                        <>
                          <TableCell className="font-medium align-middle h-16">{tipo.nombre}</TableCell>
                          <TableCell className="align-middle h-16">{tipo.descripcion || "-"}</TableCell>
                          <TableCell className="align-middle h-16">S/ {tipo.precio}</TableCell>
                          <TableCell className="align-middle h-16">{tipo.capacidad}</TableCell>
                          {!isViewMode && (
                            <TableCell className="align-middle">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => !isViewMode && handleEditarTipoEntrada(tipo)}
                                  disabled={isViewMode}
                                >
                                  <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => !isViewMode && handleEliminarTipoEntrada(tipo.id)}
                                  disabled={isViewMode}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isViewMode && <Separator className="my-4" />}

            {!isViewMode && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombreTipo">Nombre de la Zona <span className="text-red-400">*</span></Label>
                    <Input
                      id="nombreTipo"
                      placeholder="Ej. VIP"
                      value={nuevoTipo.nombre}
                      onChange={(e) => setNuevoTipo({ ...nuevoTipo, nombre: e.target.value })}
                    />
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="precioTipo">Precio (S/) <span className="text-red-400">*</span></Label>
                    <Input
                      id="precioTipo"
                      type="number"
                      min="0"
                      placeholder="Ej. 150"
                      value={nuevoTipo.precio || ""}
                      onChange={(e) => setNuevoTipo({ ...nuevoTipo, precio: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacidadTipo">Stock <span className="text-red-400">*</span></Label>
                    <Input
                      id="capacidadTipo"
                      type="number"
                      min="0"
                      max={getStockDisponible()}
                      placeholder="Ej. 500"
                      value={nuevoTipo.capacidad || ""}
                      onChange={(e) => setNuevoTipo({ ...nuevoTipo, capacidad: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcionTipo">Descripción <span className="text-red-400">*</span></Label>
                  <Textarea
                    id="descripcionTipo"
                    placeholder="Describe los beneficios de esta zona..."
                    value={nuevoTipo.descripcion}
                    onChange={(e) => setNuevoTipo({ ...nuevoTipo, descripcion: e.target.value })}
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleAgregarTipoEntrada}
                  className="w-full"
                  style={{ cursor: 'pointer' }}
                  disabled={
                    !nuevoTipo.nombre.trim() ||
                    !nuevoTipo.precio ||
                    !nuevoTipo.capacidad ||
                    !nuevoTipo.descripcion.trim() ||
                    nuevoTipo.capacidad > getStockDisponible()
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir Zona
                </Button>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Selecciona primero un local para definir las zonas del evento.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
