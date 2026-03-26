"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BadgePercent, Ticket, TicketCheck, Info } from "lucide-react"
import { UserStatsCardsProps } from "@/lib/types/perfil"

export function UserStatsCards({ discount, totalPointsEarned, totalTickets, pointsLoading }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {/* Puntos con modal */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Ticket className="h-8 w-8 text-emerald-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  Puntos Acumulados
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 text-gray-400 hover:text-gray-600 p-0 cursor-pointer"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>¿Para qué sirven los puntos acumulados?</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <p className="text-sm text-gray-600">
                          Acumula puntos con cada compra y desbloquea rangos con mejores descuentos:
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <span className="text-2xl">🥉</span>
                            <div>
                              <p className="font-semibold text-orange-700">Bronce</p>
                              <p className="text-xs text-gray-600">250 - 499 puntos → 5% descuento</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg border border-slate-300">
                            <span className="text-2xl">🥈</span>
                            <div>
                              <p className="font-semibold text-slate-900">Plata</p>
                              <p className="text-xs text-gray-700">500 - 999 puntos → 10% descuento</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <span className="text-2xl">🥇</span>
                            <div>
                              <p className="font-semibold text-yellow-700">Oro</p>
                              <p className="text-xs text-gray-600">1,000+ puntos → 15% descuento</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {pointsLoading ? "..." : totalPointsEarned.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Descuento */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center">
            <BadgePercent className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Descuento</p>
              <p className="text-2xl font-bold text-gray-900">{discount}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center">
            <TicketCheck className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Tickets</p>
              <p className="text-2xl font-bold text-gray-900">
                {pointsLoading ? "..." : totalTickets}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

