import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()

    // Intentar crear la función execute_sql directamente con una consulta SQL
    const { data, error } = await supabase
      .from("_temp")
      .select("*")
      .limit(1)
      .then(async () => {
        try {
          // Ejecutar SQL directamente para crear la función
          const result = await supabase.from("_temp").select("*").limit(1)

          // Crear la función execute_sql usando SQL directo
          const sqlQuery = `
          CREATE OR REPLACE FUNCTION execute_sql(query_text TEXT, query_params JSONB DEFAULT '[]'::JSONB)
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result JSONB;
          BEGIN
            EXECUTE query_text INTO result USING query_params;
            RETURN result;
          EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object(
              'error', SQLERRM,
              'detail', SQLSTATE
            );
          END;
          $$;
          `

          // Usar la API REST de Supabase para ejecutar SQL directamente
          const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.SUPABASE_ANON_KEY || "",
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
            },
            body: JSON.stringify({
              query_text: sqlQuery,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            return { data: null, error: errorData }
          }

          return { data: { success: true }, error: null }
        } catch (err) {
          console.error("Error al crear función execute_sql:", err)
          return { data: null, error: err }
        }
      })

    if (error) {
      console.error("Error al crear función execute_sql:", error)
      return NextResponse.json({ error: "Error al crear función execute_sql" }, { status: 500 })
    }

    return NextResponse.json({ message: "Función execute_sql creada correctamente" })
  } catch (error) {
    console.error("Error al crear función execute_sql:", error)
    return NextResponse.json({ error: "Error al crear función execute_sql" }, { status: 500 })
  }
}
