import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""

export async function GET() {
  try {
    console.log("Actualizando estructura de la tabla meetings para group_id")

    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Leer el archivo SQL
    const sqlFilePath = path.join(process.cwd(), "update-meetings-group-id.sql")
    const sqlQuery = fs.existsSync(sqlFilePath)
      ? fs.readFileSync(sqlFilePath, "utf8")
      : `
        -- Verificar si la columna group_id existe en la tabla meetings
        DO $$
        BEGIN
            -- Verificar si la columna ya existe
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'meetings'
                AND column_name = 'group_id'
            ) THEN
                -- Si no existe, añadir la columna
                ALTER TABLE meetings ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE SET NULL;
                RAISE NOTICE 'Columna group_id añadida a la tabla meetings';
            ELSE
                RAISE NOTICE 'La columna group_id ya existe en la tabla meetings';
            END IF;
        END $$;

        -- Crear un índice para mejorar el rendimiento de las consultas por group_id
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE tablename = 'meetings'
                AND indexname = 'meetings_group_id_idx'
            ) THEN
                CREATE INDEX meetings_group_id_idx ON meetings(group_id);
                RAISE NOTICE 'Índice meetings_group_id_idx creado';
            ELSE
                RAISE NOTICE 'El índice meetings_group_id_idx ya existe';
            END IF;
        END $$;

        -- Mostrar algunas estadísticas sobre las reuniones y sus grupos
        SELECT 
            COUNT(*) AS total_meetings,
            COUNT(group_id) AS meetings_with_group_id,
            COUNT(DISTINCT group_id) AS unique_groups
        FROM meetings;
      `

    // Ejecutar el script SQL
    const { data, error } = await supabase.rpc("execute_sql", {
      query_text: sqlQuery,
      query_params: [],
    })

    if (error) {
      console.error("Error al ejecutar el script SQL:", error)
      return NextResponse.json({ error: "Error al ejecutar el script SQL: " + error.message }, { status: 500 })
    }

    console.log("Resultado de la actualización:", data)

    return NextResponse.json({
      success: true,
      message: "Estructura de la tabla meetings actualizada correctamente",
      data,
    })
  } catch (error) {
    console.error("Error al actualizar la estructura de meetings:", error)
    return NextResponse.json(
      { error: "Error interno del servidor: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}
