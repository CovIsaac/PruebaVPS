"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNavigation() {
  const pathname = usePathname()

  // Simplified navigation - only showing Profile and Groups
  const navItems = [
    {
      label: "Perfil",
      href: "/profile",
      icon: User,
    },
    {
      label: "Grupos",
      href: "/organization",
      icon: Users,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-upslp-500 bg-upslp-600/80 backdrop-blur-md p-2 sm:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg p-2 transition-colors",
              pathname === item.href
                ? "text-orange-300 bg-upslp-700/50"
                : "text-white hover:text-orange-200 hover:bg-upslp-700/30",
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
