import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase con las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export async function GET() {
  try {
    console.log("Iniciando configuración de tablas para grupos")

    // Crear cliente de Supabase con la clave de servicio para tener permisos suficientes
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Intentar habilitar la extensión uuid-ossp directamente con SQL
    const { error: extensionError } = await supabase
      .rpc("exec_sql", {
        sql_query: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
      })
      .catch((err) => {
        console.log("Error al ejecutar RPC para extensión uuid-ossp:", err)
        return { error: err }
      })

    if (extensionError) {
      console.error("Error al habilitar extensión uuid-ossp:", extensionError)
      // Continuamos de todos modos, ya que la extensión podría estar habilitada
      console.log("Continuando con la creación de tablas...")
    } else {
      console.log("Extensión uuid-ossp habilitada correctamente")
    }

    // Crear tabla de grupos
    const createGroupsTableQuery = `
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        join_code VARCHAR(20) NOT NULL UNIQUE,
        created_by UUID NOT NULL REFERENCES profiles(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: groupsTableError } = await supabase
      .rpc("exec_sql", {
        sql_query: createGroupsTableQuery,
      })
      .catch((err) => {
        console.log("Error al ejecutar RPC para crear tabla de grupos:", err)
        return { error: err }
      })

    if (groupsTableError) {
      console.error("Error al crear tabla de grupos:", groupsTableError)
      return NextResponse.json(
        {
          success: false,
          error: "Error al crear tabla de grupos",
          details: groupsTableError,
        },
        { status: 500 },
      )
    }

    // Crear tabla de miembros de grupo
    const createMembersTableQuery = `
      CREATE TABLE IF NOT EXISTS group_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL DEFAULT 'member',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(group_id, user_id)
      );
    `

    const { error: membersTableError } = await supabase
      .rpc("exec_sql", {
        sql_query: createMembersTableQuery,
      })
      .catch((err) => {
        console.log("Error al ejecutar RPC para crear tabla de miembros:", err)
        return { error: err }
      })

    if (membersTableError) {
      console.error("Error al crear tabla de miembros de grupo:", membersTableError)
      return NextResponse.json(
        {
          success: false,
          error: "Error al crear tabla de miembros de grupo",
          details: membersTableError,
        },
        { status: 500 },
      )
    }

    // Crear índices
    const createIndicesQuery = `
      CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
      CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
      CREATE INDEX IF NOT EXISTS idx_groups_join_code ON groups(join_code);
    `

    const { error: indicesError } = await supabase
      .rpc("exec_sql", {
        sql_query: createIndicesQuery,
      })
      .catch((err) => {
        console.log("Error al ejecutar RPC para crear índices:", err)
        return { error: err }
      })

    if (indicesError) {
      console.error("Error al crear índices:", indicesError)
      return NextResponse.json(
        {
          success: false,
          error: "Error al crear índices",
          details: indicesError,
        },
        { status: 500 },
      )
    }

    console.log("Configuración de tablas para grupos completada con éxito")

    return NextResponse.json({
      success: true,
      message: "Tablas para grupos creadas correctamente",
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
