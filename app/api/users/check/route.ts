import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username")

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

    // Verificar si el usuario existe en la tabla profiles
    // Seleccionamos las columnas que sabemos que existen
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id, username, full_name, team, role")
      .eq("username", username)
      .limit(1)

    if (userError) {
      console.error("Error al verificar usuario en Supabase:", userError)
      return NextResponse.json({ error: `Error al verificar usuario: ${userError.message}` }, { status: 500 })
    }

    if (!userData || userData.length === 0) {
      return NextResponse.json({ exists: false, message: `Usuario "${username}" no encontrado` }, { status: 200 })
    }

    return NextResponse.json({ exists: true, user: userData[0] }, { status: 200 })
  } catch (err) {
    console.error("Error al verificar usuario:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
