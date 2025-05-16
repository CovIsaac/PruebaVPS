"use client"

import { useState, useRef, useEffect } from "react"
import { NewNavbar } from "@/components/new-navbar"
import {
  Mic,
  Upload,
  Play,
  Pause,
  Square,
  Settings,
  Save,
  Check,
  Loader,
  Calendar,
  Clock,
  MessageSquare,
  Search,
  AlertCircle,
  Lock,
  Users,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useMobile } from "@/hooks/use-mobile"
import { useRouter, useSearchParams } from "next/navigation"
import { getUsername } from "@/utils/user-helpers"
import { assemblyAIService } from "@/utils/assembly-ai"
import { Card, CardContent } from "@/components/ui/card"

// Lista de idiomas soportados
const supportedLanguages = [
  { value: "en", label: "Inglés" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Francés" },
  { value: "de", label: "Alemán" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Portugués" },
  { value: "nl", label: "Holandés" },
  { value: "ru", label: "Ruso" },
  { value: "zh", label: "Chino" },
  { value: "ja", label: "Japonés" },
  { value: "ko", label: "Coreano" },
]

// Componente para seleccionar el grupo
const GroupSelector = ({ onGroupSelect, onCancel }) => {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMobile = useMobile()

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true)

        // Obtener el nombre de usuario
        const username = getUsername()

        if (!username) {
          throw new Error("No se pudo obtener el nombre de usuario")
        }

        const response = await fetch("/api/groups/me", {
          headers: {
            "X-Username": username,
          },
        })

        if (!response.ok) {
          throw new Error("Error al obtener los grupos")
        }

        const data = await response.json()
        // Asegurarnos de que groups sea siempre un array
        if (Array.isArray(data)) {
          setGroups(data)
        } else if (data && typeof data === "object" && Array.isArray(data.groups)) {
          // Si la respuesta tiene una propiedad 'groups' que es un array
          setGroups(data.groups)
        } else if (data && typeof data === "object") {
          // Si es un objeto pero no tiene una propiedad 'groups', convertir las entradas en un array
          console.log("Estructura de datos recibida:", data)
          // Intentar extraer los grupos del objeto
          const extractedGroups = Object.values(data).filter(
            (item) => item && typeof item === "object" && "id" in item && "name" in item,
          )
          if (extractedGroups.length > 0) {
            setGroups(extractedGroups)
          } else {
            console.error("No se pudieron extraer grupos de la respuesta:", data)
            setGroups([])
          }
        } else {
          console.error("Formato de respuesta inesperado:", data)
          setGroups([])
        }
      } catch (err) {
        console.error("Error al cargar los grupos:", err)
        setError("No se pudieron cargar tus grupos. Por favor, intenta de nuevo.")
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader className="h-8 w-8 text-blue-500 animate-spin mb-4" />
        <p className="text-blue-200">Cargando tus grupos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800 text-white">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-6 text-center">
          <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No tienes grupos</h3>
          <p className="text-blue-200 mb-4">Necesitas crear o unirte a un grupo antes de poder crear una reunión.</p>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => (window.location.href = "/organization")}
          >
            Ir a Grupos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">Selecciona un grupo para esta reunión</h2>

      <div className="grid grid-cols-1 gap-4">
        {Array.isArray(groups) &&
          groups.map((group) => (
            <Card
              key={group.id}
              className="bg-blue-800/30 border border-blue-700/30 hover:bg-blue-700/30 transition-colors cursor-pointer"
              onClick={() => onGroupSelect(group)}
            >
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-white">{group.name}</h3>
                  <p className="text-sm text-blue-300">{group.member_count || 0} miembros</p>
                </div>
                <ChevronRight className="h-5 w-5 text-blue-400" />
              </CardContent>
            </Card>
          ))}
      </div>

      <div className={`flex ${isMobile ? "flex-col" : "justify-end"} gap-3 mt-6`}>
        <Button
          variant="outline"
          className={`border-blue-600/50 text-blue-300 hover:bg-blue-800/30 ${isMobile ? "w-full" : ""}`}
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}

