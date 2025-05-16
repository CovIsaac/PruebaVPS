const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY || "b19443a8815e400984560f1a8f1e914f"

/**
 * Sube un archivo de audio a AssemblyAI
 * @param audioFile Blob del archivo de audio
 * @returns URL del archivo subido
 */
export async function uploadAudioToAssemblyAI(audioFile: Blob): Promise<string> {
  try {
    console.log("Subiendo archivo de audio a AssemblyAI...")

    const response = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        Authorization: ASSEMBLY_API_KEY,
      },
      body: audioFile,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error al subir el archivo: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("Archivo subido correctamente:", result.upload_url)

    return result.upload_url
  } catch (error) {
    console.error("Error al subir el archivo a AssemblyAI:", error)
    throw error
  }
}

/**
 * Inicia una transcripción en AssemblyAI
 * @param audioUrl URL del audio subido
 * @param settings Configuración de la transcripción
 * @returns ID de la transcripción
 */
export async function startTranscription(audioUrl: string, settings: any): Promise<string> {
  try {
    console.log("Iniciando transcripción en AssemblyAI...")

    // Configurar opciones de transcripción
    const transcriptionOptions: any = {
      audio_url: audioUrl,
      speaker_labels: true, // Activar la detección de hablantes
      punctuate: true,
      format_text: true,
      dual_channel: false,
      webhook_url: null,
    }

    // Añadir idioma si está especificado
    if (settings.language && settings.language !== "auto") {
      transcriptionOptions.language_code = settings.language

      // Auto chapters solo está disponible para inglés
      if (settings.language === "en") {
        transcriptionOptions.auto_chapters = true
      }
    } else {
      // Si no se especifica idioma, asumimos inglés por defecto para AssemblyAI
      transcriptionOptions.language_code = "en"
      transcriptionOptions.auto_chapters = true
    }

    console.log("Opciones de transcripción:", JSON.stringify(transcriptionOptions))

    const response = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        Authorization: ASSEMBLY_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transcriptionOptions),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Error de AssemblyAI:", errorData)
      throw new Error(
        `Error al iniciar la transcripción: ${response.status}${errorData.error ? ` - ${errorData.error}` : ""}`,
      )
    }

    const result = await response.json()
    console.log("Transcripción iniciada con ID:", result.id)

    return result.id
  } catch (error) {
    console.error("Error al iniciar la transcripción en AssemblyAI:", error)
    throw error
  }
}

/**
 * Obtiene el estado de una transcripción
 * @param transcriptId ID de la transcripción
 * @returns Estado y datos de la transcripción
 */
