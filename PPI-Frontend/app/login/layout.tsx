import type { ReactNode } from "react"
import { LoginBackground } from "./components/background"
import { Branding } from "./components/branding"

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4 relative">
      <LoginBackground />
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <Branding />
        {children}
      </div>
    </div>
  )
}
