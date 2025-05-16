import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase para el lado del cliente
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "juntify_supabase_auth",
    },
  })
}

// Crear cliente de Supabase para el lado del servidor
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ""

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

// User data types
export type UserProfile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  team: string | null
  created_at: string
  updated_at: string
}

export type UserOrder = {
  id: number
  user_id: string
  order_id: string
  date: string
  status: string
  total: number
  created_at: string
}

export type UserBillingInfo = {
  id: number
  user_id: string
  name: string
  tax_id: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export type UserAddress = {
  id: number
  user_id: string
  type: string
  address: string
  created_at: string
}
