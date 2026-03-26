import { PageSpinner } from "@/components/ui/page-spinner"

export default function LoadingAdminLogs() {
  return (
    <div className="py-20">
      <PageSpinner message="Cargando registros de errores..." />
    </div>
  )
}
