import { Header } from "@/components/header"
import { PageSpinner } from "@/components/ui/page-spinner"

export default function EventosLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageSpinner message="Cargando eventos..." />
    </div>
  )
}
