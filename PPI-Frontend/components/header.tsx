"use client"

import { ShoppingCart, Ticket, User, LogIn, Settings, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/stores/cart-store"
import { useIsAuthenticated, useUserInfo } from "@/lib/stores/auth-store"
import { useAuth } from "@/lib/hooks/auth"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"

export function Header() {
  const openCart = useCartStore(state => state.openCart)
  const totalItems = useCartStore(state => state.getTotalItems())
  const isAuthenticated = useIsAuthenticated()
  const userInfo = useUserInfo()
  const { logout } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    function handleOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node
      if (menuRef.current && !menuRef.current.contains(target) && buttonRef.current && !buttonRef.current.contains(target)) {
        setMenuOpen(false)
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])
  
  const isUserLoggedIn = mounted && isAuthenticated
  const isUserAdmin = mounted && userInfo?.role === 'admin'

  return (
    <header className="bg-background border-b px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        <div className="flex items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-primary cursor-pointer hover:text-primary/80 transition-colors">
              PatasPepasSoft
            </h1>
          </Link>
        </div>

        {/* Desktop actions: hidden on small screens */}
        <div className="hidden sm:flex items-center gap-2">
          {!isUserLoggedIn && (
            <Link href="/login" className="flex items-center gap-2 text-foreground transition-colors duration-150 rounded-md cursor-pointer hover-secondary px-2 py-1">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Iniciar Sesión</span>
            </Link>
          )}

          {isUserLoggedIn && !isUserAdmin && (
              <Link href="/tickets" className="flex items-center gap-2 text-foreground transition-colors duration-150 rounded-md cursor-pointer hover-secondary px-2 py-1">
                <Ticket className="h-4 w-4" />
                <span className="hidden sm:inline">Tickets</span>
              </Link>
            )}

          {isUserLoggedIn && !isUserAdmin && (
            <div
              onClick={() => { openCart(); }}
              className="flex items-center gap-2 relative text-foreground transition-colors duration-150 rounded-md cursor-pointer hover-secondary px-2 py-1"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Carrito</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 !bg-accent !text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
          )}
           {isUserAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-300 cursor-pointer transition-colors duration-150 ease-in-out"
              asChild
            >
              <Link href="/" className="cursor-pointer hover:bg-blue-300">
                <Ticket className="h-4 w-4" />
                <span className="hidden sm:inline">Vista de usuario</span>
              </Link>
            </Button>
          )}
          {isUserLoggedIn && (
              <Link
                href={isUserAdmin ? "/admin" : "/perfil"}
                className={`flex items-center gap-2 relative px-2 py-1 rounded-md cursor-pointer transition-colors duration-150 ${isUserAdmin ? 'bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900' : 'text-foreground hover-secondary'}`}
              >
                {isUserAdmin ? (
                  <>
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full px-1 font-bold">
                      ADMIN
                    </span>
                    <Settings className="h-4 w-4" />
                  </>
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{isUserAdmin ? "Panel" : "Perfil"}</span>
              </Link>
            )}

          {isUserLoggedIn && (
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors duration-150 ease-in-out"
              onClick={() => { logout(); }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          )}
        </div>

        {/* Mobile: burger button */}
        <div className="sm:hidden flex items-center gap-2">
          <button
            ref={buttonRef}
            aria-label="Menu"
            aria-haspopup={true}
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            className="p-2 rounded-md hover:bg-muted cursor-pointer"
            onClick={() => setMenuOpen(open => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div
          id="mobile-menu"
          ref={menuRef}
          role="menu"
          className={`sm:hidden absolute right-4 top-full mt-2 w-48 bg-background border rounded-md shadow-lg z-50 transform transition-all duration-150 origin-top-right ${menuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}`}
          aria-hidden={!menuOpen}
          tabIndex={-1}
        >
          <div className="flex flex-col py-2">
              {!isUserLoggedIn && (
                <Link href="/login" onClick={() => setMenuOpen(false)} role="menuitem" tabIndex={menuOpen ? 0 : -1} className="px-4 py-2 cursor-pointer flex items-center gap-2 rounded-md transition-colors duration-150 hover-secondary">
                  <LogIn className="h-4 w-4" /> Iniciar Sesión
                </Link>
              )}

              {isUserLoggedIn && !isUserAdmin && (
                <Link href="/tickets" onClick={() => setMenuOpen(false)} role="menuitem" tabIndex={menuOpen ? 0 : -1} className="px-4 py-2 cursor-pointer flex items-center gap-2 rounded-md transition-colors duration-150 hover-secondary">
                  <Ticket className="h-4 w-4" /> Tickets
                </Link>
              )}

              {isUserLoggedIn && !isUserAdmin && (
                <div onClick={() => { openCart(); setMenuOpen(false); }} role="menuitem" tabIndex={menuOpen ? 0 : -1} className="px-4 py-2 cursor-pointer flex items-center gap-2 rounded-md transition-colors duration-150 hover-secondary">
                  <ShoppingCart className="h-4 w-4" /> Carrito
                  {totalItems > 0 && (
                    <span className="ml-auto !bg-accent !text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </div>
              )}

              {isUserAdmin && (
                <Link href="/" onClick={() => setMenuOpen(false)} role="menuitem" tabIndex={menuOpen ? 0 : -1} className="px-4 py-2 hover:bg-blue-300 cursor-pointer flex items-center gap-2 text-blue-600 rounded-md transition-colors duration-150">
                  <Ticket className="h-4 w-4" /> Vista de usuario
                </Link>
              )}

              {isUserLoggedIn && (
                <Link href={isUserAdmin ? "/admin" : "/perfil"} onClick={() => setMenuOpen(false)} role="menuitem" tabIndex={menuOpen ? 0 : -1} className="px-4 py-2 cursor-pointer flex items-center gap-2 rounded-md transition-colors duration-150 hover-secondary">
                  {isUserAdmin ? <Settings className="h-4 w-4" /> : <User className="h-4 w-4" />} {isUserAdmin ? 'Panel' : 'Perfil'}
                </Link>
              )}

              {isUserLoggedIn && (
                <button onClick={() => { logout(); setMenuOpen(false); }} role="menuitem" tabIndex={menuOpen ? 0 : -1} className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer flex items-center gap-2 text-left rounded-md transition-colors duration-150">
                  <LogOut className="h-4 w-4" /> Salir
                </button>
              )}
            </div>
          </div>
      </div>
    </header>
  )
}
