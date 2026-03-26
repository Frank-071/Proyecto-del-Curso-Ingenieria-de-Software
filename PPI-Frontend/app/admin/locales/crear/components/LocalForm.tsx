"use client"

import React from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useLocalForm } from "../hooks/use-local-form"
import { useLocalLoader } from "../hooks/use-local-loader"
import { useLocalUbicacion } from "../hooks/use-local-ubicacion"
import { useLocalSubmit } from "../hooks/use-local-submit"
import { LocalBasicoCard } from "./LocalBasicoCard"
import { LocalUbicacionCard } from "./LocalUbicacionCard"
import { LocalDireccionCard } from "./LocalDireccionCard"
import { LocalEstadoCard } from "./LocalEstadoCard"
import { LocalFormFooter } from "./LocalFormFooter"
import { ElegantSpinner } from "@/components/ui/elegant-spinner"

export function LocalForm() {
  // Hook para manejo del formulario
  const {
    formData,
    errors,
    setErrors,
    errorNombre,
    errorDireccion,
    MAX_LENGTH_NOMBRE,
    MAX_LENGTH_DIRECCION,
    handleChange,
    handleSelectChange,
    handleErrorClear,
    setFormDataFromLocal
  } = useLocalForm()

  // Hook para carga de datos y dependencias
  const {
    isLoading,
    setIsLoading,
    pageMode,
    localId,
    dependencies,
    loadLocalData
  } = useLocalLoader()

  // Hook para lógica de ubicación
  const {
    provincias,
    distritos,
    handleDepartamentoChange,
    handleProvinciaChange,
    setProvinciasFromDepartamento,
    setDistritosFromProvincia
  } = useLocalUbicacion(dependencies)

  // Hook para envío del formulario
  const { handleSubmit } = useLocalSubmit()

  // Manejar envío del formulario
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSubmit(formData, pageMode, localId, setErrors, setIsLoading)
  }

  // Cargar datos del local cuando se detecte un ID
  const loadLocalDataAndPopulate = async (id: number) => {
    const result = await loadLocalData(id)
    if (result) {
      const { localData, departamento, provincia, distrito } = result
      
      // Configurar ubicación filtrada
      if (departamento?.id) {
        setProvinciasFromDepartamento(departamento.id)
      }
      if (provincia?.id) {
        setDistritosFromProvincia(provincia.id)
      }

      // Poblar formulario con datos del local
      setFormDataFromLocal({
        nombre: localData.nombre || "",
        direccion: localData.direccion || "",
        departamento: departamento?.id ? departamento.id.toString() : "",
        provincia: provincia?.id ? provincia.id.toString() : "",
        distrito: localData.distrito_id ? localData.distrito_id.toString() : "",
        capacidad: localData.aforo ? localData.aforo.toString() : "",
        tipo: localData.tipo_local_id ? localData.tipo_local_id.toString() : "",
        estado: localData.activo !== undefined ? localData.activo : true
      })
    }
  }

  // Efecto para cargar datos cuando hay un localId
  React.useEffect(() => {
    if (localId && (pageMode === 'edit' || pageMode === 'view')) {
      loadLocalDataAndPopulate(localId)
    }
  }, [localId, pageMode])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex justify-center items-center h-screen">
          <ElegantSpinner 
            size="md"
            message={
              pageMode === 'create' ? 'Cargando datos de ubicación...' : 
              pageMode === 'edit' ? 'Cargando información del local...' : 
              'Cargando información del local...'
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        
        {/* -------- INICIO DEL CAMBIO SOLICITADO -------- */}
        {/* Contenedor Flex para alinear botón y título horizontalmente */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/locales">
            <Button 
              size="icon" 
              className="bg-primary hover:bg-primary/90 cursor-pointer h-10 w-10 border-0 shadow-sm"
              title="Volver a Locales"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-foreground mt-1">
            {pageMode === 'create' && 'Agregar Nuevo Local'}
            {pageMode === 'edit' && 'Editar Local'}
            {pageMode === 'view' && 'Detalles del Local'}
          </h1>
        </div>
        {/* -------- FIN DEL CAMBIO SOLICITADO -------- */}

        <Card className="max-w-3xl mx-auto border-border shadow-sm">
          <form onSubmit={onSubmit}>
            <CardHeader>
              <CardTitle className="text-xl text-foreground">Información del Local</CardTitle>
              <CardDescription className="mb-4">
                Ingrese los datos completos del local para su registro en el sistema
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información básica */}
                <LocalBasicoCard
                  formData={formData}
                  tiposLocales={dependencies.tiposLocales}
                  errors={errors}
                  pageMode={pageMode}
                  onInputChange={handleChange}
                  onSelectChange={handleSelectChange}
                  onErrorClear={handleErrorClear}
                  errorNombre={errorNombre}
                  maxLengthNombre={MAX_LENGTH_NOMBRE}
                />

                {/* Ubicación */}
                <LocalUbicacionCard
                  formData={formData}
                  departamentos={dependencies.departamentos}
                  provincias={pageMode === 'view' || pageMode === 'edit' ? dependencies.provincias : provincias}
                  distritos={pageMode === 'view' || pageMode === 'edit' ? dependencies.distritos : distritos}
                  errors={errors}
                  pageMode={pageMode}
                  onSelectChange={handleSelectChange}
                  onErrorClear={handleErrorClear}
                  onDepartamentoChange={(departamentoId) => handleDepartamentoChange(departamentoId, handleSelectChange)}
                  onProvinciaChange={(provinciaId) => handleProvinciaChange(provinciaId, handleSelectChange)}
                />

                {/* Dirección (ocupa 2 columnas) */}
                <div className="md:col-span-2">
                  <LocalDireccionCard
                    formData={formData}
                    pageMode={pageMode}
                    onInputChange={handleChange}
                    onErrorClear={handleErrorClear}
                    errorDireccion={errorDireccion}
                    maxLengthDireccion={MAX_LENGTH_DIRECCION}
                  />
                </div>

                {/* Estado (ocupa 2 columnas) */}
                <div className="md:col-span-2">
                  <LocalEstadoCard
                    formData={formData}
                    pageMode={pageMode}
                    onSelectChange={handleSelectChange}
                  />
                </div>
              </div>
            </CardContent>

            <LocalFormFooter
              pageMode={pageMode}
              isLoading={isLoading}
            />
          </form>
        </Card>
      </main>
    </div>
  )
}
