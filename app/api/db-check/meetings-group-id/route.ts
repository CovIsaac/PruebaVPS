import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""

export async function GET() {
  try {
    console.log("Verificando estructura de la tabla meetings y campo group_id")

    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar la estructura de la tabla meetings
    const { data: tableInfo, error: tableError } = await supabase.rpc("execute_sql", {
      query_text: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'meetings'
          ORDER BY ordinal_position;
        `,
      query_params: [],
    })

    if (tableError) {
      console.error("Error al verificar estructura de la tabla:", tableError)
      return NextResponse.json(
        { error: "Error al verificar estructura de la tabla: " + tableError.message },
        { status: 500 },
      )
    }

    // Verificar si existe el campo group_id
    const hasGroupIdField = tableInfo.some((col) => col.column_name === "group_id")

    // Obtener algunas reuniones para verificar si tienen group_id
    const { data: meetings, error: meetingsError } = await supabase
      .from("meetings")
      .select("id, title, group_id")
      .limit(10)

    if (meetingsError) {
      console.error("Error al obtener reuniones:", meetingsError)
      return NextResponse.json({ error: "Error al obtener reuniones: " + meetingsError.message }, { status: 500 })
    }

    // Contar cuántas reuniones tienen group_id
    const meetingsWithGroupId = meetings?.filter((m) => m.group_id) || []

    return NextResponse.json({
      tableStructure: tableInfo,
      hasGroupIdField,
      totalMeetings: meetings?.length || 0,
      meetingsWithGroupId: meetingsWithGroupId.length,
      sampleMeetings: meetings?.slice(0, 5) || [],
    })
  } catch (error) {
    console.error("Error al verificar la estructura de meetings:", error)
    return NextResponse.json(
      { error: "Error interno del servidor: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}
