import { createServerSupabaseClient } from "@/utils/supabase"

/**
 * Ejecuta una consulta SQL en la base de datos
 * @param text Consulta SQL a ejecutar
 * @param params Parámetros para la consulta SQL
 * @returns Resultado de la consulta
 */
export async function query(text: string, params?: any[]): Promise<any> {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.rpc("execute_sql", {
      query_text: text,
      query_params: params || [],
    })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error executing query:", error)
    throw error
  }
}

/**
 * Ejecuta una consulta SQL y devuelve un solo resultado
 * @param text Consulta SQL a ejecutar
 * @param params Parámetros para la consulta SQL
 * @returns Un solo resultado de la consulta
 */
export async function queryOne(text: string, params?: any[]): Promise<any> {
  const results = await query(text, params)
  return results && results.length > 0 ? results[0] : null
}

/**
 * Obtiene una conexión a la base de datos
 * @returns Cliente de Supabase
 */
export function getConnection() {
  return createServerSupabaseClient()
}
