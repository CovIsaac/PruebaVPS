import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar si la tabla group_members existe
    const { error: checkError } = await supabase.from("group_members").select("*").limit(1)

    // Si la tabla no existe, la creamos
    if (checkError && checkError.message.includes("does not exist")) {
      // SQL para crear la tabla group_members
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS group_members (
          id SERIAL PRIMARY KEY,
          group_id UUID NOT NULL,
          user_id UUID NOT NULL,
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(group_id, user_id)
        );
      `

      // Ejecutar SQL directamente usando la API de Supabase
      const { error: createError } = await supabase.rpc("execute_sql", { sql_query: createTableSQL }).single()

      if (createError) {
        console.error("Error al crear tabla group_members:", createError)
        return NextResponse.json({ error: "Error al crear tabla group_members" }, { status: 500 })
      }

      return NextResponse.json({ message: "Tabla group_members creada correctamente" })
    }

    return NextResponse.json({ message: "Tabla group_members ya existe" })
  } catch (error) {
    console.error("Error al verificar/crear tabla group_members:", error)
    return NextResponse.json({ error: "Error al verificar/crear tabla group_members" }, { status: 500 })
  }
}
