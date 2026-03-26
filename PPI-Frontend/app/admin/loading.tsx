import { Header } from "@/components/header"
import { PageSpinner } from "@/components/ui/page-spinner"

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageSpinner message="Cargando panel de administración..." />
    </div>
  )
}
