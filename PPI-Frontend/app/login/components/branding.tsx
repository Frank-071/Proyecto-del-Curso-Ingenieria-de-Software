import React from "react"
import Link from "next/link"
import { Ticket, Music, Calendar, Users } from "lucide-react"

export const Branding: React.FC = () => (
  <div className="hidden lg:flex flex-col items-center justify-center space-y-8 animate-fadeInUp">
    <div className="text-center space-y-4">
      <Link href="/">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary cursor-pointer hover:text-primary/80 transition-colors">
          PatasPepasSoft
        </h1>
      </Link>
      <p className="text-xl text-muted-foreground max-w-md ml-8">
        Tu plataforma de confianza para la compra de entradas a los mejores eventos
      </p>
    </div>
    <div className="relative w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center animate-float">
      <div className="grid grid-cols-2 gap-4 p-8">
        <div className="bg-primary/30 p-4 rounded-2xl flex items-center justify-center animate-float" style={{ animationDelay: "0.5s" }}>
          <Ticket className="w-8 h-8 text-primary" />
        </div>
        <div className="bg-accent/30 p-4 rounded-2xl flex items-center justify-center animate-float" style={{ animationDelay: "1s" }}>
          <Music className="w-8 h-8 text-accent" />
        </div>
        <div className="bg-accent/30 p-4 rounded-2xl flex items-center justify-center animate-float" style={{ animationDelay: "1.5s" }}>
          <Calendar className="w-8 h-8 text-accent" />
        </div>
        <div className="bg-primary/30 p-4 rounded-2xl flex items-center justify-center animate-float" style={{ animationDelay: "2s" }}>
          <Users className="w-8 h-8 text-primary" />
        </div>
      </div>
    </div>
  </div>
)
