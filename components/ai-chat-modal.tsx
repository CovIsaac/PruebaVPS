"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { X, Send, ArrowLeft, Loader2, ListFilter } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { addUsernameToHeaders } from "@/utils/user-helpers"
import { getUsername } from "@/utils/user-helpers"

// Tipos para los mensajes
type MessageRole = "user" | "assistant" | "system"

interface ChatMessage {
  role: MessageRole
  content: string
}

// Tipo para el mapa de conversaciones
interface ConversationsMap {
  [meetingId: string]: ChatMessage[]
}

export const AIChatModal = ({ meeting, onClose }) => {
  const [activeTab, setActiveTab] = useState("chat")
  const [conversations, setConversations] = useState<ConversationsMap>({})
  const [inputValue, setInputValue] = useState("")
  const [isSearchingWeb, setIsSearchingWeb] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const messagesEndRef = useRef(null)
  const [meetingDetails, setMeetingDetails] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(true)
  const [isOpenAIConfigured, setIsOpenAIConfigured] = useState(true)
  const [openAIStatus, setOpenAIStatus] = useState({ message: "", isError: false })
  const [currentModel, setCurrentModel] = useState("GPT-4o Mini")
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [showMeetingSelector, setShowMeetingSelector] = useState(false)
  const [availableMeetings, setAvailableMeetings] = useState([])
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(meeting)

  // Inicializar las conversaciones al montar el componente
  useEffect(() => {
    const username = getUsername()
    if (!username) {
      setIsAuthenticated(false)
      // Inicializar con mensaje de error de autenticación
      setConversations({
        [selectedMeeting.id]: [
          {
            role: "assistant",
            content: "⚠️ Error de autenticación: No hay sesión activa. Por favor, inicia sesión de nuevo.",
          },
        ],
      })
    } else {
      // Inicializar con mensaje de bienvenida solo si está autenticado
      const welcomeMessage = {
        role: "assistant" as MessageRole,
        content: `Hola, soy tu asistente IA para reuniones. Ahora tengo acceso completo a toda la información de esta reunión, incluyendo:

• La transcripción completa
• El resumen de la reunión
• Los puntos clave identificados
• Las tareas asignadas

Puedo ayudarte con preguntas como:

• ¿Cuáles fueron los principales temas discutidos?
• ¿Qué dijo [nombre del participante] sobre [tema específico]?
• Resume la discusión sobre [tema específico]
• ¿Qué tareas se asignaron a [nombre]?
• ¿Cuáles son los puntos más importantes de la reunión?
• ¿Qué decisiones se tomaron sobre [tema]?

¿En qué puedo ayudarte hoy?`,
      }

      setConversations({
        [selectedMeeting.id]: [welcomeMessage],
      })
    }
  }, [])

  // Cargar las reuniones disponibles
  useEffect(() => {
    const fetchAvailableMeetings = async () => {
      setIsLoadingMeetings(true)
      try {
        const response = await fetch("/api/meetings", {
          headers: addUsernameToHeaders(),
        })

        if (!response.ok) throw new Error("Error al cargar las reuniones")

        const data = await response.json()
        setAvailableMeetings(data)
      } catch (error) {
        console.error("Error al cargar las reuniones:", error)
      } finally {
        setIsLoadingMeetings(false)
      }
    }

    fetchAvailableMeetings()
  }, [])

  // Función para cambiar a otra reunión
  const handleChangeMeeting = (newMeeting) => {
    setSelectedMeeting(newMeeting)
    setMeetingDetails(null)
    setIsLoadingDetails(true)

    // Si no hay conversación para esta reunión, inicializar con mensaje de bienvenida
    if (!conversations[newMeeting.id]) {
      setConversations((prev) => ({
        ...prev,
        [newMeeting.id]: [
          {
            role: "assistant",
            content: `Hola, soy tu asistente IA para reuniones. Ahora tengo acceso completo a toda la información de esta reunión, incluyendo:

• La transcripción completa
• El resumen de la reunión
• Los puntos clave identificados
• Las tareas asignadas

Puedo ayudarte con preguntas como:

• ¿Cuáles fueron los principales temas discutidos?
• ¿Qué dijo [nombre del participante] sobre [tema específico]?
• Resume la discusión sobre [tema específico]
• ¿Qué tareas se asignaron a [nombre]?
• ¿Cuáles son los puntos más importantes de la reunión?
• ¿Qué decisiones se tomaron sobre [tema]?

¿En qué puedo ayudarte hoy?`,
          },
        ],
      }))
    }

    setShowMeetingSelector(false)
  }

  // Cargar los detalles de la reunión
  useEffect(() => {
    const fetchMeetingDetails = async () => {
      if (!selectedMeeting) return
      if (!selectedMeeting.id) return

      setIsLoadingDetails(true)
      try {
        const response = await fetch(`/api/meetings/${selectedMeeting.id}`, {
          headers: addUsernameToHeaders(),
        })

        if (!response.ok) throw new Error("Error al cargar los detalles de la reunión")

        const data = await response.json()
        setMeetingDetails(data)
      } catch (error) {
        console.error("Error al cargar los detalles de la reunión:", error)
      } finally {
        setIsLoadingDetails(false)
      }
    }

    selectedMeeting && fetchMeetingDetails()
  }, [selectedMeeting])

  // Verificar la configuración de OpenAI
  useEffect(() => {
    const checkOpenAIConfig = async () => {
      try {
        const response = await fetch("/api/openai-check", {
          headers: addUsernameToHeaders(),
        })

        if (!response.ok) {
          throw new Error("Error al verificar la configuración de OpenAI")
        }

        const data = await response.json()
        setIsOpenAIConfigured(data.isConfigured)

        if (data.isConfigured) {
          setOpenAIStatus({
            message: `API de OpenAI configurada correctamente. Modelo: GPT-4o Mini`,
            isError: false,
          })
        } else {
          setOpenAIStatus({
            message: data.error || "La API de OpenAI no está configurada correctamente",
            isError: true,
          })

          // Añadir mensaje de advertencia a la conversación actual
          if (selectedMeeting?.id) {
            setConversations((prev) => {
              const currentMsgs = prev[selectedMeeting.id] || []
              return {
                ...prev,
                [selectedMeeting.id]: [
                  ...currentMsgs,
                  {
                    role: "assistant",
                    content: `⚠️ Advertencia: ${data.error || "La API de OpenAI no está configurada correctamente. El chat podría no funcionar."}`,
                  },
                ],
              }
            })
          }
        }
      } catch (error) {
        console.error("Error al verificar la configuración de OpenAI:", error)
        setIsOpenAIConfigured(false)
        setOpenAIStatus({
          message: error instanceof Error ? error.message : "Error desconocido al verificar la configuración",
          isError: true,
        })
      }
    }

    checkOpenAIConfig()
  }, [selectedMeeting?.id])

  // Función para enviar un mensaje a la API de chat
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isSendingMessage || !selectedMeeting?.id) return

    // Obtener los mensajes actuales para la reunión seleccionada
    const currentMessages = conversations[selectedMeeting.id] || []

    // Añadir mensaje del usuario a la conversación actual
    const userMessage: ChatMessage = { role: "user", content: inputValue }
    setConversations((prev) => {
      const currentMsgs = prev[selectedMeeting.id] || []
      return {
        ...prev,
        [selectedMeeting.id]: [...currentMsgs, userMessage],
      }
    })

    setInputValue("")
    setIsSendingMessage(true)

    try {
      // Verificar que haya un nombre de usuario antes de enviar el mensaje
      const headers = addUsernameToHeaders({
        "Content-Type": "application/json",
      })

      // Verificar si el objeto headers contiene el encabezado X-Username
      const headersObj = headers instanceof Headers ? headers : new Headers(headers)
      if (!headersObj.has("X-Username")) {
        throw new Error("No hay usuario autenticado. Por favor, inicia sesión de nuevo.")
      }

      // Preparar los mensajes para enviar a la API (solo los últimos 10 para mantener el contexto manejable)
      const recentMessages = [...currentMessages.slice(-10), userMessage]

      // Llamar a la API de chat
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: recentMessages.map((msg) => ({ role: msg.role, content: msg.content })),
          meetingId: selectedMeeting.id,
          searchWeb: isSearchingWeb,
        }),
      })

      // Check for authentication errors specifically
      if (response.status === 401) {
        throw new Error(
          "Error de autenticación: Sesión expirada o usuario no autorizado. Por favor, inicia sesión de nuevo.",
        )
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error response:", response.status, errorData)
        throw new Error(`Error ${response.status}: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()

      // Actualizar el modelo si viene en la respuesta
      if (data.model) {
        setCurrentModel(data.model)
      }

      // Añadir la respuesta de la IA a la conversación actual
      setConversations((prev) => {
        const currentMsgs = prev[selectedMeeting.id] || []
        return {
          ...prev,
          [selectedMeeting.id]: [...currentMsgs, { role: "assistant", content: data.response }],
        }
      })
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
      // Añadir mensaje de error a la conversación actual
      setConversations((prev) => {
        const currentMsgs = prev[selectedMeeting.id] || []
        return {
          ...prev,
          [selectedMeeting.id]: [
            ...currentMsgs,
            {
              role: "assistant",
              content: `Lo siento, ha ocurrido un error al procesar tu mensaje: ${error.message || "Error desconocido"}. Por favor, inténtalo de nuevo.`,
            },
          ],
        }
      })
    } finally {
      setIsSendingMessage(false)
    }
  }, [inputValue, conversations, selectedMeeting?.id, isSearchingWeb, isSendingMessage])

  // Scroll al último mensaje cuando se añade uno nuevo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversations, selectedMeeting?.id])

  // Obtener los mensajes actuales para la reunión seleccionada
  const currentMessages = selectedMeeting?.id ? conversations[selectedMeeting.id] || [] : []

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-upslp-900/90 border border-upslp-700/50 rounded-xl w-[95%] sm:w-full max-w-4xl max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-upslp-700/30 flex justify-between items-center sticky top-0 bg-upslp-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-white">{selectedMeeting.title}</h2>
            <span className="ml-4 text-upslp-200/70 text-sm">
              {selectedMeeting.date
                ? format(new Date(selectedMeeting.date), "dd/MM/yyyy HH:mm", { locale: es })
                : "Fecha desconocida"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-upslp-300 border-upslp-700/50"
              onClick={() => setShowMeetingSelector(!showMeetingSelector)}
            >
              <ListFilter className="h-4 w-4 mr-1" />
              Cambiar reunión
            </Button>
            <Button variant="outline" size="sm" className="text-upslp-300 border-upslp-700/50" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al listado
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-upslp-300 hover:text-white hover:bg-upslp-800/50"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Selector de reuniones */}
        {showMeetingSelector && (
          <div className="border-b border-upslp-700/30 bg-upslp-800/30 max-h-60 overflow-y-auto">
            <div className="p-3 sticky top-0 bg-upslp-800/90 backdrop-blur-sm border-b border-upslp-700/30 z-10">
              <h3 className="text-white font-medium">Seleccionar otra reunión</h3>
            </div>
            <div className="p-2">
              {isLoadingMeetings ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-6 w-6 text-upslp-400 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 p-2">
                  {availableMeetings.map((availableMeeting) => (
                    <div
                      key={availableMeeting.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        availableMeeting.id === selectedMeeting.id
                          ? "bg-upslp-600/40 border border-upslp-500"
                          : "hover:bg-upslp-700/40 bg-upslp-800/40 border border-upslp-700/30"
                      }`}
                      onClick={() => handleChangeMeeting(availableMeeting)}
                    >
                      <div className="font-medium text-white">{availableMeeting.title}</div>
                      <div className="text-sm text-upslp-200/70 mt-1">
                        {availableMeeting.date
                          ? format(new Date(availableMeeting.date), "dd/MM/yyyy HH:mm", { locale: es })
                          : "Fecha desconocida"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-2 sm:px-4 pt-2 border-b border-upslp-700/30 overflow-x-auto">
            <TabsList className="bg-upslp-800/30 w-full min-w-[500px] grid grid-cols-3 gap-1 p-1">
              <TabsTrigger value="chat" className="data-[state=active]:bg-orange-600 text-white text-xs sm:text-sm">
                Chat con IA
              </TabsTrigger>
              <TabsTrigger value="summary" className="data-[state=active]:bg-orange-600 text-white text-xs sm:text-sm">
                Resumen
              </TabsTrigger>
              <TabsTrigger
                value="key-points"
                className="data-[state=active]:bg-orange-600 text-white text-xs sm:text-sm"
              >
                Puntos Clave
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="h-[calc(90vh-180px)] flex flex-col">
            <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0 h-full">
              <div className="p-4 border-b border-upslp-700/30">
                <div className="flex items-center">
                  <Checkbox
                    id="search-web"
                    checked={isSearchingWeb}
                    onCheckedChange={() => setIsSearchingWeb(!isSearchingWeb)}
                    className="border-orange-500 data-[state=checked]:bg-orange-600"
                  />
                  <label htmlFor="search-web" className="ml-2 text-sm text-upslp-200">
                    Buscar información complementaria en internet (usando Google)
                  </label>
                </div>

                <div className="mt-2 p-2 bg-orange-600/20 border border-orange-500/30 rounded text-sm text-upslp-100">
                  💡 El asistente ahora tiene acceso completo a toda la información de la reunión: transcripción,
                  resumen, puntos clave y tareas.
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-upslp-800/20">
                <div className="space-y-4">
                  {currentMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-orange-600 text-white"
                            : "bg-upslp-700/40 border border-upslp-600/30 text-upslp-100"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isSendingMessage && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-3 bg-upslp-700/40 border border-upslp-600/30 text-upslp-100">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Pensando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input area */}
              <div className="p-4 border-t border-upslp-700/30 bg-upslp-900/80">
                {!isOpenAIConfigured && (
                  <div className="mb-3 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200 text-sm">
                    ⚠️ La API de OpenAI no está configurada correctamente. El chat podría no funcionar.
                  </div>
                )}
                <div className="flex items-center">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Escribe tu pregunta aquí..."
                    className="flex-1 bg-upslp-700/40 border border-upslp-600/50 text-white rounded-lg p-3 sm:p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleSendMessage()
                    }}
                    disabled={isSendingMessage || !isOpenAIConfigured}
                  />
                  <Button
                    className="ml-2 bg-orange-600 hover:bg-orange-700 text-white h-12 w-12 sm:h-auto sm:w-auto rounded-full sm:rounded-md p-0 sm:p-2"
                    onClick={handleSendMessage}
                    disabled={isSendingMessage || !inputValue.trim() || !isOpenAIConfigured}
                  >
                    {isSendingMessage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    <span className="sr-only">Enviar</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="m-0 p-4 overflow-y-auto h-full">
              {isLoadingDetails ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 text-upslp-400 animate-spin" />
                </div>
              ) : (
                <div className="bg-upslp-800/20 p-4 rounded-lg">
                  <h3 className="text-xl font-medium text-white mb-4">Resumen de la reunión</h3>
                  <p className="text-upslp-100">
                    {meetingDetails?.summary || "No hay resumen disponible para esta reunión."}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="key-points" className="m-0 p-4 overflow-y-auto h-full">
              {isLoadingDetails ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 text-upslp-400 animate-spin" />
                </div>
              ) : (
                <div className="bg-upslp-800/20 p-4 rounded-lg">
                  <h3 className="text-xl font-medium text-white mb-4">Puntos clave</h3>
                  {meetingDetails?.keyPoints && meetingDetails.keyPoints.length > 0 ? (
                    <ul className="space-y-2">
                      {meetingDetails.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <div className="h-5 w-5 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs flex-shrink-0 mr-3 mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-upslp-100">{point.point_text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-upslp-200">No hay puntos clave disponibles para esta reunión.</p>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
