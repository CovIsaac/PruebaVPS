"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Book, Users, Settings } from "lucide-react"

interface GroupNavigationProps {
  groupId: string
}

export function GroupNavigation({ groupId }: GroupNavigationProps) {
  const [userRole, setUserRole] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Obtener el rol del usuario en la organización
    const fetchUserRole = async () => {
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

    fetchUserRole()
  }, [])

  // Verificar si el usuario es profesor (no es estudiante)
  const isTeacher = userRole && !userRole.toLowerCase().includes("student")

  // Elementos de navegación para todos los usuarios
  const commonNavItems = [{ name: "Clases", href: `/groups/${groupId}/classes`, icon: <Book className="h-5 w-5" /> }]

  // Elementos de navegación solo para profesores
  const teacherNavItems = isTeacher
    ? [
        { name: "Miembros", href: `/groups/${groupId}/members`, icon: <Users className="h-5 w-5" /> },
        { name: "Configuración", href: `/groups/${groupId}/settings`, icon: <Settings className="h-5 w-5" /> },
      ]
    : []

  // Combinar los elementos según el rol
  const navItems = [...commonNavItems, ...teacherNavItems]

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="flex overflow-x-auto">
        {navItems.map((item) => {
          const isActive = pathname.includes(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-blue-500 text-blue-600 font-medium"
                  : "border-transparent text-gray-600 hover:text-blue-500 hover:border-blue-200"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
