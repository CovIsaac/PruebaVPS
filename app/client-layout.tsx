"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Footer } from "@/components/footer"
import { useMobile } from "@/hooks/use-mobile"
import { DesktopNavigation } from "@/components/desktop-navigation"
import { MobileNavigation } from "@/components/mobile-navigation"
import { usePathname } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isMobile = useMobile()
  const pathname = usePathname()

  return (
    <html lang="es">
      <body className={`${inter.className} ${isMobile ? "has-fixed-footer" : ""} bg-blue-900`}>
        {pathname !== "/login" && pathname !== "/register" && (
          <>
            <DesktopNavigation />
            {pathname !== "/" && <MobileNavigation />}
          </>
        )}
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
