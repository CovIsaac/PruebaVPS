import { openai } from "@ai-sdk/openai"

// Modelos disponibles
export const MODELS = {
  GPT4: "gpt-4o",
  GPT4_MINI: "o4-mini-2025-04-16",
  GPT3: "gpt-3.5-turbo-16k",
}

// Modelo activo por defecto
export const ACTIVE_MODEL = MODELS.GPT4_MINI

// Configuración predeterminada
export const DEFAULT_CONFIG = {
  model: openai(ACTIVE_MODEL),
  temperature: 0.7,
  maxTokens: 1000,
}

// Función para verificar si la API key está configurada
export function isApiKeyConfigured() {
  return !!process.env.OPENAI_API_KEY
}

// Función para obtener la API key de forma segura
export function getApiKey() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("API Key de OpenAI no configurada")
  }
  return apiKey
}

// Función para obtener el nombre amigable del modelo
export function getModelDisplayName(modelId: string) {
  switch (modelId) {
    case MODELS.GPT4:
      return "GPT-4o"
    case MODELS.GPT4_MINI:
      return "GPT-4o Mini"
    case MODELS.GPT3:
      return "GPT-3.5 Turbo"
    default:
      return modelId
  }
}
