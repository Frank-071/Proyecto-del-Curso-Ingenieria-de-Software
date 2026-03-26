import { Header } from "@/components/header"
import { CrearEventoForm } from "./components/CrearEventoForm"

export default function CrearEventoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CrearEventoForm />
    </div>
  )
}