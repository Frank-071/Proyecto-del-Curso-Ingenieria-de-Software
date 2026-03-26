"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CardFooter } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import { LocalFormFooterProps } from "@/lib/types/forms"

export function LocalFormFooter({
  pageMode,
  isLoading
}: LocalFormFooterProps) {
  return (
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
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 cursor-pointer"
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
  )
}
