import { createClient } from "@supabase/supabase-js"

// Configuración para el cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente singleton para el lado del cliente
let supabaseClient: ReturnType<typeof createClient> | null = null

// Función para obtener el cliente de Supabase para el lado del cliente
export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing.")
    throw new Error("Supabase configuration is missing.")
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "juntify_supabase_auth",
    },
  })

  return supabaseClient
}

// Función para obtener el cliente de Supabase para el lado del servidor
export function getServerSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase URL or Service Key is missing.")
    throw new Error("Supabase server configuration is missing.")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Función para almacenar el nombre de usuario en localStorage
export function storeUsername(username: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("juntify_username", username)
  }
}

// Función para obtener el nombre de usuario de localStorage
export function getUsername(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("juntify_username")
  }
  return null
}
