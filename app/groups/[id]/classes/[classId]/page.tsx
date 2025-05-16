"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { NewNavbar } from "@/components/new-navbar"
import { GroupNavigation } from "@/components/group-navigation"
import { ClassNavigation } from "@/components/class-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Clock, Users, Calendar, FileText, Loader2 } from "lucide-react"
import Link from "next/link"

// Tipos
interface Meeting {
  id: string
  title: string
  date: string
  duration?: string
  participants?: number
  summary?: string
}

interface Transcription {
  id: string
  meeting_id: string
  time: string
  speaker: string
  text: string
}

export default function ClassDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string
  const classId = params.classId as string

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar los detalles de la clase
  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener detalles de la clase
        const meetingResponse = await fetch(`/api/meetings/${classId}`)

        if (!meetingResponse.ok) {
          if (meetingResponse.status === 401) {
            router.push("/login")
            return
          }
          throw new Error(`Error ${meetingResponse.status}: ${await meetingResponse.text()}`)
        }

        const meetingData = await meetingResponse.json()
        setMeeting(meetingData)

        // Obtener transcripciones
        const transcriptionsResponse = await fetch(`/api/meetings/${classId}/transcription`)

        if (transcriptionsResponse.ok) {
          const transcriptionsData = await transcriptionsResponse.json()
          setTranscriptions(transcriptionsData)
        }
      } catch (err: any) {
        console.error("Error al cargar los detalles de la clase:", err)
        setError(err.message || "Error al cargar los detalles de la clase")
      } finally {
        setLoading(false)
      }
    }

    fetchClassDetails()
  }, [classId, router])

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "PPP", { locale: es })
  }

  // Formatear hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "p", { locale: es })
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" className="mr-2 text-blue-300" asChild>
              <Link href={`/groups/${groupId}/classes`}>
                <ArrowLeft className="h-5 w-5 mr-1" />
                Volver a clases
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-white glow-text truncate">
              {loading ? "Cargando..." : meeting?.title || "Clase"}
            </h1>
          </div>

          {/* Navegación del grupo */}
          <GroupNavigation groupId={groupId} />

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-900/50 border border-red-800 text-white p-4 rounded-lg my-6">
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-blue-300 animate-spin" />
              <span className="ml-3 text-blue-200">Cargando detalles de la clase...</span>
            </div>
          ) : meeting ? (
            <>
              {/* Navegación de la clase */}
              <ClassNavigation classId={classId} groupId={groupId} />

              {/* Detalles de la clase */}
              <Card className="bg-blue-800/20 border-blue-700/30 mb-6">
                <CardHeader>
                  <CardTitle className="text-white text-2xl">{meeting.title}</CardTitle>
                  <CardDescription className="text-blue-200/70">Transcripción de la clase</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center text-blue-300">
                      <Calendar className="h-5 w-5 mr-2" />
                      <span>{formatDate(meeting.date)}</span>
                    </div>

                    <div className="flex items-center text-blue-300">
                      <Clock className="h-5 w-5 mr-2" />
                      <span>{formatTime(meeting.date)}</span>
                    </div>

                    {meeting.duration && (
                      <div className="flex items-center text-blue-300">
                        <Clock className="h-5 w-5 mr-2" />
                        <span>Duración: {meeting.duration}</span>
                      </div>
                    )}

                    {meeting.participants !== undefined && (
                      <div className="flex items-center text-blue-300">
                        <Users className="h-5 w-5 mr-2" />
                        <span>{meeting.participants} participantes</span>
                      </div>
                    )}
                  </div>

                  {meeting.summary && (
                    <div className="mb-6">
                      <h3 className="text-white font-medium mb-2">Resumen</h3>
                      <p className="text-blue-100/90 bg-blue-700/20 p-4 rounded-md">{meeting.summary}</p>
                    </div>
                  )}

                  {/* Transcripciones */}
                  <div>
                    <h3 className="text-white font-medium mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Transcripción
                    </h3>

                    {transcriptions.length > 0 ? (
                      <div className="space-y-4">
                        {transcriptions.map((item) => (
                          <div key={item.id} className="bg-blue-700/20 p-4 rounded-md">
                            <div className="flex justify-between mb-2">
                              <span className="font-medium text-blue-300">{item.speaker}</span>
                              <span className="text-blue-400/70 text-sm">{item.time}</span>
                            </div>
                            <p className="text-white/90">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-blue-700/10 rounded-md">
                        <p className="text-blue-200">No hay transcripciones disponibles para esta clase.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-blue-800/20 border-blue-700/30">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-blue-400/50 mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">Clase no encontrada</h3>
                <p className="text-blue-200/70 text-center max-w-md mb-6">No se pudo encontrar la clase solicitada.</p>

                <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href={`/groups/${groupId}/classes`}>Volver a la lista de clases</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <NewNavbar />
    </div>
  )
}
