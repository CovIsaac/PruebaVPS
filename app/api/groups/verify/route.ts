import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    // Obtener el nombre de usuario del encabezado
    const username = request.headers.get("X-Username")
    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // Obtener el código del cuerpo de la solicitud
    const { code } = await request.json()
    if (!code) {
      return NextResponse.json({ error: "Código no proporcionado" }, { status: 400 })
    }

    console.log("Verificando código de grupo:", code, "para usuario:", username)

    // Buscar el grupo con ese código de invitación
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name, join_code")
      .eq("join_code", code)
      .maybeSingle()

    if (groupError) {
      console.error("Error al verificar código de invitación:", groupError)
      return NextResponse.json({ error: "Error al verificar código de invitación" }, { status: 500 })
    }

    if (!group) {
      return NextResponse.json({ error: "Código de invitación inválido" }, { status: 404 })
    }

    console.log(`Código de invitación válido para el grupo: ${group.name} (${group.id})`)

    // Buscar el usuario en la tabla profiles
    const { data: userProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle()

    if (profilesError) {
      console.error("Error al buscar usuario en profiles:", profilesError)
      return NextResponse.json({ error: "Error al buscar usuario" }, { status: 500 })
    }

    // Si no encontramos el usuario en profiles, intentamos en la tabla users
    let userId = userProfiles?.id

    if (!userId) {
      const { data: userRecord, error: usersError } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .maybeSingle()

      if (usersError) {
        console.error("Error al buscar usuario en users:", usersError)
        return NextResponse.json({ error: "Error al buscar usuario" }, { status: 500 })
      }

      userId = userRecord?.id
    }

    // Si no encontramos el usuario en ninguna tabla
    if (!userId) {
      console.error(`Usuario no encontrado: ${username}`)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Verificar si el usuario ya pertenece a un grupo
    const { data: existingMembership, error: membershipError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId)
      .maybeSingle()

    if (membershipError) {
      console.error("Error al verificar membresía existente:", membershipError)
      return NextResponse.json({ error: "Error al verificar membresía existente" }, { status: 500 })
    }

    if (existingMembership) {
      return NextResponse.json(
        { error: "El usuario ya pertenece a un grupo. Debe abandonar el grupo actual antes de unirse a otro." },
        { status: 400 },
      )
    }

    // Devolver información básica del grupo
    return NextResponse.json({
      id: group.id,
      name: group.name,
      code: group.join_code,
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message || "Error desconocido",
      },
      { status: 500 },
    )
  }
}
