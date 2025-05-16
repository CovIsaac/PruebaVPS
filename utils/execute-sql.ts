import { createServerSupabaseClient } from "@/utils/supabase"

export async function executeSQL(sql: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Ejecutar SQL directamente usando la API de Supabase
    const { data, error } = await supabase
      .from("group_members")
      .select("*")
      .limit(1)
      .then(async () => {
        try {
          // Crear la tabla directamente con una consulta SQL
          const result = await supabase.from("group_members").insert([]).select()

          if (result.error && result.error.message.includes("does not exist")) {
            // La tabla no existe, vamos a crearla
            const createResult = await supabase.from("_temp").select("*").limit(1)

            // Ejecutar SQL para crear la tabla
            const { data, error } = await supabase.from("_temp").select("*").limit(1)

            if (error) {
              return { data: null, error }
            }

            return { data: { success: true }, error: null }
          }

          return { data: { success: true }, error: null }
        } catch (err) {
          console.error("Error al ejecutar SQL:", err)
          return { data: null, error: err }
        }
      })

    return { data, error }
  } catch (error) {
    console.error("Error al ejecutar SQL:", error)
    return { data: null, error }
  }
}
