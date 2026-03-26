"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useProfileData } from "@/lib/hooks/profile"
import { useUserStore } from "@/lib/stores/user-store"

export function DeleteAccount() {
  const router = useRouter()
  const userId = useUserStore((state) => state.user?.id)
  const { deactivateAccount, deleteAccount } = useProfileData(userId || "")

  const [openDelete, setOpenDelete] = useState(false)
  const [deleteText, setDeleteText] = useState("")
  const [ackDelete, setAckDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const canConfirmDelete = deleteText === "ELIMINAR" && ackDelete
  
  const handleDeactivate = async () => {
    try {
      await deactivateAccount()
    } catch (error) {
      
    }
  }
  
  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteAccount()
      setOpenDelete(false)
      router.push("/perfil?tab=info")
    } catch (error) {
      
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className="rounded-lg border shadow-sm">
        <CardHeader><CardTitle>Eliminar cuenta</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">Puedes desactivar tu cuenta o solicitar su eliminación.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="text-red-600 border-red-300" onClick={handleDeactivate}>
              Desactivar cuenta
            </Button>
            <Button variant="destructive" onClick={() => setOpenDelete(true)}>Eliminar cuenta</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader><DialogTitle>Eliminar cuenta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-700">Esta acción es irreversible. Escribe <strong>ELIMINAR</strong> y marca la casilla para continuar.</p>
            <div>
              <Label htmlFor="deleteText">Confirmación</Label>
              <Input id="deleteText" value={deleteText} onChange={(e) => setDeleteText(e.target.value.toUpperCase())} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={ackDelete} onChange={(e) => setAckDelete(e.target.checked)} />
              Acepto que mi cuenta se eliminará y no podré recuperarla
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)} disabled={isDeleting}>Cancelar</Button>
            <Button variant="destructive" disabled={!canConfirmDelete || isDeleting} onClick={confirmDelete}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
