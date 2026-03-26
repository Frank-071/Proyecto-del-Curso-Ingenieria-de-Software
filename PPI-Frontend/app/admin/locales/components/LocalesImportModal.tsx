"use client"

import { Loader2 } from "lucide-react"

interface LocalesImportModalProps {
  isOpen: boolean
  onClose: () => void
  file: File | null
  isValid: boolean
  validationErrors: string[] | null
  insertedRows: string[] | null
  isLoading: boolean
  onFileChange: (file: File | null) => void
  onImport: () => Promise<void>
}

export function LocalesImportModal({
  isOpen,
  onClose,
  file,
  isValid,
  validationErrors,
  insertedRows,
  isLoading,
  onFileChange,
  onImport,
}: LocalesImportModalProps) {
  if (!isOpen) return null

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    onFileChange(selectedFile)
  }

  const handleCancel = () => {
    if (!isLoading) {
      onClose()
    }
  }

  const handleImport = async () => {
    if (!isLoading && file) {
      await onImport()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[38rem] max-h-[80vh] overflow-y-auto p-8 border border-gray-100 animate-fadeIn">
        <h2 className="text-xl font-semibold text-gray-800 mb-1 flex items-center gap-2">
          Importar locales
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Sube tu archivo <span className="font-medium text-yellow-600">Excel (.xlsx)</span> o <span className="font-medium text-yellow-600">CSV</span>.
        </p>
        
        {/* 🔗 Enlace a la plantilla */}
        <a
          href="/Plantilla.xlsx"
          download="Plantilla.xlsx"
          className="inline-flex items-center gap-2 text-sm font-medium text-yellow-600 hover:text-yellow-700 transition mb-5"
        >
          📄 Descargar plantilla de ejemplo
        </a>
        
        {/* Selector de archivo */}
        <label className="block w-full mb-4">
          <div className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl p-4 transition ${
            isLoading 
              ? "border-gray-200 bg-gray-50 cursor-not-allowed" 
              : "border-gray-300 cursor-pointer hover:border-yellow-500"
          }`}>
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileInputChange}
              disabled={isLoading}
              className="hidden"
              id="file-upload"
            />
            <label 
              htmlFor="file-upload" 
              className={`text-sm cursor-pointer ${
                isLoading 
                  ? "text-gray-400 cursor-not-allowed pointer-events-none" 
                  : "text-gray-600"
              }`}
            >
              {file ? (
                <span className="font-medium text-green-700">
                  📄 {file.name}
                </span>
              ) : (
                <span className={isLoading ? "text-gray-400" : "text-gray-500"}>
                  {isLoading ? "Procesando archivo..." : "Haz clic aquí para subir un archivo"}
                </span>
              )}
            </label>
          </div>
        </label>

        {/* Estado de validación */}
        {file && !isValid && !validationErrors && !isLoading && (
          <p className="text-sm text-gray-600 mb-3">
            Archivo listo para validar.
          </p>
        )}

        {/* Estado de carga */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 mb-4 py-2">
            <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
            <p className="text-sm text-gray-600">
              Procesando archivo...
            </p>
          </div>
        )}

        {/* Insertados / omitidos */}
        {insertedRows && insertedRows.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-700 font-semibold text-sm mb-1">Registros insertados / omitidos:</p>
            <ul className="text-sm text-green-600 list-disc list-inside max-h-28 overflow-y-auto">
              {insertedRows.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Errores */}
        {validationErrors && validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 font-semibold text-sm mb-1">Errores encontrados:</p>
            <ul className="text-sm text-red-600 list-disc list-inside max-h-28 overflow-y-auto">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Validado */}
        {isValid && !validationErrors && (
          <div className="bg-green-50 border border-green-200 text-green-700 font-semibold rounded-lg text-sm p-3 mb-4">
            Archivo validado correctamente ✅
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-lg font-semibold bg-gray-200 text-gray-700 shadow-md 
                        hover:bg-gray-100 hover:shadow-lg hover:-translate-y-0.5 
                        active:translate-y-0 transform transition-all duration-200 
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-200 disabled:hover:shadow-md disabled:hover:translate-y-0
                        cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleImport}
            disabled={!file || isLoading}
            className={`px-5 py-2.5 rounded-lg font-semibold text-white shadow-md transform transition-all duration-200
              ${!file || isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-70"
                : "bg-yellow-500 hover:bg-yellow-400 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              }`}
          >
            Importar
          </button>
        </div>
      </div>
    </div>
  )
}

