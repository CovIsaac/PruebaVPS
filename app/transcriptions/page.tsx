"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Search, ChevronLeft, ChevronRight, FileText, Loader2, User, Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"
import { useDevice } from "@/hooks/use-device"
import { NewNavbar } from "@/components/new-navbar"
import { getUsername } from "@/utils/user-helpers"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface TranscriptionItem {
  time?: string
  speaker?: string
  text: string
}

interface Group {
  id: string
  name: string
}

interface Transcription {
  id: number
  title: string
  date: string
  created_at: string
  duration?: string | number
  participants?: number
  summary?: string
  audio_url?: string
  content?: string
  user_id?: number
  username?: string
  transcription?: TranscriptionItem[]
  keyPoints?: { id: number; point_text: string; order_num: number }[]
  group_id?: string | null
  group_name?: string | null
  is_group_meeting?: boolean
}

export default function TranscriptionsPage() {
  const router = useRouter()
  const { isMobile } = useDevice()
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [filteredTranscriptions, setFilteredTranscriptions] = useState<Transcription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [date, setDate] = useState<DateRange | undefined>()
  const [username, setUsername] = useState<string | null>(null)
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userGroups, setUserGroups] = useState<Group[]>([]) // Inicializado como array vacío
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [loadingGroups, setLoadingGroups] = useState(true)
  const itemsPerPage = 10

  // Obtener el nombre de usuario al cargar la página
  useEffect(() => {
    const storedUsername = getUsername()
    if (storedUsername) {
      setUsername(storedUsername)
    } else {
      setAuthError("No se ha encontrado una sesión activa. Por favor, inicia sesión nuevamente.")
    }
  }, [])

  // Obtener el rol del usuario
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!username) return

      try {
        const response = await fetch(`/api/users/me`, {
          headers: {
            "X-Username": username,
          },
        })

        if (response.ok) {
          const userData = await response.json()
          setUserRole(userData.role || "user")
        }
      } catch (error) {
        console.error("Error fetching user role:", error)
      }
    }

    if (username) {
      fetchUserRole()
    }
  }, [username])

  // Obtener los grupos del usuario
  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!username) return

      setLoadingGroups(true)
      try {
        const response = await fetch(`/api/groups/me`, {
          headers: {
            "X-Username": username,
          },
        })

        if (response.ok) {
          const data = await response.json()

          // Asegurarse de que data es un array
          const groups = Array.isArray(data) ? data : []
          console.log("Grupos obtenidos:", groups)

          setUserGroups(groups)

          // Si hay grupos, seleccionar el primero por defecto
          if (groups.length > 0 && !selectedGroupId) {
            setSelectedGroupId(groups[0].id)
          }
        }
      } catch (error) {
        console.error("Error fetching user groups:", error)
        setUserGroups([]) // Asegurarse de que userGroups sea un array vacío en caso de error
      } finally {
        setLoadingGroups(false)
      }
    }

    if (username) {
      fetchUserGroups()
    }
  }, [username])

  // Cargar transcripciones cuando cambian los filtros o la página
  useEffect(() => {
    if (username && selectedGroupId) {
      fetchTranscriptions()
    }
  }, [currentPage, searchTerm, date, username, selectedGroupId])

  // Filtrar transcripciones por grupo seleccionado
  useEffect(() => {
    if (selectedGroupId) {
      const filtered = transcriptions.filter((transcription) => transcription.group_id === selectedGroupId)
      setFilteredTranscriptions(filtered)
      setTotalPages(Math.ceil(filtered.length / itemsPerPage))

      // Si hay transcripciones filtradas, seleccionar la primera
      if (filtered.length > 0 && (!selectedTranscription || !filtered.some((t) => t.id === selectedTranscription.id))) {
        setSelectedTranscription(filtered[0])
      } else if (filtered.length === 0) {
        setSelectedTranscription(null)
      }
    } else {
      setFilteredTranscriptions(transcriptions)
      setTotalPages(Math.ceil(transcriptions.length / itemsPerPage))
    }
  }, [selectedGroupId, transcriptions])

  const fetchTranscriptions = async () => {
    if (!username || !selectedGroupId) return

    setLoading(true)
    try {
      let url = `/api/meetings?page=${currentPage}&limit=100` // Aumentamos el límite para obtener todas las transcripciones

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`
      }

      if (date?.from) {
        url += `&startDate=${date.from.toISOString().split("T")[0]}`
      }

      if (date?.to) {
        url += `&endDate=${date.to.toISOString().split("T")[0]}`
      }

      // Si el usuario es estudiante y hay un grupo seleccionado, filtrar por ese grupo
      if (userRole === "student" && selectedGroupId) {
        url += `&groupId=${selectedGroupId}`
      }

      const response = await fetch(url, {
        headers: {
          "X-Username": username,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setAuthError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.")
          return
        }
        throw new Error("Failed to fetch transcriptions")
      }

      const data = await response.json()

      // Asegurarse de que data es un array
      const meetings = Array.isArray(data) ? data : []

      // Si el usuario es estudiante, solo mostrar transcripciones de grupos
      if (userRole === "student") {
        const groupMeetings = meetings.filter((meeting) => meeting.is_group_meeting)
        setTranscriptions(groupMeetings)

        // Si hay un grupo seleccionado, filtrar por ese grupo
        if (selectedGroupId) {
          const filtered = groupMeetings.filter((meeting) => meeting.group_id === selectedGroupId)
          setFilteredTranscriptions(filtered)
          setTotalPages(Math.ceil(filtered.length / itemsPerPage))

          // Si hay transcripciones filtradas, seleccionar la primera
          if (filtered.length > 0 && !selectedTranscription) {
            setSelectedTranscription(filtered[0])
          }
        } else {
          setFilteredTranscriptions(groupMeetings)
          setTotalPages(Math.ceil(groupMeetings.length / itemsPerPage))
        }
      } else {
        // Para otros usuarios, mostrar todas las transcripciones
        setTranscriptions(meetings)
        setFilteredTranscriptions(meetings)
        setTotalPages(Math.ceil(meetings.length / itemsPerPage))

        // Si no hay transcripción seleccionada y hay transcripciones disponibles, seleccionar la primera
        if (!selectedTranscription && meetings.length > 0) {
          setSelectedTranscription(meetings[0])
        }
      }
    } catch (error) {
      console.error("Error fetching transcriptions:", error)
      setTranscriptions([])
      setFilteredTranscriptions([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchTranscriptions()
  }

  const handleViewTranscription = (id: number) => {
    router.push(`/building-transcriptions?id=${id}&view=transcription-only`)
  }

  const handleSelectTranscription = (transcription: Transcription) => {
    setSelectedTranscription(transcription)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate)
    setCurrentPage(1)
  }

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId)
    setCurrentPage(1)
    setSelectedTranscription(null)
  }

  const handleLogin = () => {
    router.push("/login")
  }

  // Función para formatear la fecha correctamente
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch (error) {
      return dateString
    }
  }

  // Si hay un error de autenticación, mostrar mensaje y botón para iniciar sesión
  if (authError) {
    return (
      <div className="min-h-screen bg-blue-900">
        <main className="container mx-auto px-4 pb-24 pt-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8 glow-text">Transcripciones</h1>

            <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-6 text-center">
              <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800 text-white">
                <AlertTitle className="text-lg">Error de autenticación</AlertTitle>
                <AlertDescription className="text-base">{authError}</AlertDescription>
              </Alert>

              <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 mt-4">
                Iniciar sesión
              </Button>
            </div>
          </div>
        </main>
        <NewNavbar />
      </div>
    )
  }

  // Si está cargando los grupos, mostrar un indicador de carga
  if (loadingGroups) {
    return (
      <div className="min-h-screen bg-blue-900">
        <main className="container mx-auto px-4 pb-24 pt-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8 glow-text">Transcripciones</h1>

            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
              <span className="ml-3 text-xl text-blue-200">Cargando grupos...</span>
            </div>
          </div>
        </main>
        <NewNavbar />
      </div>
    )
  }

  // Si no hay grupos disponibles, mostrar un mensaje
  if (!Array.isArray(userGroups) || userGroups.length === 0) {
    return (
      <div className="min-h-screen bg-blue-900">
        <main className="container mx-auto px-4 pb-24 pt-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8 glow-text">Transcripciones</h1>

            <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-6 text-center">
              <Alert className="mb-6 bg-blue-700/50 border-blue-600 text-white">
                <AlertTitle className="text-lg">No hay grupos disponibles</AlertTitle>
                <AlertDescription className="text-base">
                  No estás inscrito en ningún grupo. Contacta con tu profesor para ser añadido a un grupo.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </main>
        <NewNavbar />
      </div>
    )
  }

  const renderTranscriptionCard = (transcription: Transcription) => {
    const isSelected = selectedTranscription?.id === transcription.id

    return (
      <Card
        key={transcription.id}
        className={`mb-2 hover:shadow-md transition-shadow border-blue-700/30 cursor-pointer ${
          isSelected ? "bg-blue-700/30" : "bg-blue-800/20"
        }`}
        onClick={() => handleSelectTranscription(transcription)}
      >
        <CardContent className="p-3">
          <div>
            <h3 className="text-base font-semibold mb-1 text-white line-clamp-1">{transcription.title}</h3>
            <div className="text-xs text-blue-300">{formatDate(transcription.created_at || transcription.date)}</div>

            <div className="flex flex-wrap gap-2 mt-1">
              {transcription.username && (
                <div className="text-xs text-blue-300 flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  <span>{transcription.username}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderTranscriptionList = (items: Transcription[], isLoading: boolean, emptyMessage: string) => {
    if (isLoading && items.length === 0) {
      return Array(5)
        .fill(0)
        .map((_, index) => (
          <Card key={index} className="mb-2 bg-blue-800/20 border-blue-700/30">
            <CardContent className="p-3">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-3/4 bg-blue-700/40" />
                <Skeleton className="h-3 w-1/2 bg-blue-700/40" />
                <Skeleton className="h-3 w-1/4 bg-blue-700/40" />
              </div>
            </CardContent>
          </Card>
        ))
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-6">
          <FileText className="mx-auto h-8 w-8 text-blue-400" />
          <h3 className="mt-2 text-sm font-semibold text-white">{emptyMessage}</h3>
        </div>
      )
    }

    // Paginar los elementos
    const currentItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return currentItems.map(renderTranscriptionCard)
  }

  const renderTranscriptionDetail = () => {
    if (!selectedTranscription && filteredTranscriptions.length > 0) {
      // Si hay transcripciones pero ninguna seleccionada, seleccionar la primera
      setSelectedTranscription(filteredTranscriptions[0])
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
      )
    }

    if (!selectedTranscription) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <FileText className="h-16 w-16 text-blue-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Selecciona una transcripción</h3>
          <p className="text-blue-300">Haz clic en una transcripción de la lista para ver sus detalles</p>
        </div>
      )
    }

    // Crear una versión limpia de la transcripción para mostrar
    const cleanTranscription = {
      ...selectedTranscription,
      participants: undefined, // Eliminar el valor de participantes que podría estar causando el problema
    }

    const hasGroup = cleanTranscription.group_name || cleanTranscription.group_id

    return (
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{cleanTranscription.title}</h2>
          <div className="flex flex-wrap gap-3 text-sm text-blue-300">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              {formatDate(cleanTranscription.created_at || cleanTranscription.date)}
            </div>

            {cleanTranscription.username && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {cleanTranscription.username}
              </div>
            )}

            {hasGroup && !selectedGroupId && (
              <div className="flex items-center">
                <Bookmark className="h-4 w-4 mr-1" />
                <span>{cleanTranscription.group_name || "Grupo"}</span>
              </div>
            )}
          </div>
        </div>

        {cleanTranscription.summary && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Resumen</h3>
            <p className="text-blue-200">{cleanTranscription.summary}</p>
          </div>
        )}

        <div className="flex justify-between mb-6">
          <Button
            onClick={() => handleViewTranscription(cleanTranscription.id)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Ver transcripción completa
          </Button>
        </div>

        {cleanTranscription.keyPoints && cleanTranscription.keyPoints.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Puntos clave</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-200">
              {cleanTranscription.keyPoints.map((point) => (
                <li key={point.id}>{point.point_text}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // Renderizar el menú de grupos
  const renderGroupMenu = () => {
    // Verificar que userGroups sea un array antes de usar map
    if (!Array.isArray(userGroups)) {
      console.error("userGroups no es un array:", userGroups)
      return (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Mis Grupos</h2>
          <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-4 text-center text-blue-200">
            Error al cargar los grupos. Por favor, recarga la página.
          </div>
        </div>
      )
    }

    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Mis Grupos</h2>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-2 pb-1">
            {userGroups.map((group) => (
              <Button
                key={group.id}
                onClick={() => handleGroupChange(group.id)}
                variant={selectedGroupId === group.id ? "default" : "outline"}
                className={`px-4 py-2 rounded-full ${
                  selectedGroupId === group.id
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-800/30 border-blue-700/30 text-blue-200 hover:bg-blue-700/30"
                }`}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                {group.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-4 md:mb-0 glow-text">Transcripciones</h1>
          </div>

          {/* Menú de grupos */}
          {renderGroupMenu()}

          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
                <Input
                  type="text"
                  placeholder="Buscar transcripciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-blue-800/30 border-blue-700/30 text-white"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal border-blue-700/30 text-blue-300",
                      !date && "text-blue-300/70",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Filtrar por fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={handleDateSelect}
                    numberOfMonths={isMobile ? 1 : 2}
                  />
                </PopoverContent>
              </Popover>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Buscar
              </Button>
            </form>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Panel izquierdo - Lista de transcripciones */}
            <div className="w-full md:w-1/3 lg:w-1/4">
              <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-2">
                {loading && filteredTranscriptions.length === 0 ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                  </div>
                ) : (
                  renderTranscriptionList(
                    filteredTranscriptions,
                    loading,
                    selectedGroupId ? "No hay transcripciones para este grupo" : "No hay transcripciones disponibles",
                  )
                )}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="border-blue-700/30 text-blue-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-blue-200">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="border-blue-700/30 text-blue-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Panel derecho - Detalle de la transcripción */}
            <div className="w-full md:w-2/3 lg:w-3/4 bg-blue-800/20 border border-blue-700/30 rounded-lg">
              {renderTranscriptionDetail()}
            </div>
          </div>
        </div>
      </main>

      <NewNavbar />
    </div>
  )
}
