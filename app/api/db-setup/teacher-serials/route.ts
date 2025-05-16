import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Leer el archivo SQL
    const sqlFilePath = path.join(process.cwd(), "create-teacher-serials-table.sql")
    let sqlQuery = ""

    try {
      sqlQuery = fs.readFileSync(sqlFilePath, "utf8")
    } catch (err) {
      console.error("Error al leer el archivo SQL:", err)
      return NextResponse.json({ success: false, message: "Error al leer el archivo SQL" }, { status: 500 })
    }

    // Ejecutar la consulta SQL
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.rpc("execute_sql", {
      query_text: sqlQuery,
    })

    if (error) {
      console.error("Error al ejecutar SQL:", error)
      return NextResponse.json(
        { success: false, message: `Error al configurar la tabla: ${error.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { success: true, message: "Tabla teacher_serials configurada correctamente" },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error al configurar la tabla teacher_serials:", error)
    return NextResponse.json(
      { success: false, message: "Error al configurar la tabla teacher_serials" },
      { status: 500 },
    )
  }
}
