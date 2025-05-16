import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { ACTIVE_MODEL } from "./openai-config"

// Función para analizar la transcripción con OpenAI
export async function analyzeTranscription(transcription: any[]) {
  try {
    console.log("Iniciando análisis de transcripción con OpenAI...")

    // Preparar el texto de la transcripción para el análisis
    const transcriptionText = transcription.map((item) => `${item.speaker}: ${item.text}`).join("\n")

    // Prompt especializado en exposiciones, clases y convenciones con resumen extenso
    const prompt = `
Analiza la siguiente transcripción que probablemente corresponde a una clase escolar, exposición académica o reunión educativa. Proporciona un análisis detallado y completo BASADO EXCLUSIVAMENTE EN EL CONTENIDO PROPORCIONADO:

Transcripción:
${transcriptionText}

IMPORTANTE: Tu análisis debe estar EXCLUSIVAMENTE basado en el contenido de esta transcripción. NO inventes información ni incluyas conceptos que no estén explícitamente mencionados en el texto.

Antes de responder, evalúa la longitud y el tipo de la transcripción, considerando si parece ser:
- Una clase o exposición educativa
- Una conferencia o presentación profesional
- Una convención o mesa redonda
- Otro tipo de reunión formal

Basado en esta evaluación, ajusta tu respuesta de la siguiente manera:

1. RESUMEN EXTENSO:
   - Genera un resumen detallado que capture fielmente el contenido de la transcripción.
   - Si la transcripción es corta o contiene poca información, tu resumen debe ser proporcionalmente breve y NO debe inventar contenido.
   - El resumen debe reflejar:
     * Conceptos principales que se mencionan explícitamente
     * Metodologías o técnicas que se describen en la transcripción
     * Ejemplos o casos de estudio mencionados
     * Preguntas importantes y sus respuestas que aparecen en el texto
   
2. PUNTOS CLAVE ACADÉMICOS:
   - Identifica puntos clave ESPECÍFICOS Y CONCRETOS que aparecen explícitamente en la transcripción
   - Cada punto clave debe:
     * Contener información ESPECÍFICA y DETALLADA, no generalidades
     * Incluir ejemplos concretos, definiciones, fórmulas, fechas o datos mencionados
     * Ser relevante para el contexto educativo (conceptos, teorías, metodologías)
     * Estar expresado de forma clara y concisa
     * Incluir, cuando sea posible, la terminología exacta utilizada en la transcripción

   Ejemplos de puntos clave ESPECÍFICOS (usa este formato):
   - "La fotosíntesis se define como el proceso por el cual las plantas convierten luz solar en energía química, utilizando dióxido de carbono y agua para producir glucosa y oxígeno"
   - "El teorema de Pitágoras establece que en un triángulo rectángulo, el cuadrado de la hipotenusa es igual a la suma de los cuadrados de los catetos (a² + b² = c²)"
   - "La Revolución Francesa comenzó en 1789 con la toma de la Bastilla y culminó con el ascenso de Napoleón Bonaparte al poder en 1799"

   Evita puntos clave VAGOS como:
   - "Se discutieron temas importantes sobre matemáticas"
   - "El profesor explicó varios conceptos"
   - "Los estudiantes aprendieron sobre historia"

Es IMPORTANTE que respondas SOLO con un objeto JSON válido con la siguiente estructura y sin más texto adicional:
{
  "summary": "Resumen basado exclusivamente en el contenido de la transcripción",
  "keyPoints": ["Punto clave específico 1 extraído de la transcripción", "Punto clave específico 2 extraído de la transcripción", ...],
  "metadata": {"sessionType": "clase/exposición/conferencia/convención", "wordCount": número_aproximado_de_palabras, "mainTopics": ["Tema principal 1 mencionado", "Tema principal 2 mencionado"]}
}
`

    console.log("Enviando solicitud a OpenAI...")

    // Usar el AI SDK para generar el análisis
    const { text } = await generateText({
      model: openai(ACTIVE_MODEL),
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente académico especializado en analizar y sintetizar clases escolares, exposiciones educativas y conferencias profesionales. Tu objetivo es proporcionar resúmenes precisos y puntos clave ESPECÍFICOS basados EXCLUSIVAMENTE en el contenido proporcionado. Debes extraer información CONCRETA y DETALLADA, no generalidades. NO debes inventar información ni incluir conceptos que no estén explícitamente mencionados en el texto. Debes responder ÚNICAMENTE con un objeto JSON válido sin ningún texto adicional ni marcadores de código.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2, // Reducido para obtener respuestas más precisas
      maxTokens: 2500,
    })

    console.log("Respuesta recibida de OpenAI, procesando...")

    // Limpiar la respuesta de cualquier marcador de código Markdown
    const content = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim()

    console.log("Respuesta de OpenAI (limpia):", content.substring(0, 100) + "...")

    // Parsear la respuesta JSON
    try {
      const analysisResult = JSON.parse(content)
      console.log("Análisis completado exitosamente")
      return analysisResult
    } catch (parseError) {
      console.error("Error al parsear la respuesta de OpenAI:", parseError)
      console.error("Contenido que causó el error:", content.substring(0, 200) + "...")

      // Intentar extraer manualmente si el formato no es JSON perfecto
      return {
        summary: extractSummary(content),
        keyPoints: extractKeyPoints(content),
        tasks: extractTasks(content),
        metadata: {
          sessionType: "desconocido",
          wordCount: 0,
          mainTopics: [],
        },
      }
    }
  } catch (error) {
    console.error("Error al analizar la transcripción:", error)
    throw error
  }
}

// Función auxiliar para extraer el resumen
function extractSummary(content: string) {
  try {
    const summaryMatch = content.match(/"summary"\s*:\s*"(.*?)"/s)
    return summaryMatch ? summaryMatch[1] : "No se pudo generar un resumen."
  } catch (e) {
    return "No se pudo generar un resumen."
  }
}

// Funciones auxiliares para extraer datos si el JSON no es válido
function extractKeyPoints(content: string) {
  try {
    const keyPointsMatch = content.match(/"keyPoints"\s*:\s*\[(.*?)\]/s)
    if (keyPointsMatch && keyPointsMatch[1]) {
      return keyPointsMatch[1]
        .split(",")
        .map((point) => point.trim().replace(/^"/, "").replace(/"$/, ""))
        .filter((point) => point.length > 0)
    }
    return ["No se pudieron identificar puntos clave específicos."]
  } catch (e) {
    return ["No se pudieron identificar puntos clave específicos."]
  }
}

function extractTasks(content: string) {
  // Devolvemos un array vacío ya que hemos eliminado las tareas del análisis
  return []
}
