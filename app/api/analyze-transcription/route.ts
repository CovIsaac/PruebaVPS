import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { query } from "@/utils/mysql"
import type { NextRequest } from "next/server"
import { ACTIVE_MODEL } from "@/utils/openai-config"

export async function POST(request: NextRequest) {
  try {
    console.log("Recibida solicitud para analizar transcripción")

    // Obtener el nombre de usuario del encabezado
    const username = request.headers.get("X-Username")
    if (!username) {
      console.error("Error: No se proporcionó nombre de usuario")
      return NextResponse.json({ error: "Se requiere autenticación" }, { status: 401 })
    }

    // Check if the user has reached their monthly limit
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const usageRecords = await query(
      `SELECT COUNT(*) as count FROM meetings 
       WHERE username = ? 
       AND MONTH(created_at) = ? 
       AND YEAR(created_at) = ?`,
      [username, currentMonth, currentYear],
    )

    const used = usageRecords[0]?.count || 0
    const limit = 50
    const remaining = Math.max(0, limit - used)

    // If the user has reached their limit, return an error
    if (remaining <= 0) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${limit} transcripciones este mes`,
          usage: { used, limit, remaining },
        },
        { status: 403 },
      )
    }

    // Obtener los datos de la solicitud
    const body = await request.json()
    const { meetingId, transcription } = body

    // Validar que hay una transcripción
    if (!transcription || !Array.isArray(transcription) || transcription.length === 0) {
      console.error("Error: Transcripción inválida o vacía")
      return NextResponse.json({ error: "Se requiere una transcripción válida" }, { status: 400 })
    }

    console.log(`Analizando transcripción con ${transcription.length} segmentos para meetingId: ${meetingId}`)

    // Format the transcription for the AI
    const formattedTranscription = transcription
      .map((item) => `${item.speaker || "Speaker"} (${item.time || "00:00"}): ${item.text}`)
      .join("\n")

    // Generate a prompt for the AI
    const prompt = `
Analiza detalladamente la siguiente transcripción que probablemente corresponde a una clase escolar, exposición académica o reunión educativa:

Transcripción:
${formattedTranscription}

IMPORTANTE: Tu análisis debe estar EXCLUSIVAMENTE basado en el contenido de esta transcripción. NO inventes información ni incluyas conceptos que no estén explícitamente mencionados en el texto.

Proporciona:

1. Un resumen detallado (300-500 palabras) que capture fielmente los temas principales discutidos, siguiendo la estructura y el flujo de la conversación original.

2. Una lista de 5-10 puntos clave ESPECÍFICOS Y CONCRETOS extraídos directamente de la transcripción. Cada punto clave debe:
   - Contener información ESPECÍFICA y DETALLADA, no generalidades
   - Incluir ejemplos concretos, definiciones, fórmulas, fechas o datos mencionados
   - Ser relevante para el contexto educativo (conceptos, teorías, metodologías)
   - Estar expresado de forma clara y concisa
   - Incluir, cuando sea posible, la terminología exacta utilizada en la transcripción

Ejemplos de puntos clave ESPECÍFICOS (usa este formato):
- "La fotosíntesis se define como el proceso por el cual las plantas convierten luz solar en energía química, utilizando dióxido de carbono y agua para producir glucosa y oxígeno"
- "El teorema de Pitágoras establece que en un triángulo rectángulo, el cuadrado de la hipotenusa es igual a la suma de los cuadrados de los catetos (a² + b² = c²)"
- "La Revolución Francesa comenzó en 1789 con la toma de la Bastilla y culminó con el ascenso de Napoleón Bonaparte al poder en 1799"

Evita puntos clave VAGOS como:
- "Se discutieron temas importantes sobre matemáticas"
- "El profesor explicó varios conceptos"
- "Los estudiantes aprendieron sobre historia"

Si la transcripción es muy corta, poco clara o no contiene suficiente información, indica esto en tu análisis en lugar de inventar contenido.

Es IMPORTANTE que respondas SOLO con un objeto JSON válido con la siguiente estructura y sin más texto adicional:
{
  "summary": "Resumen detallado basado ÚNICAMENTE en el contenido de la transcripción",
  "keyPoints": ["Punto clave específico 1 extraído de la transcripción", "Punto clave específico 2 extraído de la transcripción", ...]
}
`

    try {
      console.log("Enviando solicitud a OpenAI para análisis...")

      // Call the AI to analyze the transcription
      const { text } = await generateText({
        model: openai(ACTIVE_MODEL),
        prompt,
        temperature: 0.2, // Reducido para obtener respuestas más precisas y específicas
        maxTokens: 2000,
      })

      console.log("Respuesta recibida de OpenAI, procesando...")

      // Parse the AI response
      let analysisResult
      try {
        // We need to handle the case where the AI might not return a valid JSON
        // First, try to extract just the JSON part if there's additional text
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const jsonText = jsonMatch ? jsonMatch[0] : text

        console.log("Intentando parsear JSON:", jsonText.substring(0, 100) + "...")

        analysisResult = JSON.parse(jsonText)

        // Ensure the result has the expected structure
        if (!analysisResult.summary) {
          console.warn("No se encontró un resumen en la respuesta, usando valor por defecto")
          analysisResult.summary = "No se pudo generar un resumen."
        }

        if (!analysisResult.keyPoints || !Array.isArray(analysisResult.keyPoints)) {
          console.warn("No se encontraron puntos clave en la respuesta, usando valor por defecto")
          analysisResult.keyPoints = ["No se pudieron identificar puntos clave específicos."]
        }

        // No procesamos tareas ya que se han eliminado del análisis
        analysisResult.tasks = []

        console.log("Análisis completado exitosamente")

        // Si hay un meetingId, guardar el análisis en la base de datos
        if (meetingId) {
          try {
            console.log(`Guardando análisis para meetingId: ${meetingId}`)

            // Guardar el resumen
            await query(`UPDATE meetings SET summary = ? WHERE id = ? AND username = ?`, [
              analysisResult.summary,
              meetingId,
              username,
            ])

            // Eliminar puntos clave anteriores si existen
            await query(`DELETE FROM key_points WHERE meeting_id = ?`, [meetingId])

            // Insertar nuevos puntos clave
            if (analysisResult.keyPoints && analysisResult.keyPoints.length > 0) {
              for (let i = 0; i < analysisResult.keyPoints.length; i++) {
                await query(`INSERT INTO key_points (meeting_id, point_text, order_num) VALUES (?, ?, ?)`, [
                  meetingId,
                  analysisResult.keyPoints[i],
                  i + 1,
                ])
              }
            }

            console.log(`Análisis guardado correctamente para meetingId: ${meetingId}`)
          } catch (dbError) {
            console.error(`Error al guardar el análisis en la base de datos:`, dbError)
            // No fallamos la solicitud si hay un error al guardar, solo lo registramos
          }
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError)
        console.error("Texto que causó el error:", text.substring(0, 200) + "...")

        // Provide a fallback analysis result
        analysisResult = {
          summary:
            "No se pudo analizar la transcripción correctamente. El sistema encontró un error al procesar la respuesta del modelo de IA.",
          keyPoints: ["Se encontró un error al procesar la transcripción."],
          tasks: [],
        }
      }

      // Return the analysis result with usage information
      return NextResponse.json({
        ...analysisResult,
        usage: {
          used,
          limit,
          remaining: remaining - 1, // Decrease by one since we're using one now
        },
      })
    } catch (aiError) {
      console.error("AI Error:", aiError)
      return NextResponse.json(
        {
          error: "Error en el procesamiento de la inteligencia artificial",
          details: aiError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error al analizar la transcripción:", error)
    return NextResponse.json(
      {
        error: "Error al analizar la transcripción",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
