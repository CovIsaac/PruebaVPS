"use client"

import { useState, useEffect } from "react"
import { X, Loader2, FileText, List, MessageSquare, Clock, Calendar, Users, User } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AIChatModal } from "@/components/ai-chat-modal"
import { getUsername } from "@/utils/user-helpers"
import { formatTime } from "@/utils/format-time"

// Interfaces para los tipos de datos
interface TranscriptionItem {
  id?: number
  meeting_id?: number
  time?: string
  speaker?: string
  text: string
  created_at?: string
}

interface KeyPoint {
  id?: number
  meeting_id?: number
  point_text: string
  order_num?: number
  created_at?: string
}

interface MeetingDetails {
  id: number
  title: string
  date: string
  duration?: string
  participants?: number
  summary?: string
  audio_url?: string
  username?: string
  group_id?: string
  group_name?: string
  transcription?: TranscriptionItem[]
  keyPoints?: KeyPoint[]
}

interface ClassDetailModalProps {
  meeting: {
    id: number
    title: string
    date: string
    [key: string]: any
  }
  onClose: () => void
}

export function ClassDetailModal({ meeting, onClose }: ClassDetailModalProps) {
  const [activeTab, setActiveTab] = useState("transcription")
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAIChat, setShowAIChat] = useState(false)

  useEffect(() => {
    const fetchMeetingDetails = async () => {
      if (!meeting || !meeting.id) return

      try {
        setLoading(true)
        setError(null)

        const username = getUsername()
        if (!username) {
          throw new Error("No se encontró información de usuario")
        }

        // Obtener detalles completos de la reunión
        const response = await fetch(`/api/meetings/${meeting.id}`, {
          headers: {
            "X-Username": username,
          },
        })

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setMeetingDetails(data)

        // Si no hay transcripción, obtenerla específicamente
        if (!data.transcription || data.transcription.length === 0) {
          const transcriptionResponse = await fetch(`/api/meetings/${meeting.id}/transcription`, {
            headers: {
              "X-Username": username,
            },
          })

          if (transcriptionResponse.ok) {
            const transcriptionData = await transcriptionResponse.json()
            setMeetingDetails((prev) => ({
              ...prev!,
              transcription: transcriptionData,
            }))
          }
        }
      } catch (err: any) {
        console.error("Error al cargar los detalles de la clase:", err)
        setError(err.message || "Error al cargar los detalles de la clase")
      } finally {
        setLoading(false)
      }
    }

    fetchMeetingDetails()
  }, [meeting])

  // Formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return format(date, "PPP", { locale: es })
    } catch (e) {
      return dateString
    }
  }

  // Formatear hora
  const formatTimeString = (dateString?: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return format(date, "p", { locale: es })
    } catch (e) {
      return dateString
    }
  }

  // Contar participantes únicos
  const countUniqueParticipants = (transcription?: TranscriptionItem[]) => {
    if (!transcription || !Array.isArray(transcription) || transcription.length === 0) {
      return 0
    }

    const uniqueSpeakers = new Set<string>()
    transcription.forEach((item) => {
      if (item.speaker && item.speaker.trim() !== "") {
        uniqueSpeakers.add(item.speaker.trim())
      }
    })

    return uniqueSpeakers.size
  }

  // Si se muestra el chat de IA, renderizar ese componente
  if (showAIChat && meetingDetails) {
    return <AIChatModal meeting={meetingDetails} onClose={() => setShowAIChat(false)} />
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-blue-900/90 border border-blue-700/50 rounded-xl w-[95%] sm:w-full max-w-4xl max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-blue-700/30 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{meeting?.title || "Detalles de la clase"}</h2>
            <div className="flex flex-wrap items-center text-blue-200/70 text-sm mt-1 gap-3">
              {meeting?.date && (
                <>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(meeting.date)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatTimeString(meeting.date)}</span>
                  </div>
                </>
              )}
              {meetingDetails?.transcription && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>
                    {countUniqueParticipants(meetingDetails.transcription)}{" "}
                    {countUniqueParticipants(meetingDetails.transcription) === 1 ? "participante" : "participantes"}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-300 hover:text-white hover:bg-blue-800/50"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mr-3" />
            <span className="text-blue-200">Cargando detalles de la clase...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/20 mb-4">
              <X className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Error al cargar los detalles</h3>
            <p className="text-blue-200">{error}</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <Tabs defaultValue="transcription" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-4 pt-4 border-b border-blue-700/30">
                <TabsList className="bg-blue-800/30 w-full grid grid-cols-4 gap-1">
                  <TabsTrigger value="transcription" className="data-[state=active]:bg-blue-600 text-white">
                    <FileText className="h-4 w-4 mr-2" />
                    Transcripción
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="data-[state=active]:bg-blue-600 text-white">
                    <FileText className="h-4 w-4 mr-2" />
                    Resumen
                  </TabsTrigger>
                  <TabsTrigger value="key-points" className="data-[state=active]:bg-blue-600 text-white">
                    <List className="h-4 w-4 mr-2" />
                    Puntos Clave
                  </TabsTrigger>
                  <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-blue-600 text-white">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Asistente IA
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Transcripción */}
                <TabsContent value="transcription" className="mt-0">
                  <div className="bg-blue-800/20 p-4 rounded-lg">
                    {meetingDetails?.transcription && meetingDetails.transcription.length > 0 ? (
                      <div className="space-y-6">
                        {meetingDetails.transcription.map((item, index) => (
                          <div key={index} className="bg-blue-800/40 p-3 rounded-lg shadow border border-blue-700/30">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 text-sm text-blue-300">
                              <div className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                <span>{item.time || formatTime(index * 30)}</span>
                              </div>
                              <div className="hidden sm:block text-blue-500">•</div>
                              <div className="flex items-center">
                                <User className="h-3.5 w-3.5 mr-1" />
                                <span className="font-medium">{item.speaker || "Speaker"}</span>
                              </div>
                            </div>
                            <p className="text-blue-100">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-blue-100">No hay transcripción disponible para esta clase.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Resumen */}
                <TabsContent value="summary" className="mt-0">
                  <div className="bg-blue-800/20 p-4 rounded-lg">
                    {meetingDetails?.summary ? (
                      <p className="text-blue-100 whitespace-pre-line">{meetingDetails.summary}</p>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-blue-100">No hay resumen disponible para esta clase.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Puntos Clave */}
                <TabsContent value="key-points" className="mt-0">
                  <div className="bg-blue-800/20 p-4 rounded-lg">
                    {meetingDetails?.keyPoints && meetingDetails.keyPoints.length > 0 ? (
                      <ul className="space-y-3">
                        {meetingDetails.keyPoints.map((point, index) => (
                          <li key={index} className="bg-blue-800/40 p-3 rounded-lg border border-blue-700/30">
                            <div className="flex items-start">
                              <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0 mr-3 mt-0.5">
                                {point.order_num || index + 1}
                              </div>
                              <span className="text-blue-100">{point.point_text}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-blue-100">No hay puntos clave disponibles para esta clase.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Asistente IA */}
                <TabsContent value="ai-assistant" className="mt-0">
                  <div className="bg-blue-800/20 p-4 rounded-lg">
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-800/40 mb-4">
                        <MessageSquare className="h-8 w-8 text-blue-300" />
                      </div>
                      <h3 className="text-xl font-medium text-white mb-2">Asistente IA</h3>
                      <p className="text-blue-200 mb-6">
                        Utiliza nuestro asistente de IA para hacer preguntas sobre esta clase y obtener respuestas
                        basadas en la transcripción.
                      </p>
                      <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAIChat(true)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Iniciar chat con IA
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
