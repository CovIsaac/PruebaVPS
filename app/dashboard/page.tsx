"use client"

import { useState, useEffect, useCallback } from "react"
import { NewNavbar } from "@/components/new-navbar"
import {
  Search,
  Calendar,
  Clock,
  Users,
  X,
  FileText,
  List,
  FileAudio,
  MessageSquare,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getSupabaseClient } from "@/utils/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getUsername, storeUsername } from "@/utils/user-helpers"

// Función para contar hablantes únicos en una transcripción
const countUniqueParticipants = (transcription) => {
  if (!transcription || !Array.isArray(transcription) || transcription.length === 0) {
    return 0
  }

  // Crear un conjunto de hablantes únicos (ignorando valores nulos o vacíos)
  const uniqueSpeakers = new Set()

  transcription.forEach((item) => {
    if (item.speaker && item.speaker.trim() !== "") {
      uniqueSpeakers.add(item.speaker.trim())
    }
  })

  return uniqueSpeakers.size
}

// Component for conversation card
const ConversationCard = ({ conversation, onClick, onDeleteClick }) => {
  // Verificar que conversation tenga todas las propiedades necesarias
  if (!conversation || typeof conversation !== "object") {
    console.error("Invalid conversation object:", conversation)
    return null
  }

  // Calcular el número de participantes basado en la transcripción
  const participantCount = conversation.transcription
    ? countUniqueParticipants(conversation.transcription)
    : conversation.participants || 0

  const handleDeleteClick = (e) => {
    e.stopPropagation() // Evitar que se propague al onClick de la tarjeta
    onDeleteClick(conversation)
  }

  // Usar valores por defecto para propiedades que podrían ser undefined
  const title = conversation.title || "Untitled Conversation"
  const date = conversation.date ? new Date(conversation.date) : new Date()
  const duration = conversation.duration || "00:00"

  return (
    <motion.div
      className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-4 cursor-pointer hover:bg-blue-700/40 transition-all relative"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <div className="flex items-center text-blue-200/70 text-sm mb-2">
        <Calendar className="h-4 w-4 mr-1" />
        <span className="mr-3">{format(date, "dd MMM yyyy", { locale: es })}</span>
        <Clock className="h-4 w-4 mr-1" />
        <span>{duration}</span>
      </div>
      <div className="flex items-center text-blue-200/70 text-sm">
        <Users className="h-4 w-4 mr-1" />
        <span>
          {participantCount} {participantCount === 1 ? "participant" : "participants"}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 text-blue-300 hover:text-red-400 hover:bg-blue-800/50"
        onClick={handleDeleteClick}
        aria-label="Delete conversation"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}

// Component for detailed conversation view
const ConversationDetail = ({ conversation, onClose }) => {
  const [activeTab, setActiveTab] = useState("summary")
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [audioProgress, setAudioProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState("00:00:00")
  const router = useRouter()

  // Verificar que conversation tenga todas las propiedades necesarias
  if (!conversation || typeof conversation !== "object") {
    console.error("Invalid conversation object in detail view:", conversation)
    return null
  }

  // Usar valores por defecto para propiedades que podrían ser undefined
  const title = conversation.title || "Untitled Conversation"
  const date = conversation.date ? new Date(conversation.date) : new Date()
  const duration = conversation.duration || "00:00"

  // Calcular el número de participantes basado en la transcripción
  const participantCount = conversation.transcription
    ? countUniqueParticipants(conversation.transcription)
    : conversation.participants || 0

  useEffect(() => {
    // Inicializar el elemento de audio si hay una URL de audio
    if (conversation.audio_url) {
      const audio = new Audio(conversation.audio_url)
      setAudioElement(audio)

      // Configurar eventos de audio
      audio.addEventListener("timeupdate", updateAudioProgress)
      audio.addEventListener("ended", () => setIsPlaying(false))

      return () => {
        audio.pause()
        audio.removeEventListener("timeupdate", updateAudioProgress)
        audio.removeEventListener("ended", () => setIsPlaying(false))
      }
    }
  }, [conversation.audio_url])

  // Función para actualizar el progreso del audio
  const updateAudioProgress = () => {
    if (audioElement) {
      const progress = (audioElement.currentTime / audioElement.duration) * 100
      setAudioProgress(progress)

      // Formatear el tiempo actual
      const time = formatAudioTime(audioElement.currentTime)
      setCurrentTime(time)
    }
  }

  // Función para formatear el tiempo de audio
  const formatAudioTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Función para reproducir o pausar el audio
  const toggleAudio = () => {
    if (!audioElement) return

    if (isPlaying) {
      audioElement.pause()
    } else {
      audioElement.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Verificar si hay datos disponibles para cada sección
  const hasTranscription =
    conversation.transcription && Array.isArray(conversation.transcription) && conversation.transcription.length > 0
  const hasKeyPoints =
    conversation.keyPoints && Array.isArray(conversation.keyPoints) && conversation.keyPoints.length > 0
  const hasSummary =
    conversation.summary && typeof conversation.summary === "string" && conversation.summary.trim() !== ""
  const hasAudio =
    conversation.audio_url && typeof conversation.audio_url === "string" && conversation.audio_url.trim() !== ""

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-blue-900/90 border border-blue-700/50 rounded-xl w-[95%] sm:w-full max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-blue-700/30 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <div className="flex items-center text-blue-200/70 text-sm mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="mr-3">{format(date, "dd MMM yyyy", { locale: es })}</span>
              <Clock className="h-4 w-4 mr-1" />
              <span className="mr-3">{duration}</span>
              <Users className="h-4 w-4 mr-1" />
              <span>
                {participantCount} {participantCount === 1 ? "participant" : "participants"}
              </span>
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

        {/* Tabs */}
        <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 sm:px-6 pt-4 overflow-hidden">
            <div className="overflow-x-auto">
              <TabsList className="grid grid-cols-4 gap-1 bg-blue-800/30 w-full min-w-[500px]">
                <TabsTrigger value="summary" className="data-[state=active]:bg-blue-600 text-white text-xs">
                  <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Summary</span>
                  <span className="sm:hidden">Sum.</span>
                </TabsTrigger>
                <TabsTrigger value="key-points" className="data-[state=active]:bg-blue-600 text-white text-xs">
                  <List className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Key Points</span>
                  <span className="sm:hidden">Points</span>
                </TabsTrigger>
                <TabsTrigger value="transcript" className="data-[state=active]:bg-blue-600 text-white text-xs">
                  <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Transcript</span>
                  <span className="sm:hidden">Trans.</span>
                </TabsTrigger>
                <TabsTrigger value="audio" className="data-[state=active]:bg-blue-600 text-white text-xs">
                  <FileAudio className="h-4 w-4 mr-1 sm:mr-2" />
                  <span>Audio</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <TabsContent value="summary" className="mt-0">
              <div className="bg-blue-800/20 p-4 rounded-lg">
                {hasSummary ? (
                  <p className="text-blue-100">{conversation.summary}</p>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-blue-100">No summary available for this meeting.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="key-points" className="mt-0">
              <div className="bg-blue-800/20 p-4 rounded-lg">
                {hasKeyPoints ? (
                  <ul className="space-y-2">
                    {conversation.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0 mr-3 mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-blue-100">{point.point_text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-blue-100">No key points available for this meeting.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="mt-0">
              <div className="bg-blue-800/20 p-4 rounded-lg">
                {hasTranscription ? (
                  <div className="space-y-6">
                    {conversation.transcription.map((item, index) => (
                      <div key={index} className="flex">
                        <div className="w-20 flex-shrink-0">
                          <div className="text-sm text-blue-300">{item.time || "--:--"}</div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white mb-1">{item.speaker || "Speaker"}</div>
                          <div className="text-blue-100">{item.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-blue-100">No transcript available for this meeting.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="audio" className="mt-0">
              <div className="bg-blue-800/20 p-4 rounded-lg">
                {hasAudio ? (
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-blue-600 border-none text-white hover:bg-blue-700"
                      onClick={toggleAudio}
                    >
                      {isPlaying ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                        >
                          <rect x="6" y="4" width="4" height="16"></rect>
                          <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                        >
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      )}
                    </Button>
                    <div className="ml-4 flex-1">
                      <div className="h-2 bg-blue-700/50 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${audioProgress}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-blue-300 mt-1">
                        <span>{currentTime}</span>
                        <span>{duration}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-blue-100">No audio recording available for this meeting.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}

const DeleteConfirmationModal = ({ conversation, onConfirm, onCancel }) => {
  // Verificar que conversation tenga todas las propiedades necesarias
  if (!conversation || typeof conversation !== "object") {
    console.error("Invalid conversation object in delete modal:", conversation)
    return null
  }

  // Usar valores por defecto para propiedades que podrían ser undefined
  const title = conversation.title || "Untitled Conversation"

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-blue-900/90 border border-blue-700/50 rounded-xl w-full max-w-md overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-2">Delete Conversation</h2>
          <p className="text-blue-200 text-center mb-6">
            Are you sure you want to delete "{title}"? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={() => onConfirm(conversation.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Loading overlay component
const LoadingOverlay = () => (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="text-center">
      <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      <p className="mt-4 text-xl text-white">Loading conversation...</p>
    </div>
  </motion.div>
)

// Usage indicator component
const UsageIndicator = () => {
  const [usage, setUsage] = useState({ used: 0, limit: 5, remaining: 5 })
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const username = getUsername()

  useEffect(() => {
    const fetchUsage = async () => {
      if (!username) {
        setError(true)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch("/api/user/usage", {
          headers: {
            "X-Username": username,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch usage data")
        }

        const data = await response.json()
        setUsage(data)
        setError(false)
      } catch (err) {
        console.error("Error fetching usage data:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [username])

  if (loading) {
    return (
      <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-3">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 text-blue-300 animate-spin mr-2" />
          <span className="text-blue-200 text-sm">Loading usage data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-3">
        <div className="flex items-center">
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-200 text-sm">Monthly analyses</span>
              <span className="text-blue-200 text-sm">Unknown</span>
            </div>
            <div className="h-2 bg-blue-700/50 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 w-0 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const percentage = (usage.used / usage.limit) * 100
  const indicatorColor = percentage > 80 ? "bg-red-400" : "bg-blue-400"

  return (
    <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-3">
      <div className="flex items-center">
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-blue-200 text-sm">Monthly analyses</span>
            <span className="text-blue-200 text-sm">{usage.remaining} remaining</span>
          </div>
          <div className="h-2 bg-blue-700/50 rounded-full overflow-hidden">
            <div className={`h-full ${indicatorColor} rounded-full`} style={{ width: `${percentage}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [conversations, setConversations] = useState([])
  const [authError, setAuthError] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const router = useRouter()

  const conversationsPerPage = 20 // 5x4 grid

  const [conversationToDelete, setConversationToDelete] = useState(null)
  const [deletingConversation, setDeletingConversation] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      // First check if we have a username in localStorage
      const storedUsername = getUsername()

      if (storedUsername) {
        setUsername(storedUsername)
        setAuthError(false)
        return
      }

      // If no username in localStorage, try to get it from Supabase session
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        console.error("Auth error:", error)
        setAuthError(true)
        return
      }

      // Get username from profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.session.user.id)
        .single()

      if (profileData?.username) {
        // Store username in localStorage for future use
        storeUsername(profileData.username)
        setUsername(profileData.username)
        setAuthError(false)
      } else {
        setAuthError(true)
      }
    } catch (error) {
      console.error("Error checking auth:", error)
      setAuthError(true)
    }
  }, [])

  // Check authentication status and get username
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Fetch conversations when username is available
  useEffect(() => {
    async function fetchConversations() {
      if (!username) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        const response = await fetch("/api/meetings", {
          headers: {
            "X-Username": username,
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            setAuthError(true)
            return
          }
          throw new Error("Failed to fetch conversations")
        }

        const data = await response.json()

        // Verificar que data sea un array antes de usar map
        if (!Array.isArray(data)) {
          console.error("Expected array but got:", data)
          setConversations([])
          return
        }

        // Validar y normalizar cada conversación para asegurar que tenga todas las propiedades necesarias
        const normalizedData = data
          .map((conversation) => {
            if (!conversation) return null

            // Asegurar que cada conversación tenga al menos estas propiedades básicas
            return {
              id: conversation.id || `temp-${Math.random().toString(36).substring(2, 9)}`,
              title: conversation.title || "Untitled Conversation",
              date: conversation.date || new Date().toISOString(),
              duration: conversation.duration || "00:00",
              participants: conversation.participants || 0,
              transcription: Array.isArray(conversation.transcription) ? conversation.transcription : [],
              ...conversation,
            }
          })
          .filter(Boolean) // Eliminar cualquier null que pudiera haberse generado

        // Procesar los datos para contar participantes
        const processedData = await Promise.all(
          normalizedData.map(async (conversation) => {
            // Si ya tenemos la transcripción, contamos los hablantes
            if (conversation.transcription && Array.isArray(conversation.transcription)) {
              const participantCount = countUniqueParticipants(conversation.transcription)
              return { ...conversation, participants: participantCount }
            }

            // Si no tenemos la transcripción pero tenemos ID, intentamos obtenerla
            if (conversation.id && !conversation.transcription) {
              try {
                const detailResponse = await fetch(`/api/meetings/${conversation.id}/transcription`, {
                  headers: {
                    "X-Username": username,
                  },
                })

                if (detailResponse.ok) {
                  const transcriptionData = await detailResponse.json()
                  if (transcriptionData && Array.isArray(transcriptionData)) {
                    const participantCount = countUniqueParticipants(transcriptionData)
                    return { ...conversation, participants: participantCount }
                  }
                }
              } catch (error) {
                console.error(`Error fetching transcription for meeting ${conversation.id}:`, error)
              }
            }

            return conversation
          }),
        )

        setConversations(processedData)
      } catch (error) {
        console.error("Error fetching conversations:", error)
        setConversations([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [username])

  // Filter conversations by search term
  const filteredConversations = conversations.filter((conv) => {
    // Verificar que conv y conv.title existan y sean del tipo correcto
    if (!conv || typeof conv !== "object") return false
    if (!conv.title || typeof conv.title !== "string") return false

    return conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Calculate total pages
  const totalPages = Math.ceil(filteredConversations.length / conversationsPerPage)

  // Get conversations for current page
  const currentConversations = filteredConversations.slice(
    (currentPage - 1) * conversationsPerPage,
    currentPage * conversationsPerPage,
  )

  // Handle conversation selection
  const handleSelectConversation = async (conversation) => {
    if (!username || !conversation || !conversation.id) return

    setLoadingConversation(true)

    try {
      // Fetch full conversation details
      const response = await fetch(`/api/meetings/${conversation.id}`, {
        headers: {
          "X-Username": username,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch conversation details")
      }

      const detailedConversation = await response.json()

      // Normalizar la conversación detallada
      const normalizedConversation = {
        id: detailedConversation.id || conversation.id,
        title: detailedConversation.title || conversation.title || "Untitled Conversation",
        date: detailedConversation.date || conversation.date || new Date().toISOString(),
        duration: detailedConversation.duration || conversation.duration || "00:00",
        participants: detailedConversation.participants || conversation.participants || 0,
        transcription: Array.isArray(detailedConversation.transcription) ? detailedConversation.transcription : [],
        ...detailedConversation,
      }

      // Contar participantes basados en la transcripción
      if (normalizedConversation.transcription && Array.isArray(normalizedConversation.transcription)) {
        const participantCount = countUniqueParticipants(normalizedConversation.transcription)
        normalizedConversation.participants = participantCount
      }

      setSelectedConversation(normalizedConversation)
    } catch (error) {
      console.error("Error fetching conversation details:", error)
      // Use the basic conversation data we already have
      setSelectedConversation(conversation)
    } finally {
      setLoadingConversation(false)
    }
  }

  const handleDeleteConversation = async (conversationId) => {
    if (!username || !conversationId) return

    try {
      setDeletingConversation(true)

      const response = await fetch(`/api/meetings/${conversationId}`, {
        method: "DELETE",
        headers: {
          "X-Username": username,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete conversation")
      }

      // Actualizar la lista de conversaciones
      setConversations(conversations.filter((conv) => conv.id !== conversationId))
      setConversationToDelete(null)
    } catch (error) {
      console.error("Error deleting conversation:", error)
      // Aquí podrías mostrar un mensaje de error
    } finally {
      setDeletingConversation(false)
    }
  }

  // Handle login redirect
  const handleLogin = () => {
    router.push("/login")
  }

  // Initialize username state. This will hold the username regardless of how it's fetched.
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  // Check authentication status and get username
  useEffect(() => {
    const performAuthCheck = async () => {
      await checkAuth()
      setHasCheckedAuth(true) // Mark that the auth check has completed
    }

    performAuthCheck()
  }, [checkAuth])

  // Show auth error if needed
  if (!hasCheckedAuth) {
    // Render a loading state or a blank screen while checking authentication
    return (
      <div className="min-h-screen bg-blue-900 flex flex-col">
        <main className="container mx-auto px-4 pb-24 pt-16 flex-1 flex flex-col items-center justify-center">
          <div className="max-w-md w-full">
            <Alert variant="default" className="mb-6 bg-blue-900/50 border-blue-700 text-white">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <AlertTitle>Checking Authentication</AlertTitle>
              <AlertDescription>Please wait while we check your authentication status.</AlertDescription>
            </Alert>
          </div>
        </main>
        <NewNavbar />
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-blue-900 flex flex-col">
        <main className="container mx-auto px-4 pb-24 pt-16 flex-1 flex flex-col items-center justify-center">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-700 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>You need to be logged in to view your conversations.</AlertDescription>
            </Alert>

            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleLogin}>
              Log In
            </Button>
          </div>
        </main>
        <NewNavbar />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4 md:mb-0 glow-text">My Conversations</h1>

            {/* Usage indicator */}
            <div className="w-full md:w-64">
              <UsageIndicator />
            </div>
          </div>

          {/* Search bar */}
          <div className="mb-8 w-full max-w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="pl-10 w-full bg-blue-800/30 border border-blue-700/30 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset to first page when searching
                }}
              />
            </div>
          </div>

          {/* Conversations grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
              <span className="ml-3 text-blue-200">Loading conversations...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-8">
              {currentConversations.length > 0 ? (
                currentConversations.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    onClick={() => handleSelectConversation(conversation)}
                    onDeleteClick={(conv) => setConversationToDelete(conv)}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-blue-800/40 p-4 mb-4">
                    <MessageSquare className="h-10 w-10 text-blue-300" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">No conversations</h3>
                  <p className="text-blue-300/70 max-w-md">
                    Conversations and transcriptions from your meetings will appear here when you create them.
                  </p>
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => router.push("/new-meeting")}>
                    <Plus className="mr-2 h-4 w-4" />
                    New meeting
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && currentConversations.length > 0 && (
            <div className="flex justify-center mt-8">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center px-4 bg-blue-800/30 rounded-md text-white">
                  Page {currentPage} of {totalPages}
                </div>

                <Button
                  variant="outline"
                  className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {conversationToDelete && (
          <DeleteConfirmationModal
            conversation={conversationToDelete}
            onConfirm={handleDeleteConversation}
            onCancel={() => setConversationToDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* Loading overlay for delete operation */}
      <AnimatePresence>
        {deletingConversation && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-4 text-xl text-white">Deleting conversation...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading modal */}
      <AnimatePresence>{loadingConversation && <LoadingOverlay />}</AnimatePresence>

      {/* Conversation detail modal */}
      <AnimatePresence>
        {selectedConversation && !loadingConversation && (
          <ConversationDetail conversation={selectedConversation} onClose={() => setSelectedConversation(null)} />
        )}
      </AnimatePresence>

      {/* Navbar */}
      <NewNavbar />
    </div>
  )
}
