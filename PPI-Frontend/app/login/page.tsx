import { LoginPanel } from "./components/LoginPanel"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-8 w-full px-4 sm:px-6 lg:px-0">
      <div className="lg:hidden text-center space-y-4 animate-fadeInUp order-1">
        <Link href="/">
          <h1 className="text-4xl font-black text-primary cursor-pointer hover:text-primary/80 transition-colors">
            PatasPepasSoft
          </h1>
        </Link>
        <p className="text-lg text-muted-foreground">Tu plataforma de confianza para eventos</p>
      </div>
      <div className="flex items-center justify-center w-full animate-fadeInUp order-2" style={{ animationDelay: "0.3s" }}>
        <LoginPanel />
      </div>
    </div>
  )
}

