"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, MapPin, Building, Users, CheckCircle, XCircle } from "lucide-react"
import { useLocales } from "@/lib/hooks/locales"
import { departamentosService } from "@/lib/api/services/geografia"
import { provinciasService } from "@/lib/api/services/geografia"
import { distritosService } from "@/lib/api/services/geografia"
import { tiposLocalesService } from "@/lib/api/services/locales"
import { toast } from 'sonner'

export default function CrearLocalPage() {
  const [errors, setErrors] = useState({
    departamento: "",
    provincia: "",
    distrito: "",
    tipo: ""
  })
  const [errorNombre, setErrorNombre] = useState("");
  const [errorDireccion, setErrorDireccion] = useState("");
  const MAX_LENGTH_NOMBRE = 60;
  const MAX_LENGTH_DIRECCION = 120;

  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [pageMode, setPageMode] = useState<'create' | 'edit' | 'view'>('create')
  const [localId, setLocalId] = useState<number | null>(null)
  const { fetchLocalById, crearLocal, actualizarLocal } = useLocales()
  
  // Estados para dependencias
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [provincias, setProvincias] = useState<any[]>([])
  const [distritos, setDistritos] = useState<any[]>([])
  const [tiposLocales, setTiposLocales] = useState<any[]>([])
  const [todasLasProvincias, setTodasLasProvincias] = useState<any[]>([])
  const [todosLosDistritos, setTodosLosDistritos] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    departamento: "",
    provincia: "",
    distrito: "", 
    capacidad: "",
    tipo: "",
    estado: true
  })

  useEffect(() => {
    const initializePage = async () => {
      if (pageMode === 'create') {
        await cargarDependencias()
        setIsLoading(false)
      }
    }
    initializePage()
  }, [pageMode])


  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const editId = searchParams.get('edit')
    const viewId = searchParams.get('view')
    
    if (editId) {
      setPageMode('edit')
      setLocalId(Number(editId))
      loadLocalData(Number(editId))
    } else if (viewId) {
      setPageMode('view')
      setLocalId(Number(viewId))
      loadLocalData(Number(viewId))
    }
  }, [])

  // Función para cargar todas las dependencias usando llamadas directas a la API
  const cargarDependencias = async () => {
    try {
      const [departamentosData, provinciasData, distritosData, tiposData] = await Promise.all([
        departamentosService.listar(),
        provinciasService.listar(),
        distritosService.listar(),
        tiposLocalesService.listar()
      ])
      
      
      // Extraer los arrays de datos de las respuestas
      const departamentosArray = Array.isArray(departamentosData) ? departamentosData : departamentosData?.data || []
      const provinciasArray = Array.isArray(provinciasData) ? provinciasData : provinciasData?.data || []
      const distritosArray = Array.isArray(distritosData) ? distritosData : distritosData?.data || []
      const tiposArray = Array.isArray(tiposData) ? tiposData : tiposData?.data || []
      
      setDepartamentos(departamentosArray)
      setTodasLasProvincias(provinciasArray)
      setTodosLosDistritos(distritosArray)
      setTiposLocales(tiposArray)
      
      
      // Retornar los datos para uso inmediato
      return {
        departamentos: departamentosArray,
        provincias: provinciasArray,
        distritos: distritosArray,
        tipos: tiposArray
      }
    } catch (error) {
      console.error('Error cargando dependencias:', error)
      return {
        departamentos: [],
        provincias: [],
        distritos: [],
        tipos: []
      }
    }
  }

  // Función para cargar datos del local
  const loadLocalData = async (id: number) => {
    setIsLoading(true)
    try {
      // Cargar dependencias y local en paralelo
      const [dependencias, result] = await Promise.all([
        cargarDependencias(),
        fetchLocalById(id)
      ])
      
      if (result && result.success && result.data) {
        const localData = result.data
        
        // Usar los datos retornados directamente en lugar de los estados
        const distrito = dependencias.distritos.find((d: any) => d.id === localData.distrito_id)
        const provincia = distrito ? dependencias.provincias.find((p: any) => p.id === distrito.provincia_id) : null
        const departamento = provincia ? dependencias.departamentos.find((d: any) => d.id === provincia.departamento_id) : null
        
        // Llenar el formulario con todos los datos
        setFormData({
          nombre: localData.nombre || "",
          direccion: localData.direccion || "",
          departamento: departamento?.id ? departamento.id.toString() : "",
          provincia: provincia?.id ? provincia.id.toString() : "",
          distrito: localData.distrito_id ? localData.distrito_id.toString() : "",
          capacidad: localData.aforo ? localData.aforo.toString() : "",
          tipo: localData.tipo_local_id ? localData.tipo_local_id.toString() : "",
          estado: localData.activo !== undefined ? localData.activo : true
        })
        
        // Filtrar provincias y distritos usando los datos ya cargados
        if (departamento?.id) {
          const provinciasFiltradas = dependencias.provincias.filter((p: any) => p.departamento_id === departamento.id)
          setProvincias(provinciasFiltradas)
        }
        
        if (provincia?.id) {
          const distritosFiltrados = dependencias.distritos.filter((d: any) => d.provincia_id === provincia.id)
          setDistritos(distritosFiltrados)
        }
      } else {
        alert(`El local con ID ${id} no existe en la base de datos. Verifica que el ID sea correcto.`)
        router.push('/admin/locales')
      }
    } catch (error) {
      console.error('Error cargando local:', error)
      alert(`Error al cargar el local con ID ${id}. Es posible que no exista en la base de datos.`)
      router.push('/admin/locales')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Verificar límites de longitud
    if (name === "nombre") {
      if (value.length <= MAX_LENGTH_NOMBRE) {
        setFormData(prev => ({ ...prev, nombre: value }));
        setErrorNombre(value.length === MAX_LENGTH_NOMBRE ? "Has alcanzado el límite de 60 caracteres." : "");
      }
      return;
    }

    if (name === "direccion") {
      if (value.length <= MAX_LENGTH_DIRECCION) {
        setFormData(prev => ({ ...prev, direccion: value }));
        setErrorDireccion(value.length === MAX_LENGTH_DIRECCION ? "Has alcanzado el límite de 120 caracteres." : "");
      }
      return;
    }

    // Para los demás campos, comportamiento estándar
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value}))
    
    // Si se selecciona un departamento, filtrar las provincias correspondientes y limpiar provincia y distrito
    if (name === 'departamento' && typeof value === 'string') {
      setFormData(prev => ({ ...prev, [name]: value, provincia: "", distrito: "" }))
      if (value) {
        const provinciasFiltradas = todasLasProvincias.filter(p => p.departamento_id === parseInt(value))
        setProvincias(provinciasFiltradas)
      }
    }
    
    // Si se selecciona una provincia, filtrar los distritos correspondientes y limpiar distrito
    if (name === 'provincia' && typeof value === 'string') {
      setFormData(prev => ({ ...prev, [name]: value, distrito: "" }))
      if (value) {
        const distritosFiltrados = todosLosDistritos.filter(d => d.provincia_id === parseInt(value))
        setDistritos(distritosFiltrados)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Validaciones previas
    const newErrors: any = {}

    if (!formData.departamento) newErrors.departamento = "Debe seleccionar un departamento."
    if (!formData.provincia) newErrors.provincia = "Debe seleccionar una provincia."
    if (!formData.distrito) newErrors.distrito = "Debe seleccionar un distrito."
    if (!formData.tipo) newErrors.tipo = "Debe seleccionar un tipo de local."

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      const payload = {
        nombre: formData.nombre,
        direccion: formData.direccion,
        distrito_id: parseInt(formData.distrito),
        aforo: parseInt(formData.capacidad),
        tipo_local_id: parseInt(formData.tipo),
        activo: formData.estado
      }

      let result

      if (pageMode === 'edit' && localId) {
        // Actualizar local existente
        result = await actualizarLocal(localId, payload)
      } else {
        // Crear nuevo local
        result = await crearLocal(payload)
      }

      if (result.success) {
        toast.success(pageMode === 'edit' ? 'Local actualizado' : 'Local creado', {
          description: `El local se ha ${pageMode === 'edit' ? 'actualizado' : 'creado'} correctamente`
        })
        router.push("/admin/locales")
      } else {
        toast.error('Error al guardar', {
          description: result.detail || 'Error desconocido'
        })
      }
    } catch (error) {
      console.error(error)
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="loader mb-4"></div>
              <p className="text-muted-foreground">
                {pageMode === 'create' ? 'Cargando datos de ubicación...' : 
                 pageMode === 'edit' ? 'Cargando información del local...' : 
                 'Cargando información del local...'}
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/locales">
              <Button variant="ghost" size="sm" className="text-muted-foreground cursor-pointer">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Locales
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {pageMode === 'create' && 'Agregar Nuevo Local'}
            {pageMode === 'edit' && 'Editar Local'}
            {pageMode === 'view' && 'Detalles del Local'}
          </h1>
        </div>

        <Card className="max-w-3xl mx-auto border-border shadow-sm">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="text-xl text-foreground">Información del Local</CardTitle>
              <CardDescription className="mb-4">
                Ingrese los datos completos del local para su registro en el sistema
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre del local */}
                <div className="space-y-2 mb-2">
                  <Label htmlFor="nombre" className="text-sm font-medium">Nombre del local</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nombre"
                      name="nombre"
                      placeholder="Ej: Teatro Nacional"
                      className={`pl-10 ${pageMode === 'view' ? '!opacity-100 !bg-white !text-gray-900' : ''}`}
                      value={formData.nombre}
                      onChange={handleChange}
                      maxLength={MAX_LENGTH_NOMBRE}
                      required
                      disabled={pageMode === 'view'}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className={errorNombre ? "text-red-600" : "text-gray-500"}>
                      {errorNombre || `${formData.nombre.length}/${MAX_LENGTH_NOMBRE}`}
                    </span>
                  </div>
                </div>

                {/* Tipo de local */}
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="text-sm font-medium">Tipo de local</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => {
                      handleSelectChange("tipo", value)
                      setErrors(prev => ({ ...prev, tipo: "" })) // 👈 Limpia el error al seleccionar
                    }}
                    required
                    disabled={pageMode === 'view'}
                  >
                    <SelectTrigger id="tipo" className={`w-full ${pageMode === 'view' ? '!opacity-100 !bg-white !text-gray-900' : ''}`}>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposLocales.map((tipo) => (
                        <SelectItem key={tipo.id || tipo.tipo_local_id} value={(tipo.id || tipo.tipo_local_id || 0).toString()}>
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Mensaje de error si no se selecciona tipo */}
                  {errors.tipo && (
                    <p className="text-red-500 text-sm mt-1">{errors.tipo}</p>
                  )}
                </div>

                {/* Capacidad */}
                <div className="space-y-2">
                  <Label htmlFor="capacidad" className="text-sm font-medium">Capacidad (personas)</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="capacidad"
                      name="capacidad"
                      type="number"
                      placeholder="Ej: 1000"
                      className={`pl-10 ${pageMode === 'view' ? '!opacity-100 !bg-white !text-gray-900' : ''}`}
                      min="1"
                      value={formData.capacidad}
                      onChange={handleChange}
                      required
                      disabled={pageMode === 'view'}
                    />
                  </div>
                </div>

                {/* Departamento */}
                <div className="space-y-2">
                 <Label htmlFor="departamento" className="text-sm font-medium">Departamento</Label>
                  <Select
                    value={formData.departamento}
                    onValueChange={(value) => {
                      handleSelectChange("departamento", value)
                      setErrors(prev => ({ ...prev, departamento: "" })) // Limpia error al cambiar
                    }}
                    required
                    disabled={pageMode === 'view'}
                  >
                    <SelectTrigger id="departamento" className={`w-full ${pageMode === 'view' ? '!opacity-100 !bg-white !text-gray-900' : ''}`}>
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((departamento) => (
                        <SelectItem key={departamento.id || departamento.departamento_id} value={(departamento.id || departamento.departamento_id || 0).toString()}>
                          {departamento.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.departamento && (
                    <p className="text-red-500 text-sm mt-1">{errors.departamento}</p>
                  )}
                </div>

                {/* Provincia */}
                <div className="space-y-2">
                  <Label htmlFor="provincia" className="text-sm font-medium">Provincia</Label>
                    <Select
                      value={formData.provincia}
                      onValueChange={(value) => {
                        handleSelectChange("provincia", value)
                        setErrors(prev => ({ ...prev, provincia: "" }))
                      }}
                      required
                      disabled={pageMode === 'view' || !formData.departamento}
                    >
                      <SelectTrigger id="provincia" className={`w-full ${pageMode === 'view' ? '!opacity-100 !bg-white !text-gray-900' : ''}`}>
                        <SelectValue placeholder={formData.departamento ? "Seleccionar provincia" : "Primero seleccione un departamento"} />
                      </SelectTrigger>
                      <SelectContent>
                          {provincias.map((provincia) => (
                            <SelectItem key={provincia.id || provincia.provincia_id} value={(provincia.id || provincia.provincia_id || 0).toString()}>
                              {provincia.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {errors.provincia && (
                      <p className="text-red-500 text-sm mt-1">{errors.provincia}</p>
                    )}
                </div>

                {/* Distrito */}
                <div className="space-y-2">
                  <Label htmlFor="distrito" className="text-sm font-medium">Distrito</Label>
                    <Select
                      value={formData.distrito}
                      onValueChange={(value) => {
                        handleSelectChange("distrito", value)
                        setErrors(prev => ({ ...prev, distrito: "" }))
                      }}
                      required
                      disabled={pageMode === 'view' || !formData.provincia}
                    >
                      <SelectTrigger id="distrito" className={`w-full ${pageMode === 'view' ? '!opacity-100 !bg-white !text-gray-900' : ''}`}>
                        <SelectValue placeholder={formData.provincia ? "Seleccionar distrito" : "Primero seleccione una provincia"} />
                      </SelectTrigger>
                      <SelectContent>
                          {distritos.map((distrito) => (
                            <SelectItem key={distrito.id || distrito.distrito_id} value={(distrito.id || distrito.distrito_id || 0).toString()}>
                              {distrito.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {errors.distrito && (
                      <p className="text-red-500 text-sm mt-1">{errors.distrito}</p>
                    )}
                </div>

                {/* Dirección */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="direccion" className="text-sm font-medium">Dirección completa</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="direccion"
                      name="direccion"
                      placeholder="Ej: Av. Javier Prado 1234, San Isidro"
                      className={`pl-10 ${pageMode === 'view' ? '!opacity-100 !bg-white !text-gray-900' : ''}`}
                      value={formData.direccion}
                      onChange={handleChange}
                      maxLength={MAX_LENGTH_DIRECCION}
                      required
                      disabled={pageMode === 'view'}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className={errorDireccion ? "text-red-600" : "text-gray-500"}>
                      {errorDireccion || `${formData.direccion.length}/${MAX_LENGTH_DIRECCION}`}
                    </span>
                  </div>
                </div>

                {/* Estado */}
                <div className="space-y-2 md:col-span-2 mb-3">
                  <div className={`flex flex-row items-center justify-between rounded-lg border ${formData.estado ? 'border-primary/20' : 'border-gray-200'} p-3 shadow-sm`}>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Estado del local</Label>
                      <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                        {formData.estado ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={formData.estado ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                          {formData.estado ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center h-10">
                      <Switch
                        checked={formData.estado}
                        onCheckedChange={(checked) => handleSelectChange("estado", checked)}
                        className={`data-[state=unchecked]:bg-gray-300 hover:data-[state=unchecked]:bg-gray-400 data-[state=checked]:bg-primary ${pageMode === 'view' ? '!opacity-100' : ''}`}
                        disabled={pageMode === 'view'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between border-t pt-6">
              <Link href="/admin/locales" className="w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  {pageMode === 'view' ? 'Volver' : 'Cancelar'}
                </Button>
              </Link>
              
              {pageMode !== 'view' && (
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Guardando..." : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {pageMode === 'edit' ? 'Actualizar Local' : 'Guardar Local'}
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}