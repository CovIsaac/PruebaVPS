import { NextResponse } from "next/server"
import { checkOpenAIConfig } from "@/utils/openai-check"

export async function GET(request: Request) {
  try {
    // Verificar la configuración de OpenAI
    const result = await checkOpenAIConfig()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al verificar la configuración de OpenAI:", error)
    return NextResponse.json(
      {
        isConfigured: false,
        error: error instanceof Error ? error.message : "Error desconocido al verificar la configuración",
      },
      { status: 500 },
    )
  }
}
