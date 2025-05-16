"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { NewNavbar } from "@/components/new-navbar"
import { GroupNavigation } from "@/components/group-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Clock, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function NewClassPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string
  const supabase = createClientComponentClient()

  const [title, setTitle] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [duration, setDuration] = useState("")
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  // Obtener el nombre de usuario
  useEffect(() => {
    const getUsername = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/login")
          return
        }

        const { data: profile } = await supabase.from("profiles").select("username").eq("id", session.user.id).single()

        if (profile) {
          setUsername(profile.username)
        }
      } catch (error) {
        console.error("Error al obtener el nombre de usuario:", error)
      }
    }

    getUsername()
  }, [router, supabase])

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError("El título es obligatorio")
      return
    }

    if (!date) {
      setError("La fecha es obligatoria")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Crear la nueva clase (meeting)
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Username": username || "",
        },
        body: JSON.stringify({
          title,
          date: date.toISOString(),
          duration,
          summary: summary.trim() || null,
          groupId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear la clase")
      }

      const data = await response.json()

      // Redirigir a la página de la clase
      router.push(`/groups/${groupId}/classes/${data.meetingId}`)
    } catch (err: any) {
      console.error("Error al crear la clase:", err)
      setError(err.message || "Error al crear la clase")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" className="mr-2 text-blue-300" asChild>
              <Link href={`/groups/${groupId}/classes`}>
                <ArrowLeft className="h-5 w-5 mr-1" />
                Volver
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-white glow-text">Nueva Clase</h1>
          </div>

          {/* Navegación del grupo */}
          <GroupNavigation groupId={groupId} />

          {/* Formulario */}
          <Card className="bg-blue-800/20 border-blue-700/30 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Crear nueva clase</CardTitle>
              <CardDescription className="text-blue-200/70">
                Completa la información para registrar una nueva clase en el grupo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-900/50 border border-red-800 text-white p-4 rounded-lg">
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-blue-200">
                    Título de la clase
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Introducción a la programación"
                    className="bg-blue-700/40 border-blue-600/50 text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-blue-200">
                      Fecha y hora
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-blue-600/50 text-white"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-blue-800 border-blue-700">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          className="text-white"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-blue-200">
                      Duración (opcional)
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        id="duration"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="Ej: 1h 30min"
                        className="pl-10 bg-blue-700/40 border-blue-600/50 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary" className="text-blue-200">
                    Resumen (opcional)
                  </Label>
                  <Textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Describe brevemente el contenido de la clase"
                    className="bg-blue-700/40 border-blue-600/50 text-white min-h-[120px]"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      "Crear clase"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <NewNavbar />
    </div>
  )
}