// Función para detectar si el dispositivo es iOS
const isIOS = () => {
  if (typeof window === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

// Componente para la grabación de audio con espectrograma
const AudioRecorder = ({ onRecordingComplete, audioSettings, disabled }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [error, setError] = useState(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [audioData, setAudioData] = useState([])
  const isMobile = useMobile()

  const timerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const audioChunksRef = useRef([])

  // Función para inicializar el analizador de audio
  const setupAudioAnalyser = (stream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }

    const audioContext = audioContextRef.current
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    analyserRef.current = { analyser, dataArray, bufferLength }

    // Iniciar la visualización
    visualize()
  }

  // Función para dibujar el espectrograma
  const visualize = () => {
    if (!canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext("2d")
    const { analyser, dataArray, bufferLength } = analyserRef.current

    const WIDTH = canvas.width
    const HEIGHT = canvas.height

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)

    const drawVisual = () => {
      animationFrameRef.current = requestAnimationFrame(drawVisual)

      analyser.getByteFrequencyData(dataArray)

      canvasCtx.fillStyle = "rgb(20, 30, 60)"
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

      const barWidth = (WIDTH / bufferLength) * 2.5
      let barHeight
      let x = 0

      // Calcular el nivel de audio promedio para el indicador visual
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      const average = sum / bufferLength
      setAudioLevel(average / 255) // Normalizar a un valor entre 0 y 1

      // Dibujar el espectrograma
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2

        // Gradiente de color basado en la intensidad
        const hue = 220 - (dataArray[i] / 255) * 60 // Azul a celeste
        canvasCtx.fillStyle = `hsla(${hue}, 100%, 60%, 0.8)`

        canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight)
        x += barWidth + 1
      }

      // Actualizar el array de datos de audio para verificar si hay sonido
      setAudioData((prev) => {
        const newData = [...prev, average]
        if (newData.length > 10) newData.shift() // Mantener solo los últimos 10 valores
        return newData
      })
    }

    drawVisual()
  }

  // Iniciar la grabación de audio
  const startRecording = async () => {
    try {
      setError(null)

      // Obtener acceso al micrófono
      const constraints = {
        audio: {
          deviceId: audioSettings.selectedMic !== "default" ? { exact: audioSettings.selectedMic } : undefined,
          echoCancellation: true,
          noiseSuppression: audioSettings.noiseReduction !== "off",
          autoGainControl: true,
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Configurar el analizador de audio
      setupAudioAnalyser(stream)

      // Configurar el MediaRecorder con la calidad seleccionada
      const mimeType = "audio/webm;codecs=opus"
      let bitrate = 128000 // Por defecto (medium)

      switch (audioSettings.quality) {
        case "low":
          bitrate = 32000
          break
        case "high":
          bitrate = 256000
          break
      }

      const options = {
        mimeType,
        audioBitsPerSecond: bitrate,
      }

      // Intentar crear el MediaRecorder con las opciones especificadas
      let mediaRecorder
      try {
        mediaRecorder = new MediaRecorder(stream, options)
      } catch (e) {
        // Si falla, intentar con opciones predeterminadas
        console.warn(
          "No se pudo crear MediaRecorder con las opciones especificadas, usando configuración predeterminada",
          e,
        )
        mediaRecorder = new MediaRecorder(stream)
      }
      mediaRecorderRef.current = mediaRecorder

      // Manejar los datos grabados
      audioChunksRef.current = []
      mediaRecorder.ondataavailable = (e) => {
        console.log("Datos disponibles:", e.data.size)
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      // Cuando la grabación se detiene
      mediaRecorder.onstop = () => {
        console.log("MediaRecorder detenido, procesando datos...")
        if (audioChunksRef.current.length === 0) {
          setError("No se capturaron datos de audio. Intenta grabar de nuevo.")
          return
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        console.log("Blob creado, tamaño:", audioBlob.size)
        setAudioBlob(audioBlob)

        // Siempre procesar el audio, sin importar el umbral de detección
        if (audioBlob.size > 0) {
          saveAudioLocally(audioBlob)
        } else {
          setError("El archivo de audio está vacío. Intenta grabar de nuevo.")
        }
      }

      // Iniciar la grabación
      mediaRecorder.start(100) // Recoger datos cada 100ms
      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)

      // Iniciar el temporizador
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1)
      }, 1000)
    } catch (err) {
      console.error("Error al iniciar la grabación:", err)
      setError(`Error al acceder al micrófono: ${err.message}`)
    }
  }

  // Guardar el audio localmente
  const saveAudioLocally = async (blob) => {
    try {
      // Crear un objeto URL para acceso local
      const audioUrl = URL.createObjectURL(blob)

      // Generar un ID único para el audio
      const audioId = `audio_${Date.now()}`

      // Guardar el audio en localStorage como base64 (para archivos pequeños)
      // o simplemente guardar la referencia para archivos grandes
      try {
        // Convertir el blob a base64 solo para verificar que es válido
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = () => {
          // Verificar que tenemos datos válidos
          if (reader.result) {
            console.log("Audio grabado correctamente, tamaño:", blob.size)

            // Guardar referencia en localStorage
            localStorage.setItem("lastAudioId", audioId)

            // Notificar que la grabación está lista para procesar
            onRecordingComplete({
              id: audioId,
              url: audioUrl,
              blob: blob,
              duration: recordingTime,
              size: blob.size,
            })
          } else {
            throw new Error("No se pudo leer el audio grabado")
          }
        }
      } catch (e) {
        console.error("Error al procesar el audio:", e)
        setError("Error al procesar el audio grabado. Intenta una grabación más corta.")
        throw e
      }
    } catch (err) {
      console.error("Error al guardar el audio:", err)
      setError(`Error al guardar el audio: ${err.message}`)
      throw err
    }
  }

  // Detener la grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        // Asegurarse de que hay datos para grabar
        if (audioChunksRef.current.length === 0) {
          // Forzar la obtención de los datos actuales antes de detener
          mediaRecorderRef.current.requestData()
        }

        // Detener la grabación
        mediaRecorderRef.current.stop()
        clearInterval(timerRef.current)
        setIsRecording(false)
        setIsPaused(false)

        // Detener la visualización
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }

        // Detener y liberar el stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
        }

        console.log("Grabación detenida, chunks:", audioChunksRef.current.length)
      } catch (err) {
        console.error("Error al detener la grabación:", err)
        setError(`Error al detener la grabación: ${err.message}`)
      }
    }
  }

  // Pausar la grabación
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.pause()
        clearInterval(timerRef.current)
        setIsPaused(true)

        // Pausar la visualización
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }
  }

  // Reanudar la grabación
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume()
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1)
      }, 1000)
      setIsPaused(false)

      // Reanudar la visualización
      visualize()
    }
  }

  // Formatear el tiempo de grabación
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Limpiar recursos cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Inicializar el canvas con un fondo vacío cuando se monta el componente
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      ctx.fillStyle = "rgb(20, 30, 60)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  return (
    <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-4 sm:p-6">
      <div className="flex flex-col items-center">
        <div className="mb-4 sm:mb-6 relative">
          <div
            className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center ${
              isRecording
                ? isPaused
                  ? "bg-yellow-600/30"
                  : `bg-red-600/30 ${audioLevel > 0.05 ? "animate-pulse" : ""}`
                : disabled
                  ? "bg-gray-600/30"
                  : "bg-blue-600/30"
            }`}
            style={{
              boxShadow:
                isRecording && !isPaused && audioLevel > 0.05
                  ? `0 0 ${20 + audioLevel * 30}px ${audioLevel * 15}px rgba(239, 68, 68, ${audioLevel * 0.5})`
                  : "none",
            }}
          >
            <Mic
              className={`h-12 w-12 sm:h-16 sm:w-16 ${
                isRecording
                  ? isPaused
                    ? "text-yellow-400"
                    : "text-red-400"
                  : disabled
                    ? "text-gray-400"
                    : "text-blue-400"
              }`}
            />
          </div>
          <div className="mt-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-white">{formatTime(recordingTime)}</div>
            <div className="text-blue-300/70 text-xs sm:text-sm">
              {isRecording
                ? isPaused
                  ? "Grabación pausada"
                  : "Grabando..."
                : disabled
                  ? "Límite de grabaciones alcanzado"
                  : "Listo para grabar"}
            </div>
          </div>
        </div>

        {/* Canvas para el espectrograma */}
        <div className="w-full mb-4 sm:mb-6">
          <canvas ref={canvasRef} width="600" height="100" className="w-full h-16 sm:h-24 rounded-lg bg-blue-900/50" />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-800 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {disabled && (
          <Alert className="mb-4 bg-amber-900/50 border-amber-800 text-white">
            <Lock className="h-4 w-4" />
            <AlertTitle>Límite alcanzado</AlertTitle>
            <AlertDescription>
              Has alcanzado el límite de 50 transcripciones este mes. Vuelve el próximo mes para continuar.
            </AlertDescription>
          </Alert>
        )}

        <div className={`flex ${isMobile ? "flex-col w-full" : "flex-row"} gap-3`}>
          {!isRecording ? (
            <Button
              className={`${
                disabled ? "bg-gray-600 hover:bg-gray-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              } text-white ${isMobile ? "w-full" : ""}`}
              onClick={startRecording}
              disabled={disabled}
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar grabación
            </Button>
          ) : (
            <>
              {!isPaused ? (
                <Button
                  variant="outline"
                  className={`border-yellow-600/50 text-yellow-400 hover:bg-yellow-800/30 ${isMobile ? "w-full" : ""}`}
                  onClick={pauseRecording}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className={`border-blue-600/50 text-blue-400 hover:bg-blue-800/30 ${isMobile ? "w-full" : ""}`}
                  onClick={resumeRecording}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continuar
                </Button>
              )}
              <Button
                variant="outline"
                className={`border-red-600/50 text-red-400 hover:bg-red-800/30 ${isMobile ? "w-full" : ""}`}
                onClick={stopRecording}
              >
                <Square className="h-4 w-4 mr-2" />
                Detener
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente para subir archivos de audio
const AudioUploader = ({ onFileSelected, disabled }) => {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioRecorder, setAudioRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const isMobile = useMobile()
  const isIOSDevice = isIOS()

  // Timer para la grabación
  const timerRef = useRef(null)

  const validateAudioFile = (file) => {
    // Verificar el tipo de archivo
    const validTypes = [
      "audio/mp3",
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
      "audio/m4a",
      "audio/x-m4a",
      "audio/flac",
      "audio/ogg",
    ]

    // Aceptar cualquier tipo de audio si no podemos determinar el tipo específico
    if (!file.type.startsWith("audio/") && !validTypes.includes(file.type)) {
      setError("Formato de archivo no soportado. Por favor, sube un archivo de audio.")
      return false
    }

    // Verificar el tamaño (máximo 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB en bytes
    if (file.size > maxSize) {
      setError("El archivo es demasiado grande. El tamaño máximo permitido es 100MB.")
      return false
    }

    setError(null)
    return true
  }

  const handleFileChange = (e) => {
    if (disabled) return

    const file = e.target.files[0]
    if (file) {
      if (validateAudioFile(file)) {
        setSelectedFile(file)

        // Crear un objeto URL para el archivo
        const audioUrl = URL.createObjectURL(file)

        // Obtener la duración del audio
        const audio = new Audio(audioUrl)
        audio.onloadedmetadata = () => {
          const duration = Math.round(audio.duration)

          onFileSelected({
            id: `audio_${Date.now()}`,
            url: audioUrl,
            blob: file,
            duration: duration,
            name: file.name,
          })
        }
      }
    }
  }

  const handleDrag = (e) => {
    if (disabled) return

    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    if (disabled) return

    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateAudioFile(file)) {
        setSelectedFile(file)

        // Crear un objeto URL para el archivo
        const audioUrl = URL.createObjectURL(file)

        // Obtener la duración del audio
        const audio = new Audio(audioUrl)
        audio.onloadedmetadata = () => {
          const duration = Math.round(audio.duration)

          onFileSelected({
            id: `audio_${Date.now()}`,
            url: audioUrl,
            blob: file,
            duration: duration,
            name: file.name,
          })
        }
      }
    }
  }

  const triggerFileInput = () => {
    if (!disabled) {
      if (isIOSDevice) {
        // En iOS, iniciamos la grabación directamente
        startRecording()
      } else {
        fileInputRef.current.click()
      }
    }
  }

  // Iniciar grabación (para iOS)
  const startRecording = async () => {
    try {
      setError(null)

      // Verificar si el navegador soporta MediaRecorder
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Tu navegador no soporta la grabación de audio. Intenta con otro navegador.")
        return
      }

      // Obtener acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Crear el MediaRecorder
      const recorder = new MediaRecorder(stream)
      setAudioRecorder(recorder)

      // Limpiar chunks anteriores
      setAudioChunks([])

      // Configurar el evento de datos disponibles
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((prev) => [...prev, e.data])
        }
      }

      // Configurar el evento de finalización
      recorder.onstop = () => {
        // Detener todos los tracks del stream
        stream.getTracks().forEach((track) => track.stop())

        // Crear el blob de audio
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })

        // Crear URL para el blob
        const audioUrl = URL.createObjectURL(audioBlob)

        // Notificar que la grabación está lista
        onFileSelected({
          id: `audio_${Date.now()}`,
          url: audioUrl,
          blob: audioBlob,
          duration: recordingTime,
          name: `grabacion_${Date.now()}.wav`,
        })

        // Resetear estado
        setIsRecording(false)
        setRecordingTime(0)
        clearInterval(timerRef.current)
      }

      // Iniciar la grabación
      recorder.start()
      setIsRecording(true)

      // Iniciar el temporizador
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Error al iniciar la grabación:", err)
      setError(`Error al acceder al micrófono: ${err.message}`)
    }
  }

  // Detener grabación (para iOS)
  const stopRecording = () => {
    if (audioRecorder && audioRecorder.state !== "inactive") {
      audioRecorder.stop()
      clearInterval(timerRef.current)
    }
  }

  // Formatear el tiempo de grabación
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Limpiar recursos cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioRecorder && audioRecorder.state !== "inactive") {
        audioRecorder.stop()
      }
    }
  }, [audioRecorder])

  return (
    <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-4 sm:p-6">
      {isIOSDevice && isRecording ? (
        // Interfaz de grabación para iOS
        <div className="flex flex-col items-center">
          <div className="mb-4 text-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-red-600/30 animate-pulse flex items-center justify-center mx-auto mb-4">
              <Mic className="h-12 w-12 sm:h-16 sm:w-16 text-red-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">{formatTime(recordingTime)}</div>
            <div className="text-blue-300/70 text-xs sm:text-sm">Grabando...</div>
          </div>

          <Button
            variant="outline"
            className={`border-red-600/50 text-red-400 hover:bg-red-800/30 ${isMobile ? "w-full" : ""}`}
            onClick={stopRecording}
          >
            <Square className="h-4 w-4 mr-2" />
            Detener grabación
          </Button>
        </div>
      ) : (
        // Interfaz normal para subir archivos o iniciar grabación en iOS
        <div
          className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center ${
            dragActive
              ? "border-blue-500 bg-blue-600/20"
              : disabled
                ? "border-gray-700/50 opacity-60"
                : "border-blue-700/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav,audio/m4a,audio/x-m4a,audio/flac,audio/ogg"
            className="hidden"
            disabled={disabled}
          />

          <Upload
            className={`h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 ${disabled ? "text-gray-400" : "text-blue-400"}`}
          />

          <h3 className="text-base sm:text-lg font-medium text-white mb-2">
            {selectedFile
              ? selectedFile.name
              : isIOSDevice
                ? "Graba audio directamente"
                : "Arrastra y suelta tu archivo de audio aquí"}
          </h3>

          <p className="text-xs sm:text-sm text-blue-300/70 mb-3 sm:mb-4">
            {selectedFile
              ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
              : isIOSDevice
                ? "Toca el botón para iniciar la grabación"
                : "O haz clic para seleccionar un archivo de audio"}
          </p>

          <div className="text-xs text-blue-300/70 mb-3 sm:mb-4">Formatos soportados: MP3, WAV, M4A, FLAC, OGG</div>

          {error && (
            <Alert variant="destructive" className="mb-3 sm:mb-4 bg-red-900/50 border-red-800 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {disabled && (
            <Alert className="mb-3 sm:mb-4 bg-amber-900/50 border-amber-800 text-white">
              <Lock className="h-4 w-4" />
              <AlertTitle>Límite alcanzado</AlertTitle>
              <AlertDescription>
                Has alcanzado el límite de 50 transcripciones este mes. Vuelve el próximo mes para continuar.
              </AlertDescription>
            </Alert>
          )}

          <Button
            variant="outline"
            className={`${
              disabled
                ? "border-gray-600/50 text-gray-300 hover:bg-gray-800/30 cursor-not-allowed"
                : "border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
            } ${isMobile ? "w-full" : ""}`}
            onClick={triggerFileInput}
            disabled={disabled}
          >
            {isIOSDevice ? "Grabar audio" : "Seleccionar archivo"}
          </Button>
        </div>
      )}
    </div>
  )
}

