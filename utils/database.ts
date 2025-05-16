import { createClient } from "@supabase/supabase-js"

// Usar las variables de entorno de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Verificar que tenemos las credenciales necesarias
if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ Faltan credenciales de Supabase. URL:", !!supabaseUrl, "Key:", !!supabaseKey)
}

// Crear un cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey)

// Crear un cliente de Supabase con la clave de servicio para operaciones privilegiadas
export const adminSupabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

// Verificar la conexión
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error("Error al inicializar Supabase:", error)
  } else {
    console.log("Supabase inicializado correctamente")
  }
})

// Funciones de utilidad para interactuar con Supabase
export async function query(tableName: string, query: any = {}) {
  try {
    console.log(`Consultando tabla ${tableName} con:`, query)

    let queryBuilder = supabase.from(tableName).select()

    // Aplicar filtros si existen
    if (query.filter) {
      Object.entries(query.filter).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value)
      })
    }

    // Aplicar ordenamiento si existe
    if (query.orderBy) {
      queryBuilder = queryBuilder.order(query.orderBy.column, {
        ascending: query.orderBy.ascending,
      })
    }

    // Aplicar límite si existe
    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit)
    }

    const { data, error } = await queryBuilder

    if (error) {
      console.error(`Error en consulta a ${tableName}:`, error)
      throw error
    }

    console.log(`Consulta exitosa a ${tableName}, resultados:`, data?.length || 0)
    return data
  } catch (error) {
    console.error(`Error en query para ${tableName}:`, error)
    throw error
  }
}

export async function queryOne(tableName: string, filter: any = {}) {
  try {
    let queryBuilder = supabase.from(tableName).select()

    // Aplicar filtros
    Object.entries(filter).forEach(([key, value]) => {
      queryBuilder = queryBuilder.eq(key, value)
    })

    // Limitar a un solo resultado
    queryBuilder = queryBuilder.limit(1).single()

    const { data, error } = await queryBuilder

    if (error && error.code !== "PGRST116") throw error // PGRST116 es "no se encontraron resultados"
    return data
  } catch (error) {
    console.error("Database queryOne error:", error)
    throw error
  }
}

export async function insert(tableName: string, data: any) {
  try {
    console.log(`Insertando en tabla ${tableName}:`, data)

    const { data: result, error } = await supabase.from(tableName).insert(data).select()

    if (error) {
      console.error(`Error al insertar en ${tableName}:`, error)
      throw error
    }

    console.log(`Inserción exitosa en ${tableName}, resultado:`, result)
    return result
  } catch (error) {
    console.error(`Error en insert para ${tableName}:`, error)
    throw error
  }
}

export async function update(tableName: string, id: string | number, data: any) {
  try {
    const { data: result, error } = await supabase.from(tableName).update(data).eq("id", id).select()

    if (error) throw error
    return result
  } catch (error) {
    console.error("Database update error:", error)
    throw error
  }
}

export async function remove(tableName: string, id: string | number) {
  try {
    const { error } = await supabase.from(tableName).delete().eq("id", id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Database delete error:", error)
    throw error
  }
}

// Interfaces para los tipos de datos
export interface Meeting {
  id: string
  user_id: string
  title: string
  date: string
  duration?: string
  participants?: number
  summary?: string
  audio_url?: string
  created_at: string
  updated_at: string
  group_id?: string
}

export interface Transcription {
  id: string
  meeting_id: string
  time?: string
  speaker?: string
  text: string
  created_at: string
}

export interface KeyPoint {
  id: string
  meeting_id: string
  point_text: string
  order_num?: number
  created_at: string
}

export interface MeetingKeyword {
  id: string
  meeting_id: string
  keyword: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  meeting_id?: string
  text: string
  description?: string
  assignee?: string
  due_date?: string
  completed: boolean
  priority: string
  progress: number
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id?: string
  task_id?: string
  author: string
  text: string
  date: string
}