export async function getTranscriptionStatus(transcriptId: string): Promise<any> {
  try {
    const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: {
        Authorization: ASSEMBLY_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`Error al verificar el estado de la transcripción: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error al obtener el estado de la transcripción:", error)
    throw error
  }
}

/**
 * Espera a que una transcripción se complete
 * @param transcriptId ID de la transcripción
 * @param onProgress Callback para actualizar el progreso
 * @returns Datos de la transcripción completa
 */
export async function waitForTranscriptionCompletion(
  transcriptId: string,
  onProgress?: (progress: number) => void,
): Promise<any> {
  let status = "processing"
  let transcriptData
  let pollingCount = 0
  let lastProgress = 0
  const maxPolls = 120 // Aumentado a 120 intentos (4 minutos con 2 segundos entre cada intento)
  const pollingInterval = 2000 // 2 segundos entre cada consulta

  console.log(`Esperando la finalización de la transcripción ${transcriptId}...`)

  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        transcriptData = await getTranscriptionStatus(transcriptId)
        status = transcriptData.status

        console.log(`Intento ${pollingCount + 1}: Estado de transcripción: ${status}`)

        if (transcriptData.error) {
          console.error(`Error reportado por AssemblyAI: ${transcriptData.error}`)
          clearInterval(intervalId)
          reject(new Error(`Error en la transcripción: ${transcriptData.error}`))
          return
        }

        // Actualizar progreso
        pollingCount++

        // Calcular progreso basado en el estado
        let progress = 0
        if (status === "queued") {
          progress = Math.min(10, pollingCount * 2)
        } else if (status === "processing") {
          // Incremento gradual hasta 95%
          progress = Math.min(95, 10 + (pollingCount * 85) / maxPolls)
        } else if (status === "completed") {
          progress = 100
        }

        // Asegurar que el progreso siempre avance
        progress = Math.max(progress, lastProgress + 1)
        lastProgress = progress

        if (onProgress) {
          onProgress(Math.min(progress, 95)) // Máximo 95% hasta que realmente se complete
        }

        // Verificar si la transcripción está completa o ha fallado
        if (status === "completed") {
          clearInterval(intervalId)
          console.log("Transcripción completada con éxito")
          if (onProgress) onProgress(100)
          resolve(transcriptData)
        } else if (status === "error") {
          clearInterval(intervalId)
          reject(new Error(`Error en la transcripción: ${transcriptData.error || "Error desconocido"}`))
        } else if (pollingCount >= maxPolls) {
          clearInterval(intervalId)
          reject(new Error(`Tiempo de espera agotado después de ${maxPolls} intentos. Estado final: ${status}`))
        }
      } catch (error) {
        console.error(`Error al verificar el estado de la transcripción (intento ${pollingCount + 1}):`, error)

        // Si es el último intento, lanzar el error
        if (pollingCount >= maxPolls - 1) {
          clearInterval(intervalId)
          reject(error)
        }
      }
    }

    // Iniciar el intervalo de polling
    const intervalId = setInterval(checkStatus, pollingInterval)

    // Ejecutar la primera verificación inmediatamente
    checkStatus()
  })
}

/**
 * Formatea los resultados de la transcripción para la aplicación
 * @param transcriptData Datos de la transcripción de AssemblyAI
 * @returns Transcripción formateada para la aplicación
 */
export function formatTranscriptionResults(transcriptData: any): any[] {
  console.log("Formateando resultados de transcripción:", transcriptData)

  const formattedTranscription = []

  // Verificar si tenemos utterances (transcripción con múltiples hablantes)
  if (transcriptData.utterances && transcriptData.utterances.length > 0) {
    console.log(`Procesando ${transcriptData.utterances.length} utterances con identificación de hablantes`)

    // Crear un mapa para nombres de hablantes más descriptivos
    const speakerMap = {}

    // Primera pasada: identificar hablantes únicos
    transcriptData.utterances.forEach((utterance: any) => {
      if (!speakerMap[utterance.speaker]) {
        speakerMap[utterance.speaker] = `Speaker ${utterance.speaker}`
      }
    })

    console.log("Hablantes detectados:", Object.keys(speakerMap).length)

    // Segunda pasada: formatear la transcripción con los nombres de hablantes
    transcriptData.utterances.forEach((utterance: any) => {
      const startTime = Math.floor(utterance.start / 1000) // Convertir a segundos
      const minutes = Math.floor(startTime / 60)
      const seconds = startTime % 60
      const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

      formattedTranscription.push({
        time: timeFormatted,
        speaker: speakerMap[utterance.speaker],
        text: utterance.text,
        confidence: utterance.confidence || 0.0, // Añadir nivel de confianza si está disponible
      })
    })

    // Aplicar post-procesamiento para mejorar la consistencia de los hablantes
    return postProcessSpeakers(formattedTranscription)
  }
  // Si no hay utterances pero hay words con timestamps
  else if (transcriptData.words && transcriptData.words.length > 0) {
    console.log(`No hay utterances, procesando ${transcriptData.words.length} palabras con timestamps`)

    // Agrupar palabras en segmentos de aproximadamente 30 segundos
    const segmentDuration = 30 // segundos
    let currentSegment = []
    let currentSegmentStart = transcriptData.words[0].start

    transcriptData.words.forEach((word: any, index: number) => {
      currentSegment.push(word.text)

      const wordTimeInSeconds = word.end / 1000
      const segmentStartInSeconds = currentSegmentStart / 1000

      // Si es la última palabra o hemos alcanzado la duración del segmento
      if (index === transcriptData.words.length - 1 || wordTimeInSeconds - segmentStartInSeconds >= segmentDuration) {
        const startTime = Math.floor(segmentStartInSeconds)
        const minutes = Math.floor(startTime / 60)
        const seconds = startTime % 60
        const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

        formattedTranscription.push({
          time: timeFormatted,
          speaker: "Speaker 1", // Sin identificación de hablantes
          text: currentSegment.join(" "),
          confidence: 1.0,
        })

        // Reiniciar para el siguiente segmento
        currentSegment = []
        if (index < transcriptData.words.length - 1) {
          currentSegmentStart = transcriptData.words[index + 1].start
        }
      }
    })
  }
  // Si solo tenemos el texto completo sin timestamps
  else if (transcriptData.text) {
    console.log("No hay utterances ni words con timestamps, usando texto completo")

    // Dividir el texto en párrafos o frases
    const sentences = transcriptData.text.split(/(?<=[.!?])\s+/)

    // Crear segmentos de aproximadamente 1-3 frases
    for (let i = 0; i < sentences.length; i += 2) {
      const segmentText = sentences.slice(i, i + 2).join(" ")

      formattedTranscription.push({
        time: `00:${(i * 30).toString().padStart(2, "0")}`, // Tiempo estimado
        speaker: "Speaker 1",
        text: segmentText,
        confidence: 1.0,
      })
    }
  }

  console.log(`Transcripción formateada con ${formattedTranscription.length} segmentos`)
  return formattedTranscription
}

// Función para post-procesar y mejorar la consistencia de los hablantes
function postProcessSpeakers(transcription: any[]): any[] {
  if (!transcription || transcription.length === 0) return transcription

  console.log("Aplicando post-procesamiento para mejorar la consistencia de hablantes")

  // Crear una copia de la transcripción
  const processed = [...transcription]

  // Agrupar segmentos consecutivos del mismo hablante
  let currentSpeaker = null
  let currentGroup = []
  const groups = []

  processed.forEach((segment) => {
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
      prevGroup.segments.length > 2 &&
      nextGroup.segments.length > 2
    ) {
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

  console.log(`Post-procesamiento completado: ${groups.length} grupos de hablantes`)
  return correctedTranscription
}

/**
 * Proceso completo de transcripción con AssemblyAI
 * @param audioFile Blob del archivo de audio
 * @param settings Configuración de la transcripción
 * @param onProgress Callback para actualizar el progreso
 * @returns Transcripción formateada
 */
export async function transcribeWithAssemblyAI(
  audioFile: Blob,
  settings: any,
  onProgress?: (progress: number, stage: string) => void,
): Promise<any[]> {
  try {
    console.log("Iniciando transcripción con AssemblyAI...")
    console.log("Tamaño del archivo:", audioFile.size, "bytes")
    console.log("Configuración:", settings)

    // Verificar que el archivo de audio sea válido
    if (!audioFile || audioFile.size === 0) {
      throw new Error("El archivo de audio está vacío o no es válido")
    }

    // Actualizar progreso: Subiendo archivo
    if (onProgress) onProgress(0, "uploading")
    console.log("Subiendo archivo de audio a AssemblyAI...")

    // 1. Subir el archivo de audio
    const audioUrl = await uploadAudioToAssemblyAI(audioFile)
    console.log("Archivo subido correctamente. URL:", audioUrl)

    // Actualizar progreso: Iniciando transcripción
    if (onProgress) onProgress(10, "processing")
    console.log("Iniciando proceso de transcripción...")

    // 2. Iniciar la transcripción
    const transcriptId = await startTranscription(audioUrl, settings)
    console.log("Transcripción iniciada con ID:", transcriptId)

    // Actualizar progreso: Transcribiendo
    if (onProgress) onProgress(20, "transcribing")
    console.log("Esperando resultados de transcripción...")

    // 3. Esperar a que la transcripción se complete
    const transcriptData = await waitForTranscriptionCompletion(transcriptId, (progress) => {
      if (onProgress) {
        // Mapear el progreso de 0-100 a 20-90 (reservando 0-20 para la subida y 90-100 para el formateo)
        const mappedProgress = 20 + progress * 0.7
        onProgress(mappedProgress, "transcribing")
        console.log(`Progreso de transcripción: ${progress}%`)
      }
    })

    console.log("Transcripción completada:", transcriptData.status)
    console.log("Datos de transcripción recibidos:", transcriptData)

    // Actualizar progreso: Formateando resultados
    if (onProgress) onProgress(90, "formatting")
    console.log("Formateando resultados de transcripción...")

    // 4. Formatear los resultados
    const formattedTranscription = formatTranscriptionResults(transcriptData)
    console.log("Transcripción formateada:", formattedTranscription)

    // Verificar que la transcripción tenga contenido
    if (!formattedTranscription || formattedTranscription.length === 0) {
      console.warn("La transcripción formateada está vacía")

      // Si no hay utterances pero hay texto, crear una transcripción básica
      if (transcriptData.text && !transcriptData.utterances) {
        console.log("Creando transcripción básica a partir del texto completo")
        return [
          {
            time: "00:00",
            speaker: "Speaker 1",
            text: transcriptData.text,
          },
        ]
      }
    }

    // Transcripción completa
    if (onProgress) onProgress(100, "completed")
    console.log("Proceso de transcripción completado con éxito")

    return formattedTranscription
  } catch (error) {
    console.error("Error en el proceso de transcripción con AssemblyAI:", error)
    throw error
  }
}

// Función para crear una transcripción de respaldo en caso de error
export function createFallbackTranscription(audioLength: number, errorMessage: string): any[] {
  console.log("Creando transcripción de respaldo debido a un error")

  return [
    {
      time: "00:00",
      speaker: "Speaker 1",
      text: `No se pudo generar la transcripción automática. Error: ${errorMessage}. Por favor, intente nuevamente o utilice un archivo de audio diferente.`,
    },
  ]
}

// Exportar todas las funciones
export const assemblyAIService = {
  uploadAudioToAssemblyAI,
  startTranscription,
  getTranscriptionStatus,
  waitForTranscriptionCompletion,
  formatTranscriptionResults,
  transcribeWithAssemblyAI,
  createFallbackTranscription,
}
