import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar conexión a la base de datos
    const { data: connectionTest, error: connectionError } = await supabase
      .from("_temp")
      .select("*")
      .limit(1)
      .catch(() => {
        return { data: null, error: { message: "Error de conexión a la base de datos" } }
      })

    if (connectionError) {
      console.error("Error de conexión a la base de datos:", connectionError)
      return NextResponse.json(
        {
          status: "error",
          connection: false,
          message: "Error de conexión a la base de datos",
          error: connectionError,
        },
        { status: 500 },
      )
    }

    // Verificar tablas existentes
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")

    if (tablesError) {
      console.error("Error al verificar tablas:", tablesError)
      return NextResponse.json(
        {
          status: "error",
          connection: true,
          tables: false,
          message: "Error al verificar tablas",
          error: tablesError,
        },
        { status: 500 },
      )
    }

    const existingTables = tables?.map((t) => t.table_name) || []
    const requiredTables = [
      "profiles",
      "organizations",
      "organization_members",
      "meetings",
      "transcriptions",
      "speakers",
    ]
    const missingTables = requiredTables.filter((t) => !existingTables.includes(t))

    return NextResponse.json({
      status: "success",
      connection: true,
      tables: {
        existing: existingTables,
        missing: missingTables,
        complete: missingTables.length === 0,
      },
    })
  } catch (error) {
    console.error("Error al verificar estado de la base de datos:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error al verificar estado de la base de datos",
        error,
      },
      { status: 500 },
    )
  }
}
