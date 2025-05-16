"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export function AssemblyAIStatus() {
  const [status, setStatus] = useState<"loading" | "configured" | "not-configured" | "error">("loading")
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    const checkAssemblyAI = async () => {
      try {
        const response = await fetch("/api/assembly-ai-check")
        const data = await response.json()

        if (response.ok && data.configured) {
          setStatus("configured")
        } else {
          setStatus("not-configured")
        }

        setMessage(data.message || "")
      } catch (error) {
        console.error("Error al verificar AssemblyAI:", error)
        setStatus("error")
        setMessage("Error al verificar la configuración de AssemblyAI")
      }
    }

    checkAssemblyAI()
  }, [])

  if (status === "loading") {
    return (
      <Alert className="bg-blue-900/30 border-blue-800/50 text-blue-100">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Verificando configuración de AssemblyAI</AlertTitle>
        <AlertDescription>Comprobando la configuración de la API de transcripción...</AlertDescription>
      </Alert>
    )
  }

  if (status === "configured") {
    return (
      <Alert className="bg-green-900/30 border-green-800/50 text-green-100">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>AssemblyAI configurado correctamente</AlertTitle>
        <AlertDescription>La API de transcripción está lista para usar.</AlertDescription>
      </Alert>
    )
  }

  if (status === "not-configured" || status === "error") {
    return (
      <Alert className="bg-red-900/30 border-red-800/50 text-red-100">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error de configuración de AssemblyAI</AlertTitle>
        <AlertDescription>{message || "La API de transcripción no está configurada correctamente."}</AlertDescription>
      </Alert>
    )
  }

  return null
}
