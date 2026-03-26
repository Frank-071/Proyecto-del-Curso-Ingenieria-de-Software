import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
        <div className="w-full max-w-2xl space-y-8 animate-fadeInUp">
          {/* Card principal con el contenido 404 */}
          <Card className="w-full shadow-2xl border-0 bg-card/80 backdrop-blur-sm relative overflow-hidden">
            <CardHeader className="text-center space-y-4 pb-8">
              {/* Icono grande animado */}
              <div className="flex justify-center">
                <div className="relative w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center animate-float">
                  <FileQuestion className="w-16 h-16 text-primary" />
                </div>
              </div>
              
              {/* Número 404 grande */}
              <div className="space-y-2">
                <CardTitle className="text-6xl sm:text-7xl md:text-8xl font-black text-primary">
                  404
                </CardTitle>
                <CardDescription className="text-xl sm:text-2xl text-muted-foreground">
                  Página no encontrada
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-8">
              <p className="text-center text-muted-foreground text-base sm:text-lg">
                Oops, esta página no existe. ¡Vamos a llevarte de vuelta a los eventos!
              </p>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  asChild
                  className="w-full sm:w-auto h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Link href="/" className="flex items-center justify-center gap-2">
                    <Home className="h-5 w-5" />
                    Volver al Inicio
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto h-12 text-base font-semibold transition-all duration-200"
                >
                  <Link href="/" className="flex items-center justify-center gap-2">
                    <ArrowLeft className="h-5 w-5" />
                    Explorar Eventos
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

