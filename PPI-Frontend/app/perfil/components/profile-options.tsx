"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Ticket } from "lucide-react"
import Link from "next/link"

export function ProfileOptions() {
  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900">Accesos rápidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/perfil/micuenta" className="cursor-pointer">
            <Button
              variant="outline"
              className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
            >
              <Settings className="w-6 h-6" />
              <span className="font-medium">Actualización de Datos</span>
            </Button>
          </Link>

          <Link href="/tickets" className="cursor-pointer">
            <Button
              variant="outline"
              className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer"
            >
              <Ticket className="w-6 h-6" />
              <span className="font-medium">Mis Tickets</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

