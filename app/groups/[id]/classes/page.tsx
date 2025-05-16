"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { NewNavbar } from "@/components/new-navbar"
import { GroupNavigation } from "@/components/group-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Search, Plus, Clock, Users, FileText, Loader2 } from "lucide-react"
import Link from "next/link"
import { ClassDetailModal } from "@/components/class-detail-modal"
import { AnimatePresence } from "framer-motion"

// Tipos
interface Meeting {
  id: string
  title: string
  date: string
  duration?: string
  participants?: number
  summary?: string
  transcriptions?: { count: number }
  key_points?: { count: number }
}

export default function GroupClassesPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [classes, setClasses] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [showClassDetailModal, setShowClassDetailModal] = useState(false)

  // Cargar las clases del grupo
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/groups/${groupId}/classes`)

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login")
            return
          }
          throw new Error(`Error ${response.status}: ${await response.text()}`)
        }

        const data = await response.json()
        setClasses(data)
      } catch (err: any) {
        console.error("Error al cargar las clases:", err)
        setError(err.message || "Error al cargar las clases")
      } finally {
        setLoading(false)
      }
    }

    // Obtener el rol del usuario
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/users/me")
        const userData = await response.json()

        if (userData.organization?.role) {
          setUserRole(userData.organization.role)
        }
      } catch (error) {
        console.error("Error al obtener el rol del usuario:", error)
      }
    }

    fetchClasses()
    fetchUserRole()
  }, [groupId, router])

  // Filtrar clases por búsqueda y fecha
  const filteredClasses = classes.filter((meeting) => {
    const matchesSearch =
      searchTerm === "" ||
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meeting.summary && meeting.summary.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesDate = !selectedDate || new Date(meeting.date).toDateString() === selectedDate.toDateString()

    return matchesSearch && matchesDate
  })

  // Verificar si el usuario es profesor (no es estudiante)
  const isTeacher = userRole && !userRole.toLowerCase().includes("student")

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
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4 glow-text">Clases del Grupo</h1>

          {/* Navegación del grupo */}
          <GroupNavigation groupId={groupId} />

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar clases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto border-white/20 text-white">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Filtrar por fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-blue-800 border-blue-700">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="text-white"
                />
                {selectedDate && (
                  <div className="p-3 border-t border-blue-700">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedDate(undefined)}
                      className="w-full text-blue-300 hover:text-white hover:bg-blue-700"
                    >
                      Limpiar filtro
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {isTeacher && (
              <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                <Link href={`/groups/${groupId}/classes/new`}>Nueva Clase</Link>
              </Button>
            )}
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-900/50 border border-red-800 text-white p-4 rounded-lg mb-6">
              <p>{error}</p>
            </div>
          )}

          {/* Lista de clases */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-blue-300 animate-spin" />
              <span className="ml-3 text-blue-200">Cargando clases...</span>
            </div>
          ) : filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((meeting) => (
                <Card
                  key={meeting.id}
                  className="bg-blue-800/20 border-blue-700/30 hover:bg-blue-800/40 transition-colors cursor-pointer h-full"
                  onClick={() => {
                    setSelectedMeeting(meeting)
                    setShowClassDetailModal(true)
                  }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-xl">{meeting.title}</CardTitle>
                    <CardDescription className="text-blue-200/70">
                      {formatDate(meeting.date)} - {formatTime(meeting.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {meeting.summary && <p className="text-white/80 text-sm line-clamp-3">{meeting.summary}</p>}

                      <div className="flex flex-wrap gap-3 text-sm">
                        {meeting.duration && (
                          <div className="flex items-center text-blue-300">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{meeting.duration}</span>
                          </div>
                        )}

                        {meeting.participants !== undefined && (
                          <div className="flex items-center text-blue-300">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{meeting.participants} participantes</span>
                          </div>
                        )}

                        {meeting.transcriptions && meeting.transcriptions.count > 0 && (
                          <div className="flex items-center text-blue-300">
                            <FileText className="h-4 w-4 mr-1" />
                            <span>{meeting.transcriptions.count} segmentos</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-blue-800/20 border-blue-700/30">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-blue-400/50 mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No hay clases disponibles</h3>
                <p className="text-blue-200/70 text-center max-w-md mb-6">
                  {searchTerm || selectedDate
                    ? "No se encontraron clases con los filtros aplicados."
                    : "Aún no hay clases registradas en este grupo."}
                </p>

                {isTeacher && (
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    <Link href={`/groups/${groupId}/classes/new`}>Crear primera clase</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      {/* Modal de detalles de clase */}
      <AnimatePresence>
        {showClassDetailModal && selectedMeeting && (
          <ClassDetailModal meeting={selectedMeeting} onClose={() => setShowClassDetailModal(false)} />
        )}
      </AnimatePresence>
      <NewNavbar />
    </div>
  )
}
