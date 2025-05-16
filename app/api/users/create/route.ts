import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, full_name, team, role } = body

    if (!username) {
      return NextResponse.json({ error: "Se requiere un nombre de usuario" }, { status: 400 })
    }

    // Crear cliente de Supabase para el servidor
    const supabaseUrl = process.env.SUPABASE_URL || ""
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no disponible" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Crear el usuario en la tabla profiles
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .insert([
        {
          username,
          full_name: full_name || username,
          team: team || null,
          role: role || null,
        },
      ])
      .select("id, username, full_name, team, role")

    if (userError) {
      console.error("Error al crear usuario en Supabase:", userError)
      return NextResponse.json({ error: `Error al crear usuario: ${userError.message}` }, { status: 500 })
    }

    if (!userData || userData.length === 0) {
      return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 })
    }

    return NextResponse.json({ user: userData[0] }, { status: 201 })
  } catch (err) {
    console.error("Error al crear usuario:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
