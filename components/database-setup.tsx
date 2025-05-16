"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Database, RefreshCw } from "lucide-react"

export function DatabaseSetup() {
  const [status, setStatus] = useState<"checking" | "error" | "incomplete" | "complete">("checking")
  const [message, setMessage] = useState<string>("")
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const checkDatabaseStatus = async () => {
    setStatus("checking")
    setMessage("Verificando estado de la base de datos...")

    try {
      const response = await fetch("/api/db-check/status")
      const data = await response.json()

      if (!response.ok) {
        setStatus("error")
        setMessage(data.message || "Error al verificar estado de la base de datos")
        setDetails(data)
        return
      }

      if (!data.connection) {
        setStatus("error")
        setMessage("No se pudo conectar a la base de datos")
        setDetails(data)
        return
      }

      if (!data.tables.complete) {
        setStatus("incomplete")
        setMessage(`Faltan tablas por crear: ${data.tables.missing.join(", ")}`)
        setDetails(data)
        return
      }

      setStatus("complete")
      setMessage("Base de datos configurada correctamente")
      setDetails(data)
    } catch (error) {
      console.error("Error al verificar estado de la base de datos:", error)
      setStatus("error")
      setMessage("Error al verificar estado de la base de datos")
      setDetails({ error })
    }
  }

  const setupDatabase = async () => {
    setLoading(true)
    setMessage("Configurando base de datos...")

    try {
      // Crear función execute_sql
      const sqlFunctionResponse = await fetch("/api/db-setup/create-sql-function", {
        method: "POST",
      })

      if (!sqlFunctionResponse.ok) {
        const data = await sqlFunctionResponse.json()
        setStatus("error")
        setMessage(data.message || "Error al crear función execute_sql")
        setLoading(false)
        return
      }

      // Inicializar tablas
      const initResponse = await fetch("/api/db-setup/initialize", {
        method: "POST",
      })

      if (!initResponse.ok) {
        const data = await initResponse.json()
        setStatus("error")
        setMessage(data.message || "Error al inicializar tablas")
        setLoading(false)
        return
      }

      // Verificar estado nuevamente
      await checkDatabaseStatus()
      setLoading(false)
    } catch (error) {
      console.error("Error al configurar base de datos:", error)
      setStatus("error")
      setMessage("Error al configurar base de datos")
      setLoading(false)
    }
  }

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  return (
    <Card className="bg-blue-800/30 border border-blue-700/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Estado de la Base de Datos
        </CardTitle>
        <CardDescription className="text-blue-300">Verifica y configura la base de datos para Juntify</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "checking" && (
          <Alert className="bg-blue-900/50 border-blue-800 text-white">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            <AlertTitle>Verificando</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive" className="bg-red-900/50 border-red-800 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === "incomplete" && (
          <Alert className="bg-yellow-900/50 border-yellow-800 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuración incompleta</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === "complete" && (
          <Alert className="bg-green-900/50 border-green-800 text-white">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Configuración completa</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="border-blue-600 text-blue-300 hover:bg-blue-700/50"
          onClick={checkDatabaseStatus}
          disabled={status === "checking" || loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${status === "checking" ? "animate-spin" : ""}`} />
          Verificar estado
        </Button>

        {(status === "error" || status === "incomplete") && (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={setupDatabase} disabled={loading}>
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Configurando...
              </div>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Configurar base de datos
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
