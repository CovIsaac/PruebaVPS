"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, Play, Pause, Square, Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useMobile } from "@/hooks/use-mobile"

interface SimpleAudioRecorderProps {
  onAudioRecorded: (audioData: {
    id: string
    url: string
    blob: Blob
    duration: number
    size: number
  }) => void
  disabled?: boolean
  meetingId?: string | null
}

export function SimpleAudioRecorder({ onAudioRecorded, disabled = false, meetingId = null }: SimpleAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [audioData, setAudioData] = useState<number[]>([])
  const isMobile = useMobile()
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<{ analyser: AnalyserNode; dataArray: Uint8Array; bufferLength: number } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Función para inicializar el analizador de audio
  const setupAudioAnalyser = (stream: MediaStream) => {
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

    // Iniciar la visualización inmediatamente
    visualize()
  }

  // Función para dibujar el espectrograma
  const visualize = () => {
    if (!canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext("2d")
    if (!canvasCtx) return

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
    }

    drawVisual()
  }

  // Iniciar la grabación de audio
  const startRecording = async () => {
    try {
      setError(null)

      // Obtener acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Configurar el analizador de audio para visualización en tiempo real
      setupAudioAnalyser(stream)

      // Configurar el MediaRecorder
      const mimeType = "audio/webm;codecs=opus"
      let mediaRecorder: MediaRecorder

      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType })
      } catch (e) {
        console.warn("El formato audio/webm no es compatible, intentando con formato alternativo", e)
        mediaRecorder = new MediaRecorder(stream)
      }

      mediaRecorderRef.current = mediaRecorder

      // Manejar los datos grabados
      audioChunksRef.current = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      // Cuando la grabación se detiene
      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          setError("No se capturaron datos de audio. Intenta grabar de nuevo.")
          return
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })

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
      setError(`Error al acceder al micrófono: ${err instanceof Error ? err.message : "Desconocido"}`)
    }
  }

  // Guardar el audio localmente
  const saveAudioLocally = async (blob: Blob) => {
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
            onAudioRecorded({
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
      setError(`Error al guardar el audio: ${err instanceof Error ? err.message : "Desconocido"}`)
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
        clearInterval(timerRef.current!)
        setIsRecording(false)
        setIsPaused(false)

        // Detener la visualización
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }

        // Detener y liberar el stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
        }

        console.log("Grabación detenida, chunks:", audioChunksRef.current.length)
      } catch (err) {
        console.error("Error al detener la grabación:", err)
        setError(`Error al detener la grabación: ${err instanceof Error ? err.message : "Desconocido"}`)
      }
    }
  }

  // Pausar la grabación
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.pause()
        clearInterval(timerRef.current!)
        setIsPaused(true)

        // Pausar la visualización
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
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

  // Descartar grabación
  const discardRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop()
        clearInterval(timerRef.current!)
        setIsRecording(false)
        setIsPaused(false)

        // Detener la visualización
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }

        // Detener y liberar el stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
        }

        // Limpiar los chunks de audio
        audioChunksRef.current = []
        setRecordingTime(0)
      } catch (err) {
        console.error("Error al descartar la grabación:", err)
        setError(`Error al descartar la grabación: ${err instanceof Error ? err.message : "Desconocido"}`)
      }
    } else {
      // Si no estamos grabando, simplemente resetear el estado
      setRecordingTime(0)
      audioChunksRef.current = []
    }
  }

  // Formatear el tiempo de grabación
  const formatTime = (seconds: number) => {
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
        audioContextRef.current.close().catch(console.error)
      }
    }
  }, [])

  // Inicializar el canvas con un fondo vacío cuando se monta el componente
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "rgb(20, 30, 60)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [])

  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const handleStopRecording = async () => {
    try {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
        console.warn("No hay grabación activa para detener")
        return
      }

      console.log("Deteniendo grabación...")

      // Detener la grabación
      mediaRecorderRef.current.stop()

      // Esperar a que se procesen todos los datos
      await new Promise<void>((resolve) => {
        const onDataAvailable = (e: BlobEvent) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data)
          }
          mediaRecorderRef.current?.removeEventListener("dataavailable", onDataAvailable)
          resolve()
        }

        // Si no hay datos pendientes, solicitar datos antes de detener
        if (audioChunksRef.current.length === 0) {
          mediaRecorderRef.current.addEventListener("dataavailable", onDataAvailable)
          mediaRecorderRef.current.requestData()
        } else {
          resolve()
        }
      })

      // Verificar que tenemos chunks de audio
      if (audioChunksRef.current.length === 0) {
        console.error("No se capturaron datos de audio")
        setError("No se capturaron datos de audio. Intenta grabar de nuevo.")
        setIsRecording(false)
        return
      }

      // Crear el blob de audio
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
      console.log(`Blob de audio creado: ${audioBlob.size} bytes`)

      // Verificar que el blob tiene contenido
      if (audioBlob.size === 0) {
        console.error("El blob de audio está vacío")
        setError("El archivo de audio está vacío. Intenta grabar de nuevo.")
        setIsRecording(false)
        return
      }

      // Detener la visualización y liberar recursos
      stopVisualization()

      // Detener y liberar el stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Actualizar estado
      setIsRecording(false)
      setAudioBlob(audioBlob)

      // Notificar que la grabación está lista
      onAudioRecorded({
        id: `audio_${Date.now()}`,
        blob: audioBlob,
        duration: recordingTime,
        url: URL.createObjectURL(audioBlob),
        size: audioBlob.size,
      })

      console.log("Grabación completada con éxito")
    } catch (error) {
      console.error("Error al detener la grabación:", error)
      setError(`Error al detener la grabación: ${error.message}`)
      setIsRecording(false)
    }
  }

  // Detener la grabación
  // const stopRecording = () => {
  //   if (mediaRecorderRef.current && isRecording) {
  //     try {
  //       // Asegurarse de que hay datos para grabar
  //       if (audioChunksRef.current.length === 0) {
  //         // Forzar la obtención de los datos actuales antes de detener
  //         mediaRecorderRef.current.requestData()
  //       }

  //       // Detener la grabación
  //       mediaRecorderRef.current.stop()
  //       clearInterval(timerRef.current!)
  //       setIsRecording(false)
  //       setIsPaused(false)

  //       // Detener la visualización
  //       if (animationFrameRef.current) {
  //         cancelAnimationFrame(animationFrameRef.current)
  //         animationFrameRef.current = null
  //       }

  //       // Detener y liberar el stream
  //       if (streamRef.current) {
  //         streamRef.current.getTracks().forEach((track) => track.stop())
  //       }

  //       console.log("Grabación detenida, chunks:", audioChunksRef.current.length)
  //     } catch (err) {
  //       console.error("Error al detener la grabación:", err)
  //       setError(`Error al detener la grabación: ${err instanceof Error ? err.message : "Desconocido"}`)
  //     }
  //   }
  // }

  return (
    <Card className="w-full bg-blue-800/30 border border-blue-700/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-white">Grabador de audio</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-900/50 border-red-800 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center">
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
        <div className="w-full">
          <canvas ref={canvasRef} width="600" height="100" className="w-full h-16 sm:h-24 rounded-lg bg-blue-900/50" />
        </div>
      </CardContent>

      <CardFooter className="flex justify-center gap-3 flex-wrap">
        {!isRecording ? (
          <Button
            className={`${
              disabled ? "bg-gray-600 hover:bg-gray-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
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
                className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-800/30"
                onClick={pauseRecording}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-blue-600/50 text-blue-400 hover:bg-blue-800/30"
                onClick={resumeRecording}
              >
                <Play className="h-4 w-4 mr-2" />
                Continuar
              </Button>
            )}

            <Button
              variant="outline"
              className="border-red-600/50 text-red-400 hover:bg-red-800/30"
              onClick={handleStopRecording}
            >
              <Square className="h-4 w-4 mr-2" />
              Detener
            </Button>

            <Button
              variant="outline"
              className="border-red-600/50 text-red-400 hover:bg-red-800/30"
              onClick={discardRecording}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Descartar
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
