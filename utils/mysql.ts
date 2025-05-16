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

    // Si la consulta es un SELECT, usamos .from() con .select()
    if (text.trim().toLowerCase().startsWith("select")) {
      // Extraer la tabla de la consulta SELECT
      const tableMatch = text.match(/from\s+([^\s,;]+)/i)
      if (!tableMatch || !tableMatch[1]) {
        throw new Error("No se pudo determinar la tabla en la consulta SELECT")
      }

      const tableName = tableMatch[1].replace(/['"]/g, "")

      // Convertir la consulta SQL a operaciones de Supabase
      // Nota: Esta es una implementación simplificada
      const { data, error } = await supabase.from(tableName).select("*")

      if (error) throw error
      return data || []
    }
    // Para otras operaciones, usamos rpc
    else {
      const { data, error } = await supabase.rpc("execute_sql", {
        query_text: text,
        query_params: params || [],
      })

      if (error) throw error
      return data || []
    }
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
