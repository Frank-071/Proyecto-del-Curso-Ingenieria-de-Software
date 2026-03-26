import { Header } from "@/components/header"
import { PageSpinner } from "@/components/ui/page-spinner"

export default function LocalesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageSpinner message="Cargando locales..." />
    </div>
  )
}
