import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    // Obtener el código de invitación y el nombre de usuario del cuerpo de la solicitud
    const { joinCode, username } = await request.json()

    if (!joinCode) {
      return NextResponse.json({ error: "Se requiere un código de invitación" }, { status: 400 })
    }

    if (!username) {
      return NextResponse.json({ error: "Se requiere un nombre de usuario" }, { status: 400 })
    }

    console.log(`Verificando código de invitación: ${joinCode} para usuario: ${username}`)

    // Buscar el grupo con ese código de invitación
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name, join_code")
      .eq("join_code", joinCode)
      .single()

    if (groupError || !group) {
      console.error("Error al buscar grupo con código de invitación:", groupError)
      return NextResponse.json({ error: "Código de invitación inválido o expirado" }, { status: 404 })
    }

    console.log(`Grupo encontrado: ${group.name} (${group.id})`)

    // Buscar el usuario en la tabla profiles en lugar de users
    // Usamos maybeSingle() en lugar de single() para evitar errores si no se encuentra
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

    console.log(`Usuario encontrado: ${username} (${userId})`)

    // Verificar si el usuario ya es miembro del grupo
    const { data: existingMember, error: memberCheckError } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", userId)
      .maybeSingle()

    if (memberCheckError) {
      console.error("Error al verificar membresía existente:", memberCheckError)
      return NextResponse.json({ error: "Error al verificar membresía" }, { status: 500 })
    }

    if (existingMember) {
      console.log(`El usuario ${username} ya es miembro del grupo ${group.name}`)
      return NextResponse.json({ error: "Ya eres miembro de este grupo" }, { status: 400 })
    }

    // Añadir al usuario como miembro del grupo
    const { data: newMember, error: joinError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: userId,
        is_admin: false, // Por defecto, los nuevos miembros no son administradores
        joined_at: new Date().toISOString(),
      })
      .select()

    if (joinError) {
      console.error("Error al unirse al grupo:", joinError)
      return NextResponse.json({ error: "Error al unirse al grupo" }, { status: 500 })
    }

    console.log(`Usuario ${username} añadido al grupo ${group.name} exitosamente`)

    return NextResponse.json({
      success: true,
      message: `Te has unido al grupo "${group.name}"`,
      group: {
        id: group.id,
        name: group.name,
        code: group.join_code,
      },
    })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
