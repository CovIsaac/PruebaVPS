import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./client-layout"

export const metadata: Metadata = {
  title: "Juntify - Reuniones Organizadas Inteligentes",
  description: "Eficiencia • Simplicidad • Organización",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}
