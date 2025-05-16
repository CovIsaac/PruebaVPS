"use client"

import { useMobile } from "@/hooks/use-mobile"
import { Home, Calendar, FileText, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabaseClient"
import Image from "next/image"

export function Footer() {
  const isMobile = useMobile()
  const pathname = usePathname()

  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // Verificar si hay una sesión activa
    const checkSession = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data } = await supabase.auth.getSession()
        setSession(data.session)

        // Suscribirse a cambios en la autenticación
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session)
        })

        return () => {
          authListener?.subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error al verificar la sesión:", error)
      }
    }

    checkSession()
  }, [])

  // Si estamos en la página de login, register o en la página de inicio sin sesión, no mostramos el footer
  if (pathname === "/login" || pathname === "/register" || (pathname === "/" && !session)) {
    return null
  }

  // Footer para móvil (barra de navegación fija)
  if (isMobile) {
    return (
      <>
        <div className="h-16" /> {/* Espacio para evitar que el contenido quede detrás del footer fijo */}
        <footer className="fixed bottom-0 left-0 right-0 bg-upslp-600 text-white z-50 shadow-lg">
          <nav className="flex justify-around items-center h-16">
            <Link
              href="/"
              className={`flex flex-col items-center p-2 ${pathname === "/" ? "text-orange-300" : "text-white"}`}
            >
              <Home size={24} />
              <span className="text-xs mt-1">Inicio</span>
            </Link>
            <Link
              href="/dashboard"
              className={`flex flex-col items-center p-2 ${pathname === "/dashboard" ? "text-orange-300" : "text-white"}`}
            >
              <Calendar size={24} />
              <span className="text-xs mt-1">Reuniones</span>
            </Link>
            <Link
              href="/building-transcriptions"
              className={`flex flex-col items-center p-2 ${
                pathname === "/building-transcriptions" ? "text-orange-300" : "text-white"
              }`}
            >
              <FileText size={24} />
              <span className="text-xs mt-1">Transcripciones</span>
            </Link>
            <Link
              href="/profile"
              className={`flex flex-col items-center p-2 ${pathname === "/profile" ? "text-orange-300" : "text-white"}`}
            >
              <User size={24} />
              <span className="text-xs mt-1">Perfil</span>
            </Link>
          </nav>
        </footer>
      </>
    )
  }

  // Footer para desktop
  return (
    <footer className="bg-upslp-700 text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center mb-4">
              <div className="relative h-12 w-12 mr-3">
                <Image src="/juntify-logo.png" alt="Juntify Logo" width={48} height={48} className="object-contain" />
              </div>
              <h3 className="text-lg font-bold">Juntify UPSLP</h3>
            </div>
            <p className="text-sm text-gray-300 text-center md:text-left">
              Plataforma educativa para la Universidad Politécnica de San Luis Potosí. Facilita la transcripción,
              análisis y consulta de clases mediante IA.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Enlaces rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-sm text-gray-300 hover:text-orange-300">
                  Reuniones
                </Link>
              </li>
              <li>
                <Link href="/organization" className="text-sm text-gray-300 hover:text-orange-300">
                  Grupos
                </Link>
              </li>
              <li>
                <Link href="/transcriptions" className="text-sm text-gray-300 hover:text-orange-300">
                  Transcripciones
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Contacto</h3>
            <p className="text-sm text-gray-300">
              Universidad Politécnica de San Luis Potosí
              <br />
              San Luis Potosí, México
              <br />
              soporte@juntify-upslp.edu.mx
            </p>
          </div>
        </div>
        <div className="border-t border-upslp-500 mt-8 pt-4 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Juntify UPSLP. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