// Componente para las opciones avanzadas
const AdvancedOptions = ({ settings, onSettingsChange, supportedFeatures }) => {
  const isMobile = useMobile()

  const handleMicSensitivityChange = (values) => {
    onSettingsChange({ ...settings, sensitivity: values[0] })
  }

  const handleMicChange = (value) => {
    onSettingsChange({ ...settings, selectedMic: value })
  }

  const handleQualityChange = (value) => {
    onSettingsChange({ ...settings, quality: value })
  }

  const handleNoiseReductionChange = (value) => {
    onSettingsChange({ ...settings, noiseReduction: value })
  }

  const handleLanguageChange = (value) => {
    onSettingsChange({ ...settings, language: value })
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="advanced-options" className="border-blue-700/30">
        <AccordionTrigger className="text-white hover:text-blue-300 px-2 py-3">
          <div className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Opciones avanzadas
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-5 py-2 px-2">
            {/* Idioma de transcripción */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-200">Idioma de transcripción</label>
              <Select value={settings.language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="bg-blue-700/40 border border-blue-600/50 text-white">
                  <SelectValue placeholder="Seleccionar idioma" />
                </SelectTrigger>
                <SelectContent className="bg-blue-800/90 border border-blue-700/50 max-h-[300px]">
                  {supportedLanguages.map((language) => (
                    <SelectItem key={language.value} value={language.value} className="text-white">
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-200">Dispositivo de micrófono</label>
              <Select
                value={settings.selectedMic}
                onValueChange={handleMicChange}
                disabled={!supportedFeatures.deviceSelection}
              >
                <SelectTrigger
                  className={`bg-blue-700/40 border border-blue-600/50 text-white ${!supportedFeatures.deviceSelection ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <SelectValue placeholder="Seleccionar micrófono" />
                </SelectTrigger>
                <SelectContent className="bg-blue-800/90 border border-blue-700/50">
                  {settings.availableMics.map((mic) => (
                    <SelectItem key={mic.deviceId} value={mic.deviceId} className="text-white">
                      {mic.label || `Micrófono ${mic.deviceId.slice(0, 5)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!supportedFeatures.deviceSelection && (
                <p className="text-xs text-yellow-300">
                  La selección de dispositivos no está disponible en este navegador.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-blue-200">Sensibilidad del micrófono</label>
                <span className="text-sm text-blue-300">{settings.sensitivity}%</span>
              </div>
              <Slider
                value={[settings.sensitivity]}
                onValueChange={handleMicSensitivityChange}
                min={0}
                max={100}
                step={1}
                className="w-full"
                disabled={!supportedFeatures.sensitivity}
              />
              <div className="flex justify-between text-xs text-blue-300/70">
                <span>Baja</span>
                <span>Alta</span>
              </div>
              {!supportedFeatures.sensitivity && (
                <p className="text-xs text-yellow-300">
                  El ajuste de sensibilidad no está disponible en este navegador.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-200">Calidad de grabación</label>
              <Select
                value={settings.quality}
                onValueChange={handleQualityChange}
                disabled={!supportedFeatures.quality}
              >
                <SelectTrigger
                  className={`bg-blue-700/40 border border-blue-600/50 text-white ${!supportedFeatures.quality ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <SelectValue placeholder="Seleccionar calidad" />
                </SelectTrigger>
                <SelectContent className="bg-blue-800/90 border border-blue-700/50">
                  <SelectItem value="low" className="text-white">
                    Baja (32 kbps)
                  </SelectItem>
                  <SelectItem value="medium" className="text-white">
                    Media (128 kbps)
                  </SelectItem>
                  <SelectItem value="high" className="text-white">
                    Alta (256 kbps)
                  </SelectItem>
                </SelectContent>
              </Select>
              {!supportedFeatures.quality && (
                <p className="text-xs text-yellow-300">El ajuste de calidad no está disponible en este navegador.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-200">Reducción de ruido</label>
              <Select
                value={settings.noiseReduction}
                onValueChange={handleNoiseReductionChange}
                disabled={!supportedFeatures.noiseReduction}
              >
                <SelectTrigger
                  className={`bg-blue-700/40 border border-blue-600/50 text-white ${!supportedFeatures.noiseReduction ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent className="bg-blue-800/90 border border-blue-700/50">
                  <SelectItem value="off" className="text-white">
                    Desactivado
                  </SelectItem>
                  <SelectItem value="low" className="text-white">
                    Bajo
                  </SelectItem>
                  <SelectItem value="medium" className="text-white">
                    Medio
                  </SelectItem>
                  <SelectItem value="high" className="text-white">
                    Alto
                  </SelectItem>
                  <SelectItem value="auto" className="text-white">
                    Automático
                  </SelectItem>
                </SelectContent>
              </Select>
              {!supportedFeatures.noiseReduction && (
                <p className="text-xs text-yellow-300">La reducción de ruido no está disponible en este navegador.</p>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

// Componente para el procesamiento de audio con espectrograma
const ProcessingSteps = ({ currentStep, progress, transcriptionData }) => {
  const steps = [
    { id: "processing", label: "Procesando audio" },
    { id: "transcribing", label: "Generando transcripción" },
    { id: "analyzing", label: "Analizando contenido" },
  ]

  // Referencia para el canvas del espectrograma
  const canvasRef = useRef(null)

  // Inicializar el canvas con un fondo vacío cuando se monta el componente
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      ctx.fillStyle = "rgb(20, 30, 60)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  // Dibujar el espectrograma simulado durante la transcripción

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Información de transcripción */}
      {currentStep === "transcribing" && transcriptionData && (
        <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-3 mb-4">
          <div className="text-sm font-medium text-blue-200 mb-1">Estado de la transcripción</div>
          <div className="text-xs text-blue-300/70">
            {transcriptionData.status === "processing" && "Procesando audio..."}
            {transcriptionData.status === "queued" && "En cola para procesamiento..."}
            {transcriptionData.status === "completed" && "Transcripción completada, finalizando..."}
            {transcriptionData.status === "error" && `Error: ${transcriptionData.error || "Desconocido"}`}
          </div>
          {transcriptionData.eta && (
            <div className="text-xs text-blue-300/70 mt-1">
              Tiempo estimado: {Math.ceil(transcriptionData.eta)} segundos
            </div>
          )}
        </div>
      )}

      {steps.map((step, index) => {
        const isActive = currentStep === step.id
        const isCompleted = steps.findIndex((s) => s.id === currentStep) > index

        return (
          <div key={step.id} className="space-y-2">
            <div className="flex items-center">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 ${
                  isCompleted ? "bg-green-500" : isActive ? "bg-blue-600" : "bg-blue-800/50"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 text-white" />
                ) : isActive ? (
                  <Loader className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <span className="text-xs text-white">{index + 1}</span>
                )}
              </div>
              <span
                className={`font-medium ${
                  isCompleted ? "text-green-400" : isActive ? "text-white" : "text-blue-300/70"
                }`}
              >
                {step.label}
              </span>
              {isCompleted && <span className="ml-auto text-green-400 text-sm">Completado</span>}
              {isActive && <span className="ml-auto text-blue-300 text-sm">{progress}%</span>}
            </div>
            {isActive && <Progress value={progress} className="h-2 bg-blue-800/50" indicatorClassName="bg-blue-500" />}
          </div>
        )
      })}
    </div>
  )
}

// Componente para la transcripción
const TranscriptionView = ({ transcription, onAnalyze, onCancel }) => {
  const [editableTranscription, setEditableTranscription] = useState(transcription || [])
  const [isEditing, setIsEditing] = useState(false)
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(null)
  const [hoveredSegment, setHoveredSegment] = useState(null)
  const isMobile = useMobile()
  const [newSpeakerName, setNewSpeakerName] = useState("")
  const [customSpeakers, setCustomSpeakers] = useState<string[]>([])

  useEffect(() => {
    setEditableTranscription(transcription || [])
  }, [transcription])

  if (!editableTranscription || editableTranscription.length === 0) {
    return (
      <div className="space-y-4">
        <div
          className="bg-blue-800/30 border border-blue-700/30 rounded-lg flex flex-col items-center justify-center p-4 sm:p-6 text-center"
          style={{ minHeight: isMobile ? "200px" : "300px" }}
        >
          <div className="rounded-full bg-blue-800/40 p-3 mb-4">
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-300" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-white mb-1">No hay transcripción disponible</h3>
          <p className="text-sm text-blue-300/70">
            No se ha generado ninguna transcripción. Intenta grabar una nueva reunión.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onCancel}>
            Volver
          </Button>
        </div>
      </div>
    )
  }

  // Agrupar por hablante para mostrar colores consistentes
  const speakers = [...new Set(editableTranscription.map((item) => item.speaker))]
  const speakerColors = {
    "Speaker 1": "bg-blue-500",
    "Speaker 2": "bg-green-500",
    "Speaker 3": "bg-purple-500",
    "Speaker 4": "bg-yellow-500",
    "Speaker 5": "bg-red-500",
    "Speaker 6": "bg-pink-500",
  }

  // Asignar colores a hablantes no identificados
  speakers.forEach((speaker, index) => {
    if (!speakerColors[speaker]) {
      const colorKeys = Object.keys(speakerColors)
      speakerColors[speaker] = speakerColors[colorKeys[index % colorKeys.length]]
    }
  })

  const handleSpeakerChange = (index, newSpeaker) => {
    const updatedTranscription = [...editableTranscription]
    updatedTranscription[index].speaker = newSpeaker
    setEditableTranscription(updatedTranscription)
  }

  const handleBulkSpeakerChange = () => {
    if (!selectedSpeakerId) return

    const updatedTranscription = editableTranscription.map((item, idx) => {
      if (
        hoveredSegment === idx ||
        (hoveredSegment !== null && item.speaker === editableTranscription[hoveredSegment].speaker)
      ) {
        return { ...item, speaker: selectedSpeakerId }
      }
      return item
    })

    setEditableTranscription(updatedTranscription)
    setSelectedSpeakerId(null)
    setHoveredSegment(null)
  }

  // Función para corregir automáticamente inconsistencias
  const autoCorrectSpeakers = () => {
    // Crear una copia de la transcripción
    const corrected = [...editableTranscription]

    // Agrupar segmentos consecutivos del mismo hablante
    let currentSpeaker = null
    let currentGroup = []
    const groups = []

    corrected.forEach((segment) => {
      if (segment.speaker !== currentSpeaker) {
        if (currentGroup.length > 0) {
          groups.push({
            speaker: currentSpeaker,
            segments: [...currentGroup],
          })
        }
        currentSpeaker = segment.speaker
        currentGroup = [segment]
      } else {
        currentGroup.push(segment)
      }
    })

    // Añadir el último grupo
    if (currentGroup.length > 0) {
      groups.push({
        speaker: currentSpeaker,
        segments: [...currentGroup],
      })
    }

    // Corregir grupos pequeños entre dos grupos del mismo hablante
    for (let i = 1; i < groups.length - 1; i++) {
      const prevGroup = groups[i - 1]
      const currentGroup = groups[i]
      const nextGroup = groups[i + 1]

      // Si un grupo pequeño está entre dos grupos del mismo hablante, corregirlo
      if (
        prevGroup.speaker === nextGroup.speaker &&
        currentGroup.segments.length <= 2 &&
        prevGroup.segments.length > 1 &&
        nextGroup.segments.length > 1
      ) {
        currentGroup.segments.forEach((segment) => {
          segment.speaker = prevGroup.speaker
        })
      }
    }

    // Corregir alternancias rápidas entre hablantes
    for (let i = 1; i < groups.length - 1; i++) {
      const prevGroup = groups[i - 1]
      const currentGroup = groups[i]
      const nextGroup = groups[i + 1]

      // Si hay un patrón de alternancia A-B-A con grupos pequeños, unificar
      if (prevGroup.speaker === nextGroup.speaker && currentGroup.segments.length <= 3) {
        currentGroup.segments.forEach((segment) => {
          segment.speaker = prevGroup.speaker
        })
      }
    }

    // Reconstruir la transcripción corregida
    const correctedTranscription = []
    groups.forEach((group) => {
      group.segments.forEach((segment) => {
        correctedTranscription.push(segment)
      })
    })

    setEditableTranscription(correctedTranscription)
  }

  return (
    <div className="space-y-4">
      <div className={`flex ${isMobile ? "flex-col" : "justify-between"} items-start sm:items-center mb-4 gap-2`}>
        <h3 className="text-lg font-medium text-white">Transcripción</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
            onClick={autoCorrectSpeakers}
          >
            <Check className="h-4 w-4 mr-2" />
            Auto-corregir
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`${isEditing ? "bg-blue-700/50" : "bg-transparent"} border-blue-600/50 text-blue-300`}
            onClick={() => setIsEditing(!isEditing)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isEditing ? "Finalizar" : "Editar"}
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className="bg-blue-800/40 p-3 sm:p-4 rounded-lg mb-4 border border-blue-700/50">
          <h4 className="text-sm font-medium text-white mb-2">Modo de edición de hablantes</h4>
          <p className="text-xs text-blue-300/70 mb-2 sm:mb-3">
            Puedes corregir la asignación de hablantes de dos formas:
          </p>
          <ol className="text-xs text-blue-300/70 list-decimal pl-4 space-y-1 mb-2 sm:mb-3">
            <li>Haz clic en el nombre del hablante para cambiarlo individualmente.</li>
            <li>
              O selecciona un hablante abajo y luego haz clic en un segmento para reasignar todos los segmentos
              similares.
            </li>
          </ol>

          {/* Formulario para añadir hablante personalizado */}
          <div className="flex items-center gap-2 mt-3 mb-3">
            <input
              type="text"
              value={newSpeakerName}
              onChange={(e) => setNewSpeakerName(e.target.value)}
              placeholder="Nuevo hablante..."
              className="bg-blue-800/50 border border-blue-700/50 text-white rounded text-xs sm:text-sm py-1 px-2 flex-1"
            />
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                if (newSpeakerName.trim() === "") return
                // Verificar que el nombre no exista ya
                if (!speakers.includes(newSpeakerName) && !customSpeakers.includes(newSpeakerName)) {
                  setCustomSpeakers([...customSpeakers, newSpeakerName])
                  setSelectedSpeakerId(newSpeakerName)
                  setNewSpeakerName("")
                }
              }}
            >
              Añadir
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
            {/* Hablantes originales */}
            {speakers.map((speaker) => (
              <Button
                key={speaker}
                size="sm"
                variant="outline"
                className={`border-blue-600/50 ${selectedSpeakerId === speaker ? "bg-blue-700/50" : "bg-transparent"}`}
                onClick={() => setSelectedSpeakerId(speaker)}
              >
                <div className={`w-3 h-3 rounded-full ${speakerColors[speaker]} mr-2`}></div>
                {speaker}
              </Button>
            ))}

            {/* Hablantes personalizados */}
            {customSpeakers.map((speaker) => (
              <Button
                key={speaker}
                size="sm"
                variant="outline"
                className={`border-blue-600/50 ${selectedSpeakerId === speaker ? "bg-blue-700/50" : "bg-transparent"}`}
                onClick={() => setSelectedSpeakerId(speaker)}
              >
                <div className={`w-3 h-3 rounded-full ${speakerColors[speaker] || "bg-gray-500"} mr-2`}></div>
                {speaker}
              </Button>
            ))}

            {selectedSpeakerId && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white ml-auto"
                onClick={handleBulkSpeakerChange}
              >
                Aplicar cambios
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-3 sm:p-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
        <div className="space-y-4 sm:space-y-6">
          {editableTranscription.map((item, index) => (
            <div
              key={index}
              className={`flex ${hoveredSegment === index ? "bg-blue-700/30" : ""} p-2 rounded-lg transition-colors`}
              onMouseEnter={() => (isEditing ? setHoveredSegment(index) : null)}
              onMouseLeave={() => (isEditing ? setHoveredSegment(null) : null)}
              onClick={() => {
                if (isEditing && selectedSpeakerId) {
                  handleSpeakerChange(index, selectedSpeakerId)
                }
              }}
            >
              <div className="w-16 sm:w-24 flex-shrink-0">
                <div className="text-xs sm:text-sm text-blue-300">{item.time}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center font-medium text-white mb-1">
                  {isEditing ? (
                    <div className="flex items-center cursor-pointer">
                      <div
                        className={`w-3 h-3 rounded-full ${speakerColors[item.speaker] || "bg-gray-500"} mr-2`}
                      ></div>
                      <select
                        value={item.speaker}
                        onChange={(e) => handleSpeakerChange(index, e.target.value)}
                        className="bg-blue-800/50 border border-blue-700/50 rounded text-xs sm:text-sm py-0 px-1"
                      >
                        {/* Hablantes originales */}
                        {speakers.map((speaker) => (
                          <option key={speaker} value={speaker}>
                            {speaker}
                          </option>
                        ))}

                        {/* Separador si hay hablantes personalizados */}
                        {customSpeakers.length > 0 && <option disabled>──────────</option>}

                        {/* Hablantes personalizados */}
                        {customSpeakers.map((speaker) => (
                          <option key={speaker} value={speaker}>
                            {speaker}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`w-3 h-3 rounded-full ${speakerColors[item.speaker] || "bg-gray-500"} mr-2`}
                      ></div>
                      {item.speaker}
                    </>
                  )}
                </div>
                <div className="text-sm text-blue-100">{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`flex ${isMobile ? "flex-col" : "justify-end"} gap-3`}>
        <Button
          variant="outline"
          className={`border-blue-600/50 text-blue-300 hover:bg-blue-800/30 ${isMobile ? "w-full" : ""}`}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          className={`bg-blue-600 hover:bg-blue-700 text-white ${isMobile ? "w-full" : ""}`}
          onClick={() => {
            // Pasar la transcripción editada en lugar de la original
            onAnalyze(editableTranscription)
          }}
        >
          Analizar
        </Button>
      </div>
    </div>
  )
}

// Componente para el análisis de la reunión
const MeetingAnalysis = ({ analysis, onSave, onCancel, selectedGroup }) => {
  const [meetingTitle, setMeetingTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const isMobile = useMobile()

  const noContentMessage = (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center">
      <div className="rounded-full bg-blue-800/40 p-2 sm:p-3 mb-3 sm:mb-4">
        <Search className="h-4 w-4 sm:h-6 sm:w-6 text-blue-300" />
      </div>
      <h3 className="text-base sm:text-lg font-medium text-white mb-1">Sin contenido</h3>
      <p className="text-xs sm:text-sm text-blue-300/70">No hay información disponible en este momento.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="bg-blue-800/30 w-full">
          <TabsTrigger value="summary" className="data-[state=active]:bg-blue-600 text-white text-xs sm:text-sm">
            Resumen
          </TabsTrigger>
          <TabsTrigger value="key-points" className="data-[state=active]:bg-blue-600 text-white text-xs sm:text-sm">
            Puntos Clave
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="summary" className="m-0">
            <div className="bg-blue-800/20 p-3 sm:p-4 rounded-lg">
              {analysis.summary ? (
                <p className="text-sm sm:text-base text-blue-100">{analysis.summary}</p>
              ) : (
                noContentMessage
              )}
            </div>
          </TabsContent>

          <TabsContent value="key-points" className="m-0">
            <div className="bg-blue-800/20 p-3 sm:p-4 rounded-lg">
              {analysis.keyPoints && analysis.keyPoints.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0 mr-2 sm:mr-3 mt-0.5">
                        {index + 1}
                      </div>
                      <span className="text-sm sm:text-base text-blue-100">{point}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                noContentMessage
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="pt-4 border-t border-blue-700/30">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-blue-200">Título de la reunión</label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="Ingresa un título para esta reunión"
              className="w-full bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-2 sm:p-2.5 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-blue-200">Grupo</label>
            <div className="bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-2 sm:p-2.5 text-sm">
              {selectedGroup.name}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center text-blue-200/70 text-xs sm:text-sm gap-2 sm:gap-0">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="mr-2 sm:mr-3">{format(new Date(), "dd MMM yyyy", { locale: es })}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span>{format(new Date(), "HH:mm", { locale: es })}</span>
            </div>
          </div>

          <div className={`flex ${isMobile ? "flex-col" : "justify-end"} gap-3`}>
            <Button
              variant="outline"
              className={`border-blue-600/50 text-blue-300 hover:bg-blue-800/30 ${isMobile ? "w-full" : ""}`}
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              className={`bg-blue-600 hover:bg-blue-700 text-white ${isMobile ? "w-full" : ""}`}
              onClick={() => onSave({ title: meetingTitle, groupId: selectedGroup.id })}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Función para transcribir audio con AssemblyAI
const transcribeAudio = async (audioBlob, settings) => {
  try {
    // Mostrar mensaje de inicio
    console.log("Iniciando transcripción con AssemblyAI...")

    // Usar el servicio de AssemblyAI para la transcripción completa
    const transcription = await assemblyAIService.transcribeWithAssemblyAI(audioBlob, settings, (progress, stage) => {
      // Esta función se llamará con actualizaciones de progreso
      console.log(`Progreso de transcripción: ${progress}% (${stage})`)
      // Aquí se podría actualizar el estado de la UI con el progreso
    })

    return transcription
  } catch (error) {
    console.error("Error en la transcripción con AssemblyAI:", error)
    throw error
  }
}

// Componente principal
export default function NewMeetingPage() {
  const [recordingMode, setRecordingMode] = useState("record-audio")
  const [processingState, setProcessingState] = useState(null) // null, "processing", "transcribing", "analyzing", "completed"
  const [processingProgress, setProcessingProgress] = useState(0)
  const [showTranscription, setShowTranscription] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [savedSuccessfully, setSavedSuccessfully] = useState(false)
  const [audioFile, setAudioFile] = useState(null)
  const [error, setError] = useState(null)
  const [transcription, setTranscription] = useState([])
  const [analysisResults, setAnalysisResults] = useState({
    summary: "",
    keyPoints: [],
  })
  // Estado para las opciones avanzadas
  const [audioSettings, setAudioSettings] = useState({
    selectedMic: "default",
    availableMics: [],
    sensitivity: 75,
    quality: "medium",
    noiseReduction: "auto",
    language: "es", // Idioma por defecto: español
  })
  const [isSaving, setIsSaving] = useState(false)
  const [usageData, setUsageData] = useState(null)
  const [usageLoading, setUsageLoading] = useState(true)
  const isMobile = useMobile()
  const router = useRouter()
  const [transcriptionData, setTranscriptionData] = useState(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionTimeout, setTranscriptionTimeout] = useState(null)

  // Nuevo estado para la selección de grupo
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showGroupSelector, setShowGroupSelector] = useState(true)

  // Cambiar el modo si estamos en móvil y el modo seleccionado es "record-meeting"
  useEffect(() => {
    if (isMobile && recordingMode === "record-meeting") {
      setRecordingMode("record-audio")
    }
  }, [isMobile, recordingMode])

  // Estado para las características soportadas
  const [supportedFeatures, setSupportedFeatures] = useState({
    deviceSelection: false,
    sensitivity: false,
    quality: false,
    noiseReduction: false,
  })

  // Fetch usage data when component mounts
  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setUsageLoading(true)

        // Get username from localStorage
        const username = getUsername()

        if (!username) {
          console.error("No username found in localStorage")
          setUsageData({ used: 0, limit: 50, remaining: 50 })
          return
        }

        // Fetch usage data from API
        const response = await fetch("/api/user/usage", {
          headers: {
            "X-Username": username,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch usage data")
        }

        const data = await response.json()
        setUsageData(data)
      } catch (err) {
        console.error("Error fetching usage data:", err)
        // Set default values
        setUsageData({ used: 0, limit: 50, remaining: 50 })
      } finally {
        setUsageLoading(false)
      }
    }

    fetchUsageData()
  }, [])

  // Detectar dispositivos de audio disponibles
  useEffect(() => {
    const checkBrowserSupport = async () => {
      // Verificar si el navegador soporta getUserMedia
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

      // Verificar si el navegador soporta AudioContext
      const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext)

      // Verificar si el navegador soporta MediaRecorder
      const hasMediaRecorder = !!window.MediaRecorder

      // Actualizar las características soportadas
      setSupportedFeatures({
        deviceSelection: hasGetUserMedia,
        sensitivity: hasAudioContext,
        quality: hasMediaRecorder,
        noiseReduction: hasGetUserMedia,
      })

      if (hasGetUserMedia) {
        try {
          // Solicitar permisos para acceder al micrófono
          await navigator.mediaDevices.getUserMedia({ audio: true })

          // Obtener la lista de dispositivos
          const devices = await navigator.mediaDevices.enumerateDevices()
          const mics = devices
            .filter((device) => device.kind === "audioinput")
            .map((device) => ({
              deviceId: device.deviceId,
              label: device.label || `Micrófono ${device.deviceId.slice(0, 5)}`,
            }))

          // Añadir el micrófono predeterminado si no está en la lista
          if (!mics.some((mic) => mic.deviceId === "default")) {
            mics.unshift({ deviceId: "default", label: "Micrófono predeterminado" })
          }

          setAudioSettings((prev) => ({
            ...prev,
            availableMics: mics,
          }))
        } catch (err) {
          console.error("Error al acceder a los dispositivos de audio:", err)
          setError("No se pudo acceder a los dispositivos de audio. Por favor, verifica los permisos del micrófono.")
        }
      }
    }

    checkBrowserSupport()
  }, [])

  // Check if user has reached the monthly limit
  const hasReachedLimit = usageData && usageData.remaining <= 0

  // Manejar la selección de grupo
  const handleGroupSelect = (group) => {
    setSelectedGroup(group)
    setShowGroupSelector(false)
  }

  // Manejar la cancelación de selección de grupo
  const handleGroupSelectCancel = () => {
    router.push("/dashboard")
  }

  // Manejar la finalización de la grabación o la selección de archivo
  const handleRecordingComplete = (audioData) => {
    console.log("Audio recibido:", audioData)

    if (!audioData || !audioData.blob) {
      setError("No se pudo obtener el audio grabado.")
      return
    }

    // Verificar que el blob tiene contenido
    if (audioData.blob.size === 0) {
      setError("El archivo de audio está vacío. Intenta grabar de nuevo.")
      return
    }

    setAudioFile(audioData)
    console.log("Audio guardado correctamente, procediendo a procesar")

    // Iniciar el proceso de procesamiento
    processAudio(audioData.blob)
  }

  // Procesar el audio grabado o subido
  const processAudio = async (audioBlob) => {
    // Verificar que tenemos un blob de audio válido
    if (!audioBlob || audioBlob.size === 0) {
      setError("El archivo de audio está vacío o no es válido.")
      return
    }

    console.log("Procesando audio, tamaño:", audioBlob.size)
    setProcessingState("processing")
    setProcessingProgress(0)
    setError(null)

    try {
      // Guardar el audio en localStorage para respaldo
      const audioId = `processed_audio_${Date.now()}`
      localStorage.setItem("processingAudioId", audioId)

      // Simular procesamiento de audio
      const processingInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(processingInterval)

            // Pasar a la transcripción
            setProcessingState("transcribing")
            setProcessingProgress(0)
            setIsTranscribing(true)

            // Iniciar la transcripción con AssemblyAI
            startTranscriptionProcess(audioBlob)

            return 100
          }
          return prev + 5
        })
      }, 200)
    } catch (err) {
      console.error("Error al procesar el audio:", err)
      setError(`Error al procesar el audio: ${err.message}`)
      resetProcess()
    }
  }

  // Iniciar el proceso de transcripción con AssemblyAI
  const startTranscriptionProcess = async (audioBlob) => {
    try {
      console.log("Iniciando proceso de transcripción con AssemblyAI...")
      console.log("Tamaño del blob de audio:", audioBlob.size, "bytes")

      // Verificar que el blob de audio sea válido
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("El archivo de audio está vacío o no es válido.")
      }

      setTranscriptionData({ status: "processing", message: "Iniciando transcripción..." })

      // Establecer un timeout para reintentar si la transcripción tarda demasiado
      const timeout = setTimeout(() => {
        if (isTranscribing) {
          console.log("Timeout de transcripción alcanzado, reintentando...")
          setError("La transcripción está tardando demasiado. Intentando nuevamente...")
          retryTranscription(audioBlob)
        }
      }, 180000) // Aumentado a 3 minutos

      setTranscriptionTimeout(timeout)

      // Iniciar la transcripción con AssemblyAI con logging detallado
      console.log("Configuración de audio para transcripción:", audioSettings)

      try {
        const result = await assemblyAIService.transcribeWithAssemblyAI(audioBlob, audioSettings, (progress, stage) => {
          console.log(`Progreso de transcripción: ${progress}% (${stage})`)
          setProcessingProgress(progress)
          setTranscriptionData({
            status: stage,
            message: getStageMessage(stage),
            progress: progress,
          })
        })

        console.log("Transcripción completada exitosamente:", result)

        // Limpiar el timeout si la transcripción se completa correctamente
        clearTimeout(timeout)
        setTranscriptionTimeout(null)
        setIsTranscribing(false)

        // Verificar que el resultado sea válido
        if (!result || !Array.isArray(result) || result.length === 0) {
          throw new Error("La transcripción no devolvió resultados válidos.")
        }

        // Actualizar el estado con la transcripción
        setTranscription(result)
        setShowTranscription(true)
        setProcessingState(null)
      } catch (transcriptionError) {
        console.error("Error durante la transcripción:", transcriptionError)

        // Crear una transcripción de respaldo con un mensaje de error
        const errorMessage = transcriptionError.message || "Error desconocido"
        const fallbackTranscription = assemblyAIService.createFallbackTranscription(
          audioFile?.duration || 0,
          errorMessage,
        )

        // Mostrar el error pero continuar con la transcripción de respaldo
        setError(`Error en la transcripción: ${errorMessage}. Se ha creado una transcripción básica.`)

        // Actualizar el estado con la transcripción de respaldo
        setTranscription(fallbackTranscription)
        setShowTranscription(true)
        setProcessingState(null)

        // Limpiar el timeout
        clearTimeout(timeout)
        setTranscriptionTimeout(null)
        setIsTranscribing(false)
      }
    } catch (error) {
      console.error("Error en la transcripción:", error)

      // Mensaje de error más descriptivo basado en el tipo de error
      let errorMessage = `Error en la transcripción: ${error.message}`

      // Si el error menciona modelos no disponibles en el idioma
      if (error.message.includes("models are not available in this language")) {
        errorMessage = `El idioma seleccionado no soporta todas las funciones. Intente con otro idioma o con inglés.`
      }

      setError(errorMessage)

      // Limpiar el timeout si hay un error
      if (transcriptionTimeout) {
        clearTimeout(transcriptionTimeout)
        setTranscriptionTimeout(null)
      }

      // Reintentar la transcripción con inglés si el error es de idioma
      if (error.message.includes("models are not available in this language")) {
        // Cambiar temporalmente a inglés para el reintento
        const englishSettings = { ...audioSettings, language: "en" }
        setTimeout(() => {
          setError("Reintentando transcripción en inglés...")
          startTranscriptionWithLanguage(audioBlob, englishSettings)
        }, 2000)
      } else {
        // Reintentar con la configuración actual para otros errores
        retryTranscription(audioBlob)
      }
    }
  }

  // Function to retry transcription
  const retryTranscription = async (audioBlob) => {
    console.log("Reintentando transcripción...")
    setError(null)
    setTranscriptionData({ status: "processing", message: "Reintentando transcripción..." })
    setIsTranscribing(true)

    // Usar un enfoque simplificado para el reintento
    try {
      // Subir el archivo directamente (sin pasar por todo el proceso)
      const audioUrl = await assemblyAIService.uploadAudioToAssemblyAI(audioBlob)

      // Iniciar la transcripción con configuración simplificada
      const simplifiedSettings = {
        ...audioSettings,
        language: "en", // Usar inglés para mayor compatibilidad
      }

      const transcriptId = await assemblyAIService.startTranscription(audioUrl, simplifiedSettings)

      // Esperar a que se complete
      const transcriptData = await assemblyAIService.waitForTranscriptionCompletion(transcriptId, (progress) => {
        setProcessingProgress(20 + progress * 0.7)
        setTranscriptionData({
          status: "transcribing",
          message: "Reintentando transcripción...",
          progress: progress,
        })
      })

      // Formatear los resultados
      const formattedTranscription = assemblyAIService.formatTranscriptionResults(transcriptData)

      // Actualizar el estado
      setTranscription(formattedTranscription)
      setShowTranscription(true)
      setProcessingState(null)
      setIsTranscribing(false)
    } catch (error) {
      console.error("Error en el reintento de transcripción:", error)

      // Crear una transcripción de respaldo
      const fallbackTranscription = assemblyAIService.createFallbackTranscription(
        audioFile?.duration || 0,
        error.message || "Error desconocido durante el reintento",
      )

      // Mostrar el error pero continuar con la transcripción de respaldo
      setError(`No se pudo completar la transcripción. Se ha creado una transcripción básica.`)

      // Actualizar el estado con la transcripción de respaldo
      setTranscription(fallbackTranscription)
      setShowTranscription(true)
      setProcessingState(null)
      setIsTranscribing(false)
    }
  }

  const resetProcess = () => {
    setProcessingState(null)
    setProcessingProgress(0)
    setIsTranscribing(false)
    setShowTranscription(false)
    setShowAnalysis(false)
    setTranscription([])
    setAnalysisResults({ summary: "", keyPoints: [] })
    setError(null)
    setTranscriptionData(null)
    if (transcriptionTimeout) {
      clearTimeout(transcriptionTimeout)
      setTranscriptionTimeout(null)
    }
  }

  const getStageMessage = (stage) => {
    switch (stage) {
      case "processing":
        return "Procesando audio..."
      case "queued":
        return "En cola para procesamiento..."
      case "completed":
        return "Transcripción completada, finalizando..."
      case "error":
        return "Error en la transcripción."
      default:
        return "Iniciando transcripción..."
    }
  }

  const startTranscriptionWithLanguage = async (audioBlob, settings) => {
    try {
      console.log("Iniciando proceso de transcripción con AssemblyAI en inglés...")
      console.log("Tamaño del blob de audio:", audioBlob.size, "bytes")

      // Verificar que el blob de audio sea válido
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("El archivo de audio está vacío o no es válido.")
      }

      setTranscriptionData({ status: "processing", message: "Iniciando transcripción en inglés..." })

      // Establecer un timeout para reintentar si la transcripción tarda demasiado
      const timeout = setTimeout(() => {
        if (isTranscribing) {
          console.log("Timeout de transcripción alcanzado, reintentando...")
          setError("La transcripción está tardando demasiado. Intentando nuevamente...")
          retryTranscription(audioBlob)
        }
      }, 180000) // Aumentado a 3 minutos

      setTranscriptionTimeout(timeout)

      // Iniciar la transcripción con AssemblyAI con logging detallado
      console.log("Configuración de audio para transcripción:", settings)

      try {
        const result = await assemblyAIService.transcribeWithAssemblyAI(audioBlob, settings, (progress, stage) => {
          console.log(`Progreso de transcripción: ${progress}% (${stage})`)
          setProcessingProgress(progress)
          setTranscriptionData({
            status: stage,
            message: getStageMessage(stage),
            progress: progress,
          })
        })

        console.log("Transcripción completada exitosamente:", result)

        // Limpiar el timeout si la transcripción se completa correctamente
        clearTimeout(timeout)
        setTranscriptionTimeout(null)
        setIsTranscribing(false)

        // Verificar que el resultado sea válido
        if (!result || !Array.isArray(result) || result.length === 0) {
          throw new Error("La transcripción no devolvió resultados válidos.")
        }

        // Actualizar el estado con la transcripción
        setTranscription(result)
        setShowTranscription(true)
        setProcessingState(null)
      } catch (transcriptionError) {
        console.error("Error durante la transcripción:", transcriptionError)

        // Crear una transcripción de respaldo con un mensaje de error
        const errorMessage = transcriptionError.message || "Error desconocido"
        const fallbackTranscription = assemblyAIService.createFallbackTranscription(
          audioFile?.duration || 0,
          errorMessage,
        )

        // Mostrar el error pero continuar con la transcripción de respaldo
        setError(`Error en la transcripción: ${errorMessage}. Se ha creado una transcripción básica.`)

        // Actualizar el estado con la transcripción de respaldo
        setTranscription(fallbackTranscription)
        setShowTranscription(true)
        setProcessingState(null)

        // Limpiar el timeout
        clearTimeout(timeout)
        setTranscriptionTimeout(null)
        setIsTranscribing(false)
      }
    } catch (error) {
      console.error("Error en la transcripción:", error)

      // Mensaje de error más descriptivo basado en el tipo de error
      const errorMessage = `Error en la transcripción: ${error.message}`

      setError(errorMessage)

      // Limpiar el timeout si hay un error
      if (transcriptionTimeout) {
        clearTimeout(transcriptionTimeout)
        setTranscriptionTimeout(null)
      }

      retryTranscription(audioBlob)
    }
  }
  // Guardar la reunión
  const saveMeeting = async (meetingData) => {
    setIsSaving(true)
    setError(null)

    try {
      // Obtener el nombre de usuario
      const username = getUsername()
      if (!username) {
        throw new Error("No se pudo obtener el nombre de usuario")
      }

      console.log("Guardando reunión con usuario:", username)

      // Crear los datos de la reunión con formato adecuado
      const meetingDataToSave = {
        title: meetingData.title || "Reunión sin título",
        date: new Date().toISOString(),
        transcription: transcription,
        summary: analysisResults.summary,
        keyPoints: analysisResults.keyPoints,
        groupId: meetingData.groupId, // Añadir el ID del grupo
      }

      console.log("Datos a guardar:", {
        title: meetingDataToSave.title,
        groupId: meetingDataToSave.groupId,
        transcriptionLength: meetingDataToSave.transcription?.length || 0,
        summaryLength: meetingDataToSave.summary?.length || 0,
        keyPointsCount: meetingDataToSave.keyPoints?.length || 0,
      })

      // Enviar los datos al servidor
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Username": username,
        },
        body: JSON.stringify(meetingDataToSave),
      })

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get("content-type")
      let responseData

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json()
      } else {
        const text = await response.text()
        console.error("Respuesta no JSON:", text)
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}. Detalles: ${text}`)
      }

      if (!response.ok) {
        console.error("Error en la respuesta del servidor:", responseData)
        throw new Error(responseData.error || responseData.details || "Error al guardar la reunión")
      }

      console.log("Reunión guardada exitosamente:", responseData)

      setIsSaving(false)
      setSavedSuccessfully(true)

      // Redirigir al inicio después de guardar
      setTimeout(() => {
        router.push("/transcriptions")
      }, 2000)
    } catch (err) {
      console.error("Error al guardar la reunión:", err)
      setError(`Error al guardar la reunión: ${err.message}`)
      setIsSaving(false)
    }
  }
  // Analizar la transcripción
  const analyzeTranscription = async (transcriptionData) => {
    setProcessingState("analyzing")
    setProcessingProgress(0)
    setShowTranscription(false)
    setError(null)

    try {
      // Obtener el nombre de usuario
      const username = getUsername()
      if (!username) {
        throw new Error("No se pudo obtener el nombre de usuario")
      }

      // Enviar la transcripción para análisis
      const response = await fetch("/api/analyze-transcription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Username": username,
        },
        body: JSON.stringify({
          transcription: transcriptionData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al analizar la transcripción")
      }

      const analysisData = await response.json()
      console.log("Análisis completado:", analysisData)

      // Actualizar el estado con los resultados del análisis
      setAnalysisResults({
        summary: analysisData.summary || "",
        keyPoints: analysisData.keyPoints || [],
      })

      setShowAnalysis(true)
      setProcessingState("completed")
      setProcessingProgress(100)
    } catch (err) {
      console.error("Error al analizar la transcripción:", err)
      setError(`Error al analizar la transcripción: ${err.message}`)
      resetProcess()
    }
  }

  // Obtener el ID del grupo de los parámetros de la URL
  const searchParams = useSearchParams()
  const groupId = searchParams.get("groupId")

  // Modificar la función handleSaveMeeting para incluir el ID del grupo:
  const handleSaveMeeting = async (meetingData) => {
    try {
      setIsSaving(true)
      setError(null)

      // Añadir el ID del grupo si está disponible
      if (groupId) {
        meetingData.group_id = groupId
      }

      // Obtener el nombre de usuario
      const username = getUsername()
      if (!username) {
        throw new Error("No se pudo obtener el nombre de usuario")
      }

      console.log("Guardando reunión con usuario:", username)

      // Crear los datos de la reunión con formato adecuado
      const meetingDataToSave = {
        title: meetingData.title || "Reunión sin título",
        date: new Date().toISOString(),
        transcription: transcription,
        summary: analysisResults.summary,
        keyPoints: analysisResults.keyPoints,
        groupId: selectedGroup.id, // Añadir el ID del grupo
      }

      console.log("Datos a guardar:", {
        title: meetingDataToSave.title,
        groupId: meetingDataToSave.groupId,
        transcriptionLength: meetingDataToSave.transcription?.length || 0,
        summaryLength: meetingDataToSave.summary?.length || 0,
        keyPointsCount: meetingDataToSave.keyPoints?.length || 0,
      })

      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Username": username,
        },
        body: JSON.stringify(meetingDataToSave),
      })

      if (!response.ok) {
        throw new Error(`Error al guardar la reunión: ${response.status}`)
      }

      const data = await response.json()
      console.log("Reunión guardada:", data)

      // Redirigir a la página de transcripciones con el ID de la reunión
      router.push(`/transcriptions?meetingId=${data.id}`)
    } catch (error) {
      console.error("Error al guardar la reunión:", error)
      setError(error.message || "Error al guardar la reunión")
    } finally {
      setIsSaving(false)
    }
  }

  // Renderizar la interfaz
  return (
    <div className="min-h-screen bg-blue-950/40 text-white">
      <NewNavbar />
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Nueva Reunión</h1>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {savedSuccessfully && (
          <Alert className="mb-6 bg-green-900/50 border-green-800 text-white">
            <Check className="h-4 w-4" />
            <AlertTitle>Reunión guardada</AlertTitle>
            <AlertDescription>La reunión se ha guardado correctamente.</AlertDescription>
          </Alert>
        )}

        {usageLoading ? (
          <div className="text-center">
            <Loader className="h-6 w-6 animate-spin mx-auto mb-3" />
            Cargando datos de uso...
          </div>
        ) : hasReachedLimit ? (
          <Alert className="mb-6 bg-amber-900/50 border-amber-800 text-white">
            <Lock className="h-4 w-4" />
            <AlertTitle>Límite alcanzado</AlertTitle>
            <AlertDescription>
              Has alcanzado el límite de 50 transcripciones este mes. Vuelve el próximo mes para continuar.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Selector de grupo */}
            {showGroupSelector && (
              <GroupSelector onGroupSelect={handleGroupSelect} onCancel={handleGroupSelectCancel} />
            )}

            {/* Interfaz de grabación (solo se muestra después de seleccionar un grupo) */}
            {!showGroupSelector && !processingState && !showAnalysis && (
              <Tabs
                defaultValue="record-audio"
                value={recordingMode}
                onValueChange={setRecordingMode}
                className="w-full"
              >
                <TabsList className="bg-blue-800/30">
                  <TabsTrigger value="record-audio" className="data-[state=active]:bg-blue-600 text-white">
                    Grabar Audio
                  </TabsTrigger>
                  <TabsTrigger value="upload-audio" className="data-[state=active]:bg-blue-600 text-white">
                    Subir Audio
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="record-audio" className="mt-6 m-0">
                  <AudioRecorder
                    onRecordingComplete={handleRecordingComplete}
                    audioSettings={audioSettings}
                    disabled={hasReachedLimit}
                  />
                </TabsContent>
                <TabsContent value="upload-audio" className="mt-6 m-0">
                  <AudioUploader onFileSelected={handleRecordingComplete} disabled={hasReachedLimit} />
                </TabsContent>
              </Tabs>
            )}

            {/* Opciones avanzadas */}
            {!showGroupSelector && !processingState && !showAnalysis && (
              <div className="mt-6">
                <AdvancedOptions
                  settings={audioSettings}
                  onSettingsChange={setAudioSettings}
                  supportedFeatures={supportedFeatures}
                />
              </div>
            )}

            {/* Pasos de procesamiento */}
            {processingState && !showTranscription && (
              <div className="mt-6">
                <ProcessingSteps
                  currentStep={processingState}
                  progress={processingProgress}
                  transcriptionData={transcriptionData}
                />
              </div>
            )}

            {/* Vista de transcripción */}
            {showTranscription && !processingState && !showAnalysis && (
              <div className="mt-6">
                <TranscriptionView
                  transcription={transcription}
                  onAnalyze={analyzeTranscription}
                  onCancel={resetProcess}
                />
              </div>
            )}

            {/* Vista de análisis */}
            {showAnalysis && processingState === "completed" && (
              <div className="mt-6">
                <MeetingAnalysis
                  analysis={analysisResults}
                  onSave={handleSaveMeeting}
                  onCancel={resetProcess}
                  selectedGroup={selectedGroup}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
