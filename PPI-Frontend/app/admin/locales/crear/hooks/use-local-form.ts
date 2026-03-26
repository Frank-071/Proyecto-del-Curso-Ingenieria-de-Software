"use client"

import { useState } from 'react'
import { LocalFormData, LocalFormErrors, LocalDataFromAPI } from '@/lib/types/forms'

export function useLocalForm() {
  const [formData, setFormData] = useState<LocalFormData>({
    nombre: "",
    direccion: "",
    departamento: "",
    provincia: "",
    distrito: "",
    capacidad: "",
    tipo: "",
    estado: true
  })

  const [errors, setErrors] = useState<LocalFormErrors>({
    departamento: "",
    provincia: "",
    distrito: "",
    tipo: ""
  })

  const [errorNombre, setErrorNombre] = useState("")
  const [errorDireccion, setErrorDireccion] = useState("")

  const MAX_LENGTH_NOMBRE = 60
  const MAX_LENGTH_DIRECCION = 120

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Verificar límites de longitud
    if (name === "nombre") {
      if (value.length <= MAX_LENGTH_NOMBRE) {
        setFormData(prev => ({ ...prev, nombre: value }))
        setErrorNombre(value.length === MAX_LENGTH_NOMBRE ? "Has alcanzado el límite de 60 caracteres." : "")
      }
      return
    }

    if (name === "direccion") {
      if (value.length <= MAX_LENGTH_DIRECCION) {
        setFormData(prev => ({ ...prev, direccion: value }))
        setErrorDireccion(value.length === MAX_LENGTH_DIRECCION ? "Has alcanzado el límite de 120 caracteres." : "")
      }
      return
    }

    // Para los demás campos, comportamiento estándar
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value}))
  }

  const handleErrorClear = (field: string) => {
    setErrors(prev => ({ ...prev, [field]: "" }))
  }

  const setFormDataFromLocal = (localData: LocalDataFromAPI) => {
    setFormData({
      nombre: localData.nombre || "",
      direccion: localData.direccion || "",
      departamento: localData.departamento || "",
      provincia: localData.provincia || "",
      distrito: localData.distrito || "",
      capacidad: localData.capacidad || "",
      tipo: localData.tipo || "",
      estado: localData.estado !== undefined ? localData.estado : true
    })
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      direccion: "",
      departamento: "",
      provincia: "",
      distrito: "",
      capacidad: "",
      tipo: "",
      estado: true
    })
    setErrors({
      departamento: "",
      provincia: "",
      distrito: "",
      tipo: ""
    })
    setErrorNombre("")
    setErrorDireccion("")
  }

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    errorNombre,
    errorDireccion,
    MAX_LENGTH_NOMBRE,
    MAX_LENGTH_DIRECCION,
    handleChange,
    handleSelectChange,
    handleErrorClear,
    setFormDataFromLocal,
    resetForm
  }
}
