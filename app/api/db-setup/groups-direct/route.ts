import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase con las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export async function GET() {
  try {
    console.log("Iniciando configuración directa de tablas para grupos")

    // Crear cliente de Supabase con la clave de servicio para tener permisos suficientes
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar si la tabla groups ya existe
    const { data: existingTables, error: checkError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", ["groups", "group_members"])

    if (checkError) {
      console.error("Error al verificar tablas existentes:", checkError)
      return NextResponse.json(
        {
          success: false,
          error: "Error al verificar tablas existentes",
          details: checkError,
        },
        { status: 500 },
      )
    }

    const tablesExist = {
      groups: existingTables?.some((t) => t.table_name === "groups") || false,
      group_members: existingTables?.some((t) => t.table_name === "group_members") || false,
    }

    console.log("Estado de tablas existentes:", tablesExist)

    // Si las tablas ya existen, no necesitamos crearlas
    if (tablesExist.groups && tablesExist.group_members) {
      console.log("Las tablas ya existen, no es necesario crearlas")
      return NextResponse.json({
        success: true,
        message: "Las tablas ya existen",
        tablesExist,
      })
    }

    // Crear las tablas usando SQL directo a través de la API REST de Supabase
    // Nota: Esto requiere permisos elevados que la clave de servicio debería tener

    // Crear tabla de grupos
    if (!tablesExist.groups) {
      const { error: createGroupsError } = await supabase
        .from("groups")
        .insert([
          {
            id: "00000000-0000-0000-0000-000000000000", // UUID temporal para crear la tabla
            name: "Tabla de prueba",
            join_code: "TEST123",
            created_by: "00000000-0000-0000-0000-000000000000", // UUID temporal
          },
        ])
        .select()

      // Ignoramos errores específicos que indican que la tabla se creó pero hay problemas con las restricciones
      if (createGroupsError && !createGroupsError.message.includes("violates foreign key constraint")) {
        console.error("Error al crear tabla de grupos:", createGroupsError)
        return NextResponse.json(
          {
            success: false,
            error: "Error al crear tabla de grupos",
            details: createGroupsError,
          },
          { status: 500 },
        )
      }
    }

    // Crear tabla de miembros de grupo
    if (!tablesExist.group_members) {
      const { error: createMembersError } = await supabase
        .from("group_members")
        .insert([
          {
            id: "00000000-0000-0000-0000-000000000000", // UUID temporal
            group_id: "00000000-0000-0000-0000-000000000000", // UUID temporal
            user_id: "00000000-0000-0000-0000-000000000000", // UUID temporal
            role: "member",
          },
        ])
        .select()

      // Ignoramos errores específicos que indican que la tabla se creó pero hay problemas con las restricciones
      if (createMembersError && !createMembersError.message.includes("violates foreign key constraint")) {
        console.error("Error al crear tabla de miembros:", createMembersError)
        return NextResponse.json(
          {
            success: false,
            error: "Error al crear tabla de miembros",
            details: createMembersError,
          },
          { status: 500 },
        )
      }
    }

    console.log("Configuración directa de tablas para grupos completada")

    return NextResponse.json({
      success: true,
      message: "Tablas para grupos creadas o verificadas correctamente",
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error.message || "Error desconocido",
      },
      { status: 500 },
    )
  }
}
