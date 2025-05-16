"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, FileText, User, PlusCircle, Download, MessageSquare, Users } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"

export function DesktopNavigation() {
  const [session, setSession] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Verificar si hay una sesión activa
    const checkSession = async () => {
      try {
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

  useEffect(() => {
    // Obtener el rol del usuario cuando la sesión esté disponible
    const fetchUserRole = async () => {
      if (session?.user?.id) {
        try {
          // Obtener información del usuario desde la API
          const response = await fetch("/api/users/me")
          const userData = await response.json()

          // Verificar si el usuario tiene una organización y un rol
          if (userData.organization?.role) {
            setUserRole(userData.organization.role)
          }
        } catch (error) {
          console.error("Error al obtener el rol del usuario:", error)
        }
      }
    }

    fetchUserRole()
  }, [session])

  // No mostrar en la página de login o si no hay sesión
  if (pathname === "/login" || pathname === "/") {
    return null
  }

  // Verificar si el usuario es profesor (no es estudiante)
  const isTeacher = userRole && !userRole.toLowerCase().includes("student")

  // Elementos de navegación comunes para todos los usuarios
  const commonNavItems = [
    { name: "Perfil", href: "/profile", icon: <User className="h-5 w-5" /> },
    { name: "Grupos", href: "/organization", icon: <Users className="h-5 w-5" /> },
  ]

  // Elementos de navegación solo para profesores
  const teacherNavItems = isTeacher
    ? [
        { name: "Reuniones", href: "/dashboard", icon: <Calendar className="h-5 w-5" /> },
        { name: "Nueva Reunión", href: "/new-meeting", icon: <PlusCircle className="h-5 w-5" /> },
        { name: "Transcripciones", href: "/transcriptions", icon: <FileText className="h-5 w-5" /> },
        { name: "Exportar", href: "/export", icon: <Download className="h-5 w-5" /> },
        { name: "Asistente IA", href: "/ai-assistant", icon: <MessageSquare className="h-5 w-5" /> },
      ]
    : []

  // Combinar los elementos según el rol
  const navItems = [...commonNavItems, ...teacherNavItems]

  return (
    <header className="bg-upslp-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/profile" className="flex items-center space-x-3">
            <div className="relative h-10 w-10 overflow-hidden">
              <Image src="/juntify-logo.png" alt="Juntify Logo" width={40} height={40} className="object-contain" />
            </div>
            <span className="font-bold text-xl">Juntify UPSLP</span>
          </Link>

          {/* Navegación */}
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
                    isActive ? "bg-upslp-700 text-orange-300" : "text-white hover:bg-upslp-700/50"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
